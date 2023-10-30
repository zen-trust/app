import type { Client as ClientContract } from '@node-oauth/oauth2-server'
import type { oauth } from 'zapatos/schema'
import { Entity } from '../../../entity.js'
import { grantType } from '../oauth.constants.js'

export class Client extends Entity<'oauth.client'> implements ClientContract {
  table = 'oauth.client' as const
  type = 'client' as const

  public name: string

  public secret: string | null

  public redirectUris: string[]

  public scopes: string[]

  public userId: string | null

  public constructor(
    client: oauth.client.JSONSelectable,
    scopes?: Partial<oauth.scope.JSONSelectable>[],
  ) {
    super(client.id.toString())
    this.name = client.name
    this.secret = client.secret
    this.redirectUris = client.redirect_uris ?? []
    this.userId = client.user_id?.toString() ?? null
    this.scopes = scopes?.map((scope) => scope.id ?? '') ?? []
  }

  public get grants() {
    if (this.redirectUris.length === 0) {
      return [grantType.CLIENT_CREDENTIALS, grantType.REFRESH_TOKEN, grantType.TOKEN_EXCHANGE]
    }

    return [grantType.AUTHORIZATION_CODE, grantType.REFRESH_TOKEN]
  }
}
