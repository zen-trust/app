import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Inject, Injectable, mixin } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { OauthService } from './oauth.service.js'

interface OauthGuardOptions {
  scopes?: string[]
}

export function oauthGuard(options?: OauthGuardOptions) {
  @Injectable()
  class OauthGuard implements CanActivate {
    public constructor(@Inject(OauthService) public readonly oauthService: OauthService) {}

    public async canActivate(context: ExecutionContext) {
      const http = context.switchToHttp()
      const request = http.getRequest<FastifyRequest>()
      const response = http.getResponse<FastifyReply>()

      try {
        await this.oauthService.authenticate(request, response, {
          scope: options?.scopes,
          addAcceptedScopesHeader: true,
          addAuthorizedScopesHeader: true,
          allowBearerTokensInQueryString: false,
        })
      } catch (error) {
        console.error(error)
        throw error
      }

      return true
    }
  }

  return mixin(OauthGuard)
}
