import { Inject, Injectable } from '@nestjs/common'
import type {
  AuthenticateOptions,
  AuthorizationCodeModel,
  Client as ClientContract,
  ClientCredentialsModel,
  ExtensionModel,
  RefreshTokenModel,
  Token as TokenContract,
  User as UserContract,
} from '@node-oauth/oauth2-server'
import OAuth2Server, { Request, Response } from '@node-oauth/oauth2-server'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type * as db from 'zapatos/db'
import { ConfigService } from '@nestjs/config'
import { TokenService } from '../token/token.service.js'
import { User } from '../user/user.entity.js'
import { UserService } from '../user/user.service.js'
import { ClientService } from './client/client.service.js'
import type { Client } from './client/client.entity.js'
import { AccessTokenService } from './access-token/access-token.service.js'
import { RefreshTokenService } from './refresh-token/refresh-token.service.js'
import type { RefreshToken } from './refresh-token/refresh-token.entity.js'

type OAuthModel = ClientCredentialsModel &
  AuthorizationCodeModel &
  RefreshTokenModel &
  ExtensionModel

@Injectable()
export class OauthService {
  public readonly oauthServer: OAuth2Server

  public constructor(
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(ClientService) private readonly clientService: ClientService,
    @Inject(AccessTokenService) private readonly accessTokenService: AccessTokenService,
    @Inject(RefreshTokenService) private readonly refreshTokenService: RefreshTokenService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.oauthServer = new OAuth2Server({
      accessTokenLifetime: this.getAccessTokenTtl(),
      refreshTokenLifetime: this.getRefreshTokenTtl(),
      authorizationCodeLifetime: this.getAuthorizationCodeTtl(),

      model: {
        // region Access Token
        generateAccessToken: (client, user, scope) =>
          this.issueAccessToken(client as Client, user?.id ? (user as User) : undefined, scope),

        saveToken: async (
          token: TokenContract,
          client: ClientContract,
          user: UserContract,
        ): Promise<TokenContract | OAuth2Server.Falsey> => {
          const { accessToken, refreshToken } = await this.persistToken(token, client, user)

          return {
            ...token,
            client,
            user,
            jwtid: accessToken.id.toString(),
            refreshTokenId: refreshToken?.id.toString(),
          } satisfies TokenContract
        },

        getAccessToken: async (accessToken) => {
          try {
            const payload = await this.tokenService.validateToken(accessToken)
            const { sub: subject, aud: audience, exp: expirationTimestamp } = payload
            const userId = audience ? subject : undefined
            const clientId = userId ? audience ?? '' : subject

            return {
              accessToken,
              accessTokenExpiresAt: new Date(expirationTimestamp * 1_000),
              scope: payload.scope.split(' '),
              client: {
                id: clientId,
                grants: [],
              },
              user: {
                id: userId,
              },
            } satisfies TokenContract
          } catch (error) {
            return false
          }
        },

        revokeToken(token: OAuth2Server.RefreshToken | TokenContract): Promise<boolean> {
          console.log('revokeToken', token)
          return Promise.resolve(false)
        },
        // endregion

        // region Authorization Code
        generateAuthorizationCode(client, user, scope) {
          console.log('generateAuthorizationCode', client, user, scope)

          return Promise.resolve('')
        },
        saveAuthorizationCode(
          code: Pick<
            OAuth2Server.AuthorizationCode,
            | 'authorizationCode'
            | 'expiresAt'
            | 'redirectUri'
            | 'scope'
            | 'codeChallenge'
            | 'codeChallengeMethod'
          >,
          client: ClientContract,
          user: UserContract,
        ): Promise<OAuth2Server.AuthorizationCode | OAuth2Server.Falsey> {
          console.log('saveAuthorizationCode', { code, client, user })
          return Promise.resolve(false)
        },
        getAuthorizationCode(
          authorizationCode: string,
        ): Promise<OAuth2Server.AuthorizationCode | OAuth2Server.Falsey> {
          console.log('getAuthorizationCode', authorizationCode)
          return Promise.resolve(false)
        },
        revokeAuthorizationCode(code: OAuth2Server.AuthorizationCode): Promise<boolean> {
          console.log('revokeAuthorizationCode', code)
          return Promise.resolve(false)
        },
        // endregion

        // region Refresh Token
        generateRefreshToken: (client, user, scope) =>
          this.issueRefreshToken(user?.id ? (user as User) : (client as Client), scope),
        getRefreshToken(
          refreshToken: string,
        ): Promise<OAuth2Server.RefreshToken | OAuth2Server.Falsey> {
          console.log('getRefreshToken', refreshToken)
          return Promise.resolve(false)
        },
        // endregion

        // region Clients
        getClient: (clientId, clientSecret) => this.resolveClient(clientId, clientSecret),
        getUserFromClient: (client) => this.resolveUserForClient(client),
        validateRedirectUri(redirectUri: string, client: ClientContract): Promise<boolean> {
          return Promise.resolve(
            client.redirectUris && client.redirectUris.length > 0 && !client.secret
              ? client.redirectUris?.includes(redirectUri)
              : false,
          )
        },
        // endregion

        // region Scopes
        validateScope(user, client, scopes) {
          const validScopes = (client as Client).scopes ?? []

          if (user instanceof User) {
            // TODO: Implement scope validation for interactive grants
            return Promise.resolve(scopes)
          }

          const acceptedScopes = scopes.filter((scope) => validScopes.includes(scope))

          // Ensure there's at least one valid scope - we cannot issue
          // a token without any scopes.
          return acceptedScopes.length > 0
            ? Promise.resolve(acceptedScopes)
            : Promise.resolve(false)
        },
        verifyScope(token: TokenContract, requiredScopes: string[]): Promise<boolean> {
          const presentScopes = token.scope ?? []

          return Promise.resolve(requiredScopes.every((scope) => presentScopes.includes(scope)))
        },
        // endregion
      } satisfies OAuthModel,
    })
  }

