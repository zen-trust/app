import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Session,
  UseGuards,
} from '@nestjs/common'
import type {
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
} from '@simplewebauthn/server'
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { ApiForbiddenResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { Session as SessionData } from '@fastify/secure-session'
import { User as UserEntity } from '../user/user.entity.js'
import { AuthenticationService } from './authentication.service.js'
import { tokenGuard } from './token.guard.js'
import { User } from './user.decorator.js'
import type { Authenticator } from './authenticator/authenticator.entity.js'
import { sessionGuard } from './session.guard.js'
import { Gate } from './gate.guard.js'
import { VerifyAssertionRequest } from './webauthn/verify-assertion.request.js'
import { VerifyAttestationRequest } from './webauthn/verify-attestation.request.js'

@Controller('authentication')
@ApiTags('authentication')
export class AuthenticationController {
  public constructor(
    @Inject(AuthenticationService) private readonly authenticationService: AuthenticationService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  @Get('assertion/generate')
  @ApiOkResponse({ description: 'Assertion options' })
  public async generateAssertion(@Session() session: SessionData) {
    const options = await this.authenticationService.generatePasskeyAuthenticationOptions()

    session.set('passkey.challenge', options.challenge)

    return options
  }

  @ApiOkResponse({
    description: 'Passkey verification successful',
  })
  @ApiForbiddenResponse({
    description: 'Invalid challenge, invalid assertion, or invalid authenticator',
  })
  @Post('assertion/verify')
  public async verifyAssertion(
    @Session() session: SessionData,
    @Body() body: VerifyAssertionRequest,
  ) {
    const expectedChallenge = session.get('passkey.challenge')
    let verification: VerifiedAuthenticationResponse
    let authenticator: Authenticator

    if (!expectedChallenge) {
      throw new ForbiddenException('Invalid state: No challenge requested')
    }

    try {
      const result = await this.authenticationService.verifyAssertion(body, expectedChallenge)
      verification = result.verification
      authenticator = result.authenticator
    } catch (error) {
      throw new ForbiddenException((error as Error).message)
    } finally {
      session.set('passkey.challenge', undefined)
    }

    const { verified } = verification

    if (!verified) {
      throw new ForbiddenException('Verification failed')
    }

    session.set('authenticated', true)
    session.set('passkey.authenticator', authenticator.id.toString())
    session.set('user.id', authenticator.user_id.toString())
  }

  @ApiOkResponse({
    description: 'Attestation options',
  })
  @Gate([sessionGuard(), tokenGuard({ anyScope: ['profile', 'onboarding'] })])
  @Get('attestation/generate')
  public async generateAttestation(@Session() session: SessionData, @User() user: UserEntity) {
    const options = await this.authenticationService.generatePasskeyRegistrationOptions(user)
    session.set('passkey.challenge', options.challenge)

    return options
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Successful verification',
  })
  @Gate([sessionGuard(), tokenGuard({ anyScope: ['profile', 'onboarding'] })])
  @Post('attestation/verify')
  public async verifyAttestation(
    @Session() session: SessionData,
    @User() user: UserEntity,
    @Body() body: VerifyAttestationRequest,
  ) {
    const expectedChallenge = session.get('passkey.challenge')
    let verification: VerifiedRegistrationResponse
    let authenticator: Authenticator

    if (!expectedChallenge) {
      throw new ForbiddenException('Invalid state: No challenge requested')
    }

    try {
      const attestationResult = await this.authenticationService.verifyAttestation(
        user,
        body,
        expectedChallenge,
      )
      verification = attestationResult.verification
      authenticator = attestationResult.authenticator
    } catch (error) {
      throw new ForbiddenException((error as Error).message)
    } finally {
      await this.cache.del(`passkey.challenge.${user.id}`)
    }

    const { verified } = verification

    if (!verified) {
      throw new ForbiddenException('Verification failed')
    }

    session.set('passkey.authenticator', authenticator.id.toString())
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @UseGuards(sessionGuard())
  @Post('session/terminate')
  public terminateSession(@Session() session: SessionData) {
    session.delete()
  }
}
