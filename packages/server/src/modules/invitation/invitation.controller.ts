import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Session,
} from '@nestjs/common'
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { Session as SessionData } from '@fastify/secure-session'
import { Record } from '../database/record.pipe.js'
import { JsonApiResponse } from '../json-api/json-api.interceptor.js'
import { Gate } from '../authentication/gate.guard.js'
import { sessionGuard } from '../authentication/session.guard.js'
import { tokenGuard } from '../authentication/token.guard.js'
import { User } from '../authentication/user.decorator.js'
import { User as UserEntity } from '../user/user.entity.js'
import { Invitation } from './invitation.entity.js'
import { InvitationService } from './invitation.service.js'

class CreateInvitationBody {
  @IsString()
  @IsEmail({
    allow_display_name: false,
    allow_utf8_local_part: true,
  })
  email!: string

  @IsArray()
  @IsOptional()
  groups?: string[]
}

@Controller('invitation')
@ApiTags('team', 'invitation')
export class InvitationController {
  public constructor(
    @Inject(InvitationService) private readonly invitationService: InvitationService,
  ) {}

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse()
  @Get('')
  public listInvitations() {
    return this.invitationService.all()
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse()
  @Get(':id')
  public getInvitation(@Record('id', InvitationService) invitation: Invitation) {
    return invitation
  }

  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  public async deleteInvitation(@Record('id', InvitationService) invitation: Invitation) {
    await this.invitationService.remove(invitation)
  }

  @ApiCreatedResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse()
  @Post('')
  public async createInvitation(
    @Body() { email, groups }: CreateInvitationBody,
    @User() user: UserEntity,
  ) {
    return this.invitationService.create(email, user, groups)
  }

  @ApiOkResponse()
  @Post(':id/:token/accept')
  public acceptInvitation(
    @Param('token') token: string,
    @Record('id', InvitationService) invitation: Invitation,
    @Session() session: SessionData,
  ) {
    if (invitation.token !== token) {
      throw new ForbiddenException('The token is not valid: Please check the link')
    }

    if (invitation.used) {
      throw new ForbiddenException('This invitation has already been used: Try signing in instead')
    }

    if (invitation.expiresAt <= new Date()) {
      throw new ForbiddenException(
        'The invitation has expired: ' +
          'Please contact the team owner and ask for a new invitation',
      )
    }

    session.set('invitation.id', invitation.id)
  }
}
