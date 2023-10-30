import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { ForbiddenException, Inject, Injectable, mixin } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { TokenService } from '../token/token.service.js'
import { UserService } from '../user/user.service.js'

interface TokenGuardOptions {
  anyScope?: string[]
  allScopes?: string[]
}

export function tokenGuard(options?: TokenGuardOptions) {
  @Injectable()
  class TokenGuard implements CanActivate {
    public constructor(
      @Inject(TokenService) public readonly tokenService: TokenService,
      @Inject(UserService) public readonly userService: UserService,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<FastifyRequest>()
      const token = extractTokenFromHeader(request)

      if (!token) {
        return false
      }

      try {
        const payload = await this.tokenService.validateToken(token)
        const scopes = payload.scope.split(' ')

        if (options?.anyScope && !options.anyScope.some((scope) => scopes.includes(scope))) {
          throw new ForbiddenException(
            `Token is missing one of required scope(s) ${options.anyScope.join(', ')}`,
          )
        }

        if (options?.allScopes && !options.allScopes.every((scope) => scopes.includes(scope))) {
          throw new ForbiddenException(
            `Token is missing required scopes ${options.allScopes.join(', ')}`,
          )
        }

        request.jwt = payload
        request.user = await this.userService.findOneOrFail(Number(request.jwt.sub))
      } catch (error) {
        return false
      }

      return true
    }
  }

  return mixin(TokenGuard)
}

function extractTokenFromHeader(request: FastifyRequest): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? []

  return type === 'Bearer' ? token : undefined
}
