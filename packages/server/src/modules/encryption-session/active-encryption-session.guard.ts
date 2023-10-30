import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { EncryptionSessionService } from './encryption-session.service.js'

@Injectable()
export class ActiveEncryptionSessionGuard implements CanActivate {
  public constructor(
    @Inject(EncryptionSessionService) private readonly sessionService: EncryptionSessionService,
  ) {}

  public canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const sessionId = request.session.get('encryption.session')

    if (!sessionId) {
      throw new UnauthorizedException('Missing encryption session ID')
    }

    if (!this.sessionService.hasSession(sessionId)) {
      throw new ForbiddenException('Invalid encryption session ID')
    }

    request.encryptionSessionId = sessionId

    return true
  }
}
