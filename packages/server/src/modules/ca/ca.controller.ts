import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { Transform, Type } from 'class-transformer'
import { IsBase64, IsDateString, IsOptional, IsString, Length } from 'class-validator'
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Record } from '../database/record.pipe.js'
import { ActiveEncryptionSessionGuard } from '../encryption-session/active-encryption-session.guard.js'
import { EncryptionSessionId } from '../encryption-session/encryption-session-id.decorator.js'
import { EncryptionSessionService } from '../encryption-session/encryption-session.service.js'
import { User } from '../authentication/user.decorator.js'
import { User as UserEntity } from '../user/user.entity.js'
import { tokenGuard } from '../authentication/token.guard.js'
import { JsonApiResponse } from '../json-api/json-api.interceptor.js'
import { Gate } from '../authentication/gate.guard.js'
import { sessionGuard } from '../authentication/session.guard.js'
import { CaService } from './ca.service.js'
import { Ca } from './ca.entity.js'

class IssueCaRequest {
  @IsString()
  @IsBase64()
  readonly signingPassPhrase!: string

  @IsString()
  @Length(1, 250)
  @Transform(({ value }: { value: string }) => value.trim())
  readonly subject!: string

  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }: { value: string }) => new Date(value))
  readonly validFrom?: Date

  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }: { value: string }) => new Date(value))
  readonly validUntil?: Date
}

@Controller('ca')
@ApiTags('ca')
export class CaController {
  public constructor(
    @Inject(CaService) private readonly caService: CaService,
    @Inject(EncryptionSessionService)
    private readonly encryptionSessionService: EncryptionSessionService,
  ) {}

  @ApiOkResponse({
    description: 'List of CAs',
  })
  @Gate([sessionGuard(), tokenGuard({ allScopes: ['pki'] })])
  @JsonApiResponse({
    links: {
      rootCas: '/root-ca',
    },
  })
  @Get()
  public list() {
    return this.caService.all()
  }

  @ApiOkResponse({
    description: 'Properties of the CA',
  })
  @Gate([sessionGuard(), tokenGuard({ allScopes: ['pki'] })])
  @JsonApiResponse()
  @Get(':id')
  public get(@Record('id', CaService) ca: Ca) {
    return ca
  }

  @ApiOkResponse()
  @UseGuards(ActiveEncryptionSessionGuard)
  @Gate([sessionGuard(), tokenGuard({ allScopes: ['pki'] })])
  @JsonApiResponse()
  @Post()
  public async create(
    @EncryptionSessionId() encryptionSessionId: string,
    @User() user: UserEntity,
    @Body() body: IssueCaRequest,
  ) {
    const signingKey = await this.encryptionSessionService.decryptSecret(
      encryptionSessionId,
      body.signingPassPhrase,
    )

    return this.caService.issue(
      {
        subject: body.subject,
        tags: {
          'ca-type': 'intermediate',
        },
        validFrom: body.validFrom ?? new Date(),
        validUntil: body.validUntil ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        user,
      },
      signingKey,
    )
  }

  @ApiNoContentResponse()
  @ApiConflictResponse({
    description: 'CA is already active',
  })
  @ApiForbiddenResponse({
    description: 'CA is expired or revoked',
  })
  @Gate([sessionGuard(), tokenGuard({ allScopes: ['pki'] })])
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/activate')
  public async activate(@Record('id', CaService) ca: Ca) {
    if (ca.active) {
      throw new ConflictException('CA is already active')
    }

    if (new Date(ca.validUntil) < new Date()) {
      throw new ForbiddenException('CA is expired')
    }

    if (ca.revoked) {
      throw new ForbiddenException('CA is revoked')
    }

    await this.caService.enable(ca)
  }

  @ApiNoContentResponse()
  @ApiConflictResponse({
    description: 'CA is already revoked',
  })
  @ApiForbiddenResponse({
    description: 'CA is active',
  })
  @Gate([sessionGuard(), tokenGuard({ allScopes: ['pki'] })])
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/revoke')
  async revoke(@Record('id', CaService) ca: Ca) {
    if (ca.revoked) {
      throw new ConflictException('CA is already revoked')
    }

    if (ca.active) {
      throw new ForbiddenException('CA is active. Please deactivate it first')
    }

    // TODO: Check if any other CA is still active
    // TODO: Check if there are any intermediate CAs signed by this CA

    await this.caService.revoke(ca)
  }
}
