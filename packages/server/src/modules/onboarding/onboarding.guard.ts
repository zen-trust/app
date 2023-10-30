import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'

@Injectable()
export class OnboardingGuard implements CanActivate {
  public canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const authenticated = request.session.get('authenticated')
    const sealed = request.session.get('onboarding.sealed')

    if (!authenticated || !sealed) {
      throw new UnauthorizedException()
    }

    return true
  }
}
