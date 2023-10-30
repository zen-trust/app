import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { ForbiddenException, Inject } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { InvitationService } from './invitation.service.js'

export class InvitationGuard implements CanActivate {
  public constructor(
    @Inject(InvitationService) private readonly invitationService: InvitationService,
  ) {}

  public async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const session = request.session
    const invitationId = session.get('invitation.id')

    if (!invitationId) {
      throw new ForbiddenException('Missing invitation')
    }

    const invitation = await this.invitationService.findOneOrFail(invitationId)

    if (invitation.usedAt !== null) {
      throw new ForbiddenException('Invitation already used')
    }

    if (invitation.expiresAt <= new Date()) {
      throw new ForbiddenException('Invitation expired')
    }

    return true
  }
}
