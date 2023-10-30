import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Inject, Injectable, mixin } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { UserService } from '../user/user.service.js'

interface SessionGuardOptions {
  property?: string
}

export function sessionGuard(options?: SessionGuardOptions) {
  @Injectable()
  class SessionGuard implements CanActivate {
    public constructor(@Inject(UserService) public readonly userService: UserService) {}

    public async canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest<FastifyRequest>()
      const session = request.session

      if (!session.get(options?.property ?? 'authenticated')) {
        return false
      }

      try {
        request.user = await this.userService.findOneOrFail(Number(session.get('user.id')))
      } catch (error) {
        return false
      }

      return true
    }
  }

  return mixin(SessionGuard)
}
