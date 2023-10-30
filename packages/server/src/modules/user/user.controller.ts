import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Put,
  Query,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import type { auth } from 'zapatos/schema'
import { tokenGuard } from '../authentication/token.guard.js'
import { JsonApiResponse } from '../json-api/json-api.interceptor.js'
import { Gate } from '../authentication/gate.guard.js'
import { sessionGuard } from '../authentication/session.guard.js'
import { Record } from '../database/record.pipe.js'
import { GroupService } from '../group/group.service.js'
import { Group } from '../group/group.entity.js'
import { UserService } from './user.service.js'
import { User } from './user.entity.js'
import { UpdateUserRequest } from './request/update-user.request.js'

@Controller('user')
@ApiTags('team', 'user')
export class UserController {
  public constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(GroupService) private readonly groupService: GroupService,
  ) {}

  @ApiOkResponse({
    description: 'Lists all users.',
  })
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse<User>({
    includes: ['groups'],
    links: {
      current: '/user/me',
    },
  })
  @Get()
  public listUsers(@Query('query') query?: string, @Query('include') include?: string | string[]) {
    const includeGroups = include?.includes('groups') ?? false

    return query
      ? this.userService.search(query, undefined, includeGroups)
      : this.userService.all(undefined, includeGroups)
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse<User>({
    includes: ['groups'],
  })
  @Get(':id')
  public findUser(
    @Record('id', UserService,{options:{loadGroups:true}}) user: User,
    @Query('include') include?: string | string[],
  ) {
    const loadGroups = include?.includes('groups') ?? false
    console.log({ include })

    return loadGroups
      ? this.userService.findOneOrFail(Number(user.id), undefined,{
         loadGroups,
        } )
      : user
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse()
  @Patch(':id')
  public updateUser(@Record('id', UserService) user: User, @Body() body: UpdateUserRequest) {
    const changes: Partial<auth.user.Updatable> = {}

    if (body.data.attributes.name) {
      changes.name = body.data.attributes.name as string
    }

    if (body.data.attributes.email) {
      changes.email = body.data.attributes.email as string
    }

    return this.userService.update(user, changes)
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse()
  @Get(':id/groups')
  public async listGroups(@Record('id', UserService) user: User) {
    return this.groupService.listGroupsForUser(user)
  }

  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @Put(':id/groups/:groupId')
  public async addGroup(
    @Record('id', UserService) user: User,
    @Record('groupId', GroupService) group: Group,
  ) {
    await this.groupService.addUserToGroup(user, group)
  }

  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @Delete(':id/groups/:groupId')
  public async removeGroup(
    @Record('id', UserService) user: User,
    @Record('groupId', GroupService) group: Group,
  ) {
    await this.groupService.removeUserFromGroup(user, group)
  }
}
