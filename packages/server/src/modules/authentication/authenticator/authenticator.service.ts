import { Inject, Injectable } from '@nestjs/common'
import type { WhereableForTable } from 'zapatos/schema'
import type {
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
} from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/typescript-types'
import type { RecordRepositoryContract } from '../../database/record-repository.contract.js'
import { DatabaseService } from '../../database/database.service.js'
import type { User } from '../../user/user.entity.js'
import { Authenticator } from './authenticator.entity.js'

@Injectable()
export class AuthenticatorService implements RecordRepositoryContract<Authenticator, 'id'> {
  public constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  public async all(where?: WhereableForTable<'auth.authenticator'>) {
    const results = await this.database.select('auth.authenticator', where ?? {})

    return results.map((result) => new Authenticator(result))
  }

  public async allForUser(user: User) {
    const results = await this.database.select('auth.authenticator', {
      user_id: Number(user.id),
    })

    return results.map((authenticator) => new Authenticator(authenticator))
  }

  public async findOneOrFail(identifier: number, where?: WhereableForTable<'auth.authenticator'>) {
    const result = await this.database.selectExactlyOne('auth.authenticator', {
      ...where,
      id: Number(identifier),
    })

    return new Authenticator(result)
  }

  public async findOneByExternalIdentifier(externalIdentifier: string) {
    const result = await this.database.selectOne('auth.authenticator', {
      external_identifier: externalIdentifier,
    })

    return result ? new Authenticator(result) : undefined
  }

  public async createFromRegistration(
    user: User,
    registration: RegistrationInfo,
    registrationResponse: RegistrationResponseJSON,
  ) {
    const result = await this.database.insert('auth.authenticator', {
      name: registration.aaguid,
      device_type: registration.credentialDeviceType,
      user_id: Number(user.id),
      external_identifier: Buffer.from(registration.credentialID).toString('base64url'),
      counter: registration.counter,
      public_key: Buffer.from(registration.credentialPublicKey),
      backed_up: registration.credentialBackedUp,
      transports: registrationResponse.response.transports,
    })

    return new Authenticator(result)
  }

  public async updateFromAuthenticationInfo(
    { id }: Authenticator,
    authentication: AuthenticationInfo,
  ) {
    const { newCounter } = authentication
    const result = await this.database.update(
      'auth.authenticator',
      { counter: newCounter },
      {
        id: Number(id),
      },
    )

    if (!result[0]) {
      throw new Error('Invalid or unknown authenticator')
    }

    return new Authenticator(result[0])
  }
}

export type RegistrationInfo = Exclude<VerifiedRegistrationResponse['registrationInfo'], undefined>
export type AuthenticationInfo = Exclude<
  VerifiedAuthenticationResponse['authenticationInfo'],
  undefined
>
