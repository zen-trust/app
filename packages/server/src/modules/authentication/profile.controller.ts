import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Patch,
  Post,
  Session,
  UseGuards,
} from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { Session as SessionData } from '@fastify/secure-session'
import type { auth } from 'zapatos/schema'
import { User as UserEntity } from '../user/user.entity.js'
import { UserService } from '../user/user.service.js'
import { JsonApiResponse } from '../json-api/json-api.interceptor.js'
import { InvitationGuard } from '../invitation/invitation.guard.js'
import { InvitationService } from '../invitation/invitation.service.js'
import { tokenGuard } from './token.guard.js'
import { User } from './user.decorator.js'
import { Gate } from './gate.guard.js'
import { sessionGuard } from './session.guard.js'
import { UpdateProfileRequest } from './request/update-profile.request.js'
import { CreateProfileRequest } from './request/create-profile.request.js'

@Controller('authentication/profile')
@ApiTags('authentication')
export class ProfileController {
  public constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(forwardRef(() => InvitationService))
    private readonly invitationService: InvitationService,
  ) {}

  @ApiOkResponse()
  @Gate([sessionGuard(), tokenGuard({ allScopes: ['profile'] })])
  @JsonApiResponse()
  @Get()
  public getProfile(@User() user: UserEntity) {
    return user
  }

  @ApiOkResponse()
  @JsonApiResponse()
  @UseGuards(InvitationGuard)
  @Post()
  public async createAccount(@Session() session: SessionData, @Body() body: CreateProfileRequest) {
    const invitationId = session.get('invitation.id')

    if (!invitationId) {
      throw new Error('Unexpected state: No invitation ID in session')
    }

    const invitation = await this.invitationService.findOneOrFail(invitationId)
    const user = await this.invitationService.redeem(invitation, {
      name: body.data.attributes.name,
      email: body.data.attributes.email,
    })

    session.set('authenticated', true)
    session.set('user.id', user.id.toString())

    return user
  }

  @ApiOkResponse()
  @Gate([sessionGuard(), tokenGuard({ allScopes: ['profile'] })])
  @JsonApiResponse()
  @Patch()
  public async updateProfile(@User() user: UserEntity, @Body() body: UpdateProfileRequest) {
    const changes: Partial<auth.user.Updatable> = {}

    if (body.data.attributes.name) {
      changes.name = body.data.attributes.name
    }

    if (body.data.attributes.email) {
      changes.email = body.data.attributes.email
    }

    return this.userService.update(user, changes)
  }
}
