import type { oauth } from 'zapatos/schema'
import { Entity } from '../../../entity.js'

export class RefreshToken extends Entity<'oauth.refresh_token', 'refreshToken'> {
  table = 'oauth.refresh_token' as const
  type = 'refreshToken' as const

  userId: string | null
  clientId: string
  scopes: string[]
  expiresAt: Date
  createdAt: Date
  updatedAt: Date

  public constructor(
    refreshToken: oauth.refresh_token.JSONSelectable,
    scopes?: oauth.scope.JSONSelectable[],
  ) {
    super(refreshToken.id.toString())
    this.userId = refreshToken.user_id?.toString() || null
    this.clientId = refreshToken.client_id
    this.createdAt = new Date(refreshToken.created_at)
    this.updatedAt = new Date(refreshToken.updated_at)
    this.expiresAt = new Date(refreshToken.expires_at)
    this.scopes = scopes?.map((scope) => scope.name) ?? []
  }
}
