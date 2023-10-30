import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { IsBase64, IsString } from 'class-validator'
import { FastifyRequest } from 'fastify'
import { ActiveEncryptionSessionGuard } from './active-encryption-session.guard.js'
import { EncryptionSessionId } from './encryption-session-id.decorator.js'
import { EncryptionSessionService } from './encryption-session.service.js'

class CreateSessionRequest {
  @IsString()
  readonly publicKey!: string
}

interface CreateSessionResponse {
  data: {
    publicKey: string
  }
}

class VerifySessionRequest {
  @IsString()
  @IsBase64()
  readonly secret!: string
}

interface VerifySessionResponse {
  data: {
    message: string
  }
}

@Controller('encryption-session')
@ApiTags('Encryption Session')
export class EncryptionSessionController {
  constructor(
    @Inject(EncryptionSessionService) private readonly sessionService: EncryptionSessionService,
  ) {}

  @ApiOkResponse()
  @Post()
  public async createEncryptionSession(
    @Req() request: FastifyRequest,
    @Body() body: CreateSessionRequest,
  ): Promise<CreateSessionResponse> {
    const { publicKey, sessionId } = await this.sessionService.createSession(body.publicKey)

    request.session.set('encryption.session', sessionId)

    return {
      data: {
        publicKey,
      },
    }
  }

  @ApiOkResponse()
  @Put('verify')
  @UseGuards(ActiveEncryptionSessionGuard)
  public async verifySessionTodoRemoveThisFunctionSoon(
    @EncryptionSessionId() sessionId: string,
    @Body() body: VerifySessionRequest,
  ) {
    let decrypted: Buffer

    try {
      decrypted = await this.sessionService.decryptSecret(sessionId, body.secret)
    } catch (error) {
      throw new BadRequestException('Invalid secret')
    }

    return {
      data: {
        message: Buffer.from(decrypted).toString('base64'),
      },
    } satisfies VerifySessionResponse
  }
}
