import type { HttpRedirectResponse } from '@nestjs/common'
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Redirect,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { IsBase64, IsString } from 'class-validator'
import { FastifyRequest } from 'fastify'
import { tokenGuard } from '../authentication/token.guard.js'
import { User } from '../authentication/user.decorator.js'
import { Record } from '../database/record.pipe.js'
import { ActiveEncryptionSessionGuard } from '../encryption-session/active-encryption-session.guard.js'
import { EncryptionSessionId } from '../encryption-session/encryption-session-id.decorator.js'
import { EncryptionSessionService } from '../encryption-session/encryption-session.service.js'
import { jsonApiResponse } from '../json-api/json-api.interceptor.js'
import { User as UserEntity } from '../user/user.entity.js'
import { RootCa } from './root-ca.entity.js'
import { RootCaService } from './root-ca.service.js'

class CreateRootCaBody {
  @IsString()
  @IsBase64()
  passPhrase!: string
}

@Controller('root-ca')
@ApiTags('root-ca', 'ca')
export class RootCaController {
  public constructor(
    @Inject(RootCaService) private readonly rootCaService: RootCaService,
    @Inject(EncryptionSessionService) private readonly encryptionSession: EncryptionSessionService,
  ) {}

  @ApiOkResponse()
  @Get()
  @UseGuards(tokenGuard({ allScopes: ['pki'] }))
  @UseInterceptors(jsonApiResponse({}))
  public list() {
    return this.rootCaService.all()
  }

  @ApiOkResponse()
  @Get(':id/ca')
  @UseGuards(tokenGuard({ allScopes: ['pki'] }))
  @UseInterceptors(jsonApiResponse({}))
  public listCas(@Record('id', RootCaService) rootCa: RootCa) {
    return this.rootCaService.allCas(rootCa)
  }

  @ApiOkResponse()
  @Get(':id')
  @UseGuards(tokenGuard({ allScopes: ['pki'] }))
  @UseInterceptors(
    jsonApiResponse({
      links: (rootCa) => ({
        cas: `/root-ca/${(rootCa as RootCa).id}/ca`,
        certificate: `/root-ca/${(rootCa as RootCa).id}/certificate`,
      }),
    }),
  )
  public findOne(@Record('id', RootCaService) rootCa: RootCa) {
    return rootCa
  }

  @ApiOkResponse()
  @Get(':id/certificate')
  @Redirect()
  public findOneCertificate(@Req() request: FastifyRequest, @Param('id') id: string) {
    const accept = (request.headers.accept ?? '*/*').split(';').shift()

    switch (accept) {
      case 'application/x-pem-file':
        return {
          url: `/root-ca/${id}/certificate.pem`,
          statusCode: 302,
        } satisfies HttpRedirectResponse

      case 'application/x-x509-ca-cert':
        return {
          url: `/root-ca/${id}/certificate.der`,
          statusCode: 302,
        } satisfies HttpRedirectResponse

      case '*/*':
      case 'application/json':
        return {
          url: `/root-ca/${id}/certificate.json`,
          statusCode: 302,
        } satisfies HttpRedirectResponse

      default:
        throw new HttpException('Unsupported certificate format', 406)
    }
  }

  @ApiOkResponse()
  @Get(':id/certificate.json')
  @Header('Content-Type', 'application/json')
  @UseInterceptors(
    jsonApiResponse({
      links: (rootCa) => ({
        self: `/root-ca/${(rootCa as RootCa).id}/certificate`,
        json: `/root-ca/${(rootCa as RootCa).id}/certificate.json`,
        pem: `/root-ca/${(rootCa as RootCa).id}/certificate.pem`,
        der: `/root-ca/${(rootCa as RootCa).id}/certificate.der`,
      }),
    }),
  )
  public findOneCertificateAsJson(@Record('id', RootCaService) rootCa: RootCa) {
    return rootCa.certificate
  }

  @ApiOkResponse()
  @Get(':id/certificate.pem')
  @Header('Content-Type', 'application/x-pem-file')
  public findOneCertificateAsPem(@Record('id', RootCaService) rootCa: RootCa) {
    return rootCa.certificate.toString()
  }

  @ApiOkResponse()
  @Get(':id/certificate.der')
  @Header('Content-Type', 'application/x-x509-ca-cert')
  public findOneCertificateAsDer(@Record('id', RootCaService) rootCa: RootCa) {
    return rootCa.certificate.toBuffer()
  }

  @ApiOkResponse()
  @Post(':id/ca')
  @UseGuards(tokenGuard({ allScopes: ['pki'] }))
  @Redirect('/ca', 307)
  public async createIntermediateCa(
    @User() user: UserEntity,
    @Record('id', RootCaService) rootCa: RootCa,
  ) {
    if (!rootCa.active) {
      throw new HttpException('Root CA is not active. Please activate it first', 403)
    }

    if (new Date(rootCa.validUntil) < new Date()) {
      throw new HttpException('Root CA is expired', 403)
    }

    if (rootCa.revoked) {
      throw new HttpException('Root CA is revoked', 403)
    }

    const intermediateCa = await this.rootCaService.issueIntermediateCa(rootCa, {
      commonName: 'Fides Intermediate CA',
      tags: {},
      user,
    })

    console.log(intermediateCa)
  }

  @ApiOkResponse()
  @Post()
  @UseGuards(tokenGuard({ allScopes: ['pki'] }))
  @UseGuards(ActiveEncryptionSessionGuard)
  @UseInterceptors(jsonApiResponse({}))
  public async create(
    @Body() body: CreateRootCaBody,
    @User() user: UserEntity,
    @EncryptionSessionId() encryptionSessionId: string,
  ) {
    const passPhrase = await this.encryptionSession.decryptSecret(
      encryptionSessionId,
      body.passPhrase,
    )

    return this.rootCaService.issue({
      commonName: 'Fides Root CA',
      passPhrase,
      tags: {},
      user,
    })
  }

  @ApiOkResponse()
  @Put(':id/activate')
  @UseGuards(tokenGuard({ allScopes: ['pki'] }))
  public async activate(@Record('id', RootCaService) rootCa: RootCa) {
    if (rootCa.active) {
      throw new HttpException('Root CA is already active', 409)
    }

    if (new Date(rootCa.validUntil) < new Date()) {
      throw new HttpException('Root CA is expired', 403)
    }

    if (rootCa.revoked) {
      throw new HttpException('Root CA is revoked', 403)
    }

    await this.rootCaService.activate(rootCa)
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @Put(':id/revoke')
  @UseGuards(tokenGuard({ allScopes: ['pki'] }))
  public async revoke(@Record('id', RootCaService) rootCa: RootCa) {
    if (rootCa.active) {
      throw new HttpException('Root CA is active. Please deactivate it first', 403)
    }

    if (rootCa.revoked) {
      throw new HttpException('Root CA is already revoked', 409)
    }

    // TODO: Check if any other CA is still active

    // TODO: Check if there are any intermediate CAs signed by this CA

    await this.rootCaService.revoke(rootCa)
  }
}