  public async authenticate(
    request: FastifyRequest,
    response: FastifyReply,
    authenticateOptions: AuthenticateOptions,
  ) {
    const oauthRequest = new Request(request)
    const oauthResponse = new Response(response)

    await this.oauthServer.authenticate(oauthRequest, oauthResponse, authenticateOptions)

    if (oauthResponse.status !== 200) {
      return this.bridgeResponse(oauthResponse, response)
    }
  }

  public async token(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const oauthRequest = new Request(request)
    const oauthResponse = new Response(response)
    const token = await this.oauthServer.token(oauthRequest, oauthResponse, {
      allowExtendedTokenAttributes: true,
      alwaysIssueNewRefreshToken: true,
    })

    console.log({ token, oauthResponse })
    return this.bridgeResponse(oauthResponse, response)
  }

  public async authorize(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const oauthRequest = new Request(request)
    const oauthResponse = new Response(response)
    const authorizationCode = await this.oauthServer.authorize(oauthRequest, oauthResponse, {
      allowEmptyState: false,
    })

    console.log({ authorizationCode })

    return this.bridgeResponse(oauthResponse, response)
  }

  public async issueToken(subject: string, scope: string): Promise<AccessTokenResponse> {
    const token = await this.tokenService.issueToken({
      subject,
      scope,
      expiresIn: '60m',
    })

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
    }
  }

  public async exchangeToken(
    subjectToken: string,
    subjectTokenType: string,
    resource?: string,
    audience?: string,
    scope?: string,
    requestedTokenType = 'urn:ietf:params:oauth:token-type:access_token',
    actorToken?: string,
    actorTokenType?: string,
  ): Promise<AccessTokenResponse> {
    switch (requestedTokenType) {
      case 'urn:ietf:params:oauth:token-type:refresh_token':
      case 'urn:ietf:params:oauth:token-type:id_token':
      case 'urn:ietf:params:oauth:token-type:saml1':
      case 'urn:ietf:params:oauth:token-type:saml2':
      case 'urn:ietf:params:oauth:token-type:jwt':
        throw new Error('Token type is not supported')

      case 'urn:ietf:params:oauth:token-type:access_token':
      default:
    }

    if (actorToken) {
      if (actorTokenType !== 'urn:ietf:params:oauth:token-type:jwt') {
        throw new Error('Actor token type is not supported')
      }

      throw new Error('Actor tokens are not supported yet')
    }

    if (subjectTokenType !== 'urn:ietf:params:oauth:token-type:jwt') {
      throw new Error('Subject token type is not supported')
    }

    const subjectTokenPayload = await this.tokenService.validateToken(subjectToken)

    if (!subjectTokenPayload) {
      throw new Error('Subject token is invalid')
    }

    switch (resource) {
      case 'onboarding':
        if (!audience) {
          throw new Error('Audience is required to issue an onboarding token')
        }

        return this.issueOnboardingToken(audience, scope ?? '')
      default:
        throw new Error('This resource is not supported')
    }
  }

  private async persistToken(token: TokenContract, client: ClientContract, user: UserContract) {
    if (!token.accessTokenExpiresAt) {
      throw new Error('Access token has no expiration date set')
    }

    const accessToken = await this.accessTokenService.create({
      user_id: user?.id ? Number(user.id) : undefined,
      client_id: client.id,
      expires_at: token.accessTokenExpiresAt.toISOString() as db.TimestampTzString,
    })
    let refreshToken: RefreshToken | undefined

    if (token.refreshToken) {
      token.refreshTokenExpiresAt =
        token.refreshTokenExpiresAt ?? new Date(new Date().getTime() + 86_400 * 30)
      refreshToken = await this.refreshTokenService.create({
        user_id: user?.id ? Number(user.id) : undefined,
        client_id: client.id,
        expires_at: token.refreshTokenExpiresAt.toISOString() as db.TimestampTzString,
      })
    }

    return { accessToken, refreshToken }
  }

  private getAccessTokenTtl() {
    return this.configService.get<number>('OAUTH_ACCESS_TOKEN_TTL', 60 * 60)
  }

  private getRefreshTokenTtl() {
    return this.configService.get<number>('OAUTH_REFRESH_TOKEN_TTL', this.getAccessTokenTtl() * 100)
  }

  private getAuthorizationCodeTtl() {
    return this.configService.get<number>('OAUTH_AUTHORIZATION_CODE_TTL', 60 * 5)
  }

  private issueAccessToken(client: Client, user: User | undefined, scope: string[]) {
    const subject = user ? user : client
    const ttl = this.getAccessTokenTtl()

    return this.tokenService.issueToken({
      subject: subject.id,
      audience: client.id,
      scope: scope.join(' '),
      expiresIn: `${ttl}s`,
    })
  }

  private issueRefreshToken(subject: User | Client, scope: string[]) {
    const ttl = this.getRefreshTokenTtl()

    return this.tokenService.issueToken({
      subject: subject.id,
      scope: scope.join(' '),
      expiresIn: `${ttl}s`,
    })
  }

  private resolveClient(id: string, secret?: string) {
    return secret
      ? this.clientService.findOneByCredentials(id, secret)
      : this.clientService.findOne(id)
  }

  private resolveUserForClient(client: ClientContract): Promise<UserContract> {
    return client.userId
      ? this.userService.findOneOrFail(Number(client.userId))
      : Promise.resolve({})
  }

  private async issueOnboardingToken(id: string, scope: string): Promise<AccessTokenResponse> {
    const user = await this.userService.findOneOrFail(Number(id))
    const token = await this.tokenService.issueToken({
      subject: user,
      scope,
      expiresIn: '60m',
    })

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
    }
  }

  private bridgeResponse(
    oauthResponse: OAuth2Server.Response,
    response: FastifyReply,
  ): FastifyReply {
    if (
      oauthResponse.status === 302 &&
      oauthResponse.headers &&
      'location' in oauthResponse.headers
    ) {
      const location = oauthResponse.headers.location
      delete oauthResponse.headers.location

      return response.headers(oauthResponse.headers ?? {}).redirect(location)
    }

    return response
      .headers(oauthResponse.headers ?? {})
      .status(oauthResponse.status ?? 200)
      .send(oauthResponse.body)
  }
}

export interface AccessTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}
