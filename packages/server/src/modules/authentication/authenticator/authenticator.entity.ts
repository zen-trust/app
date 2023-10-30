import type { AuthenticatorTransport } from '@simplewebauthn/typescript-types'
import type { JSONSelectableForTable } from 'zapatos/schema'
import { Entity } from '../../../entity.js'

export class Authenticator extends Entity<'auth.authenticator', 'authenticator'> {
  public table = 'auth.authenticator' as const
  public type = 'authenticator' as const

  public readonly name: string
  public readonly externalIdentifier: string
  public readonly deviceType: string
  public readonly publicKey: string
  public readonly counter: number
  public readonly transports: AuthenticatorTransport[]
  public readonly backed_up: boolean
  public readonly createdAt: Date
  public readonly updatedAt: Date
  public readonly user_id: number

  public constructor(authenticator: JSONSelectableForTable<'auth.authenticator'>) {
    super(authenticator.id.toString())

    this.createdAt = new Date(authenticator.created_at)
    this.updatedAt = new Date(authenticator.updated_at)
    this.user_id = authenticator.user_id
    this.name = authenticator.name
    this.externalIdentifier = authenticator.external_identifier
    this.deviceType = authenticator.device_type
    this.publicKey = authenticator.public_key
    this.publicKey = authenticator.public_key
    this.counter = authenticator.counter
    this.transports = authenticator.transports as AuthenticatorTransport[]
    this.backed_up = authenticator.backed_up
  }
}
