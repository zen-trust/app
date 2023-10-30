import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { VerifiedAuthenticationResponse } from '@simplewebauthn/server'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialDescriptorFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types'
import { pgBytesToBuffer } from '../../crypto/conversion.js'
import { TokenService } from '../token/token.service.js'
import type { User } from '../user/user.entity.js'
import { UserService } from '../user/user.service.js'
import type { Authenticator } from './authenticator/authenticator.entity.js'
import { AuthenticatorService } from './authenticator/authenticator.service.js'

@Injectable()
export class AuthenticationService {
  public constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(AuthenticatorService) private readonly authenticatorService: AuthenticatorService,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  public async generatePasskeyAuthenticationOptions() {
    const rpID = this.getServerRelayPartyId()

    return generateAuthenticationOptions({
      userVerification: 'preferred',

      // TODO: This should be the domain of the relay party which should be
      //      configurable in the environment variables instead.
      rpID,
      timeout: 60_000,
    })
  }

  public async generatePasskeyRegistrationOptions(user: User) {
    const rpID = this.getServerRelayPartyId()
    const authenticators = await this.authenticatorService.allForUser(user)

    return generateRegistrationOptions({
      // TODO: This should be the domain of the relay party which should be
      //      configurable in the environment variables instead.
      rpName: 'zen-trust.net',

      rpID,
      userID: user.id,
      userDisplayName: user.name,
      userName: user.email,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'required',
      },
      excludeCredentials: authenticators.map(
        (authenticator: Authenticator): PublicKeyCredentialDescriptorFuture => ({
          id: Buffer.from(authenticator.externalIdentifier),
          type: 'public-key',
          transports: authenticator.transports,
        }),
      ),
    })
  }

  public async verifyAttestation(
    user: User,
    response: RegistrationResponseJSON,
    expectedChallenge: string,
  ) {
    const expectedRPID = this.getServerRelayPartyId()
    const publicUrl = this.configService.get<string>('PUBLIC_URL') ?? ''
    const expectedOrigin = new URL(publicUrl).origin

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    })

    const registrationInfo = verification.registrationInfo

    if (typeof registrationInfo === 'undefined') {
      throw new Error('Unexpected state: registrationInfo is undefined')
    }

    const authenticator = await this.authenticatorService.createFromRegistration(
      user,
      registrationInfo,
      response,
    )

    return { verification, authenticator }
  }

  public async verifyAssertion(
    response: AuthenticationResponseJSON,
    expectedChallenge: string,
  ): Promise<{
    verification: VerifiedAuthenticationResponse
    authenticator: Authenticator
  }> {
    const authenticator = await this.authenticatorService.findOneByExternalIdentifier(response.id)

    if (!authenticator) {
      throw new Error('Invalid or unknown authenticator')
    }

    const expectedRPID = this.getServerRelayPartyId()
    const publicUrl = this.configService.get<string>('PUBLIC_URL') ?? ''
    const expectedOrigin = new URL(publicUrl).origin
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
      authenticator: {
        counter: authenticator.counter,
        credentialID: Buffer.from(authenticator.externalIdentifier),
        credentialPublicKey: pgBytesToBuffer(authenticator.publicKey),
      },
    })

    if (verification.verified) {
      await this.authenticatorService.updateFromAuthenticationInfo(
        authenticator,
        verification.authenticationInfo,
      )
    }

    return { verification, authenticator }
  }

  public async issueToken(authenticator: Authenticator) {
    const user = await this.userService.findOneOrFail(authenticator.user_id)

    return this.tokenService.issueAuthenticationToken({
      subject: user,
      audience: 'authentication',
      authenticator: authenticator.id.toString(),
    })
  }

  private getServerRelayPartyId() {
    const expectedRPID = this.configService.get<string>('WEBAUTHN_ORIGIN')

    if (!expectedRPID) {
      throw new Error('WEBAUTHN_ORIGIN is not configured')
    }

    return expectedRPID
  }
}
