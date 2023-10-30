import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { JsonApiResponse } from '../json-api/json-api.interceptor.js'
import { Gate } from '../authentication/gate.guard.js'
import { sessionGuard } from '../authentication/session.guard.js'
import { tokenGuard } from '../authentication/token.guard.js'
import { Record } from '../database/record.pipe.js'
import { User } from '../authentication/user.decorator.js'
import { User as UserEntity } from '../user/user.entity.js'
import { GroupService } from './group.service.js'
import { Group } from './group.entity.js'
import { UpdateGroupRequest } from './request/update-group.request.js'
import { CreateGroupRequest } from './request/create-group.request.js'

@Controller('group')
@ApiTags('team', 'group')
export class GroupController {
  public constructor(@Inject(GroupService) private readonly groupService: GroupService) {}

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse({})
  @Get()
  public listGroups(@Query('query') query?: string) {
    return query ? this.groupService.search(query) : this.groupService.all()
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse<Group>({
    includes: ['members'],
  })
  @Get(':id')
  public findGroup(@Record('id', GroupService) { id }: Group) {
    return this.groupService.findOneOrFail(id, {}, true)
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse({})
  @Get(':id/members')
  public findGroupMembers(@Record('id', GroupService) group: Group) {
    return this.groupService.listMembers(group)
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse({})
  @Patch(':id')
  public updateGroup(@Record('id', GroupService) group: Group, @Body() body: UpdateGroupRequest) {
    return this.groupService.update(
      group,
      body.data.attributes
    )
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @Delete(':id')
  public async deleteGroup(@Record('id', GroupService) group: Group) {
    if (group.system) {
      throw new ForbiddenException('Cannot delete system group')
    }

    await this.groupService.delete(group)
  }

  @ApiOkResponse()
  @Gate([sessionGuard({}), tokenGuard({ allScopes: ['team'] })])
  @JsonApiResponse({})
  @Post()
  public async createGroup(@Body() body: CreateGroupRequest, @User() user: UserEntity) {
    try {
      return await this.groupService.create(body.data.attributes, user)
    } catch (error) {
      throw new BadRequestException((error as Error).message)
    }
  }
}
