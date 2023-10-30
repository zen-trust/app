import type { oauth } from 'zapatos/schema'
import { Entity } from '../../../entity.js'

export class AccessToken extends Entity<'oauth.access_token', 'accessToken'> {
  table = 'oauth.access_token' as const
  type = 'accessToken' as const

  userId: string | null
  clientId: string
  scopes: string[]
  expiresAt: Date
  createdAt: Date
  updatedAt: Date

  public constructor(
    accessToken: oauth.access_token.JSONSelectable,
    scopes?: oauth.scope.JSONSelectable[],
  ) {
    super(accessToken.id.toString())
    this.userId = accessToken.user_id?.toString() ?? null
    this.clientId = accessToken.client_id
    this.createdAt = new Date(accessToken.created_at)
    this.updatedAt = new Date(accessToken.updated_at)
    this.expiresAt = new Date(accessToken.expires_at)
    this.scopes = scopes?.map((scope) => scope.name) ?? []
  }
}
