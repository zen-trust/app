import { Inject, Injectable } from '@nestjs/common'
import type { auth } from 'zapatos/schema'
import type { RecordRepositoryContract } from '../database/record-repository.contract.js'
import { DatabaseService } from '../database/database.service.js'
import { User } from '../user/user.entity.js'
import { DuplicateException } from '../database/duplicate.exception.js'
import { Group } from './group.entity.js'

@Injectable()
export class GroupService implements RecordRepositoryContract<Group, 'id'> {
  public constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  public async all(where?: auth.group.Whereable) {
    const results = await this.database.select('auth.group', where ?? {}, {
      order: {
        by: 'updated_at',
        direction: 'DESC',
      },
    })

    return results.map((result) => new Group(result))
  }

  public async search(query: string, where?: auth.group.Whereable) {
    return this.all({
      ...where,
      search_vector: this.database.sql`${
        this.database.self
      } @@ websearch_to_wildcard_tsquery(${this.database.param(query)}::text)`,
    })
  }

  public async findOneOrFail(id: string, where?: auth.group.Whereable, loadMembers = false) {
    const result = await this.database.selectExactlyOne(
      'auth.group',
      { ...where, id },
      {
        lateral: loadMembers
          ? {
              memberUsers: this.database.db.select(
                'auth.group_user',
                { group_id: this.database.db.parent('id') },
                {
                  columns: [],
                  lateral: {
                    user: this.database.db.selectExactlyOne('auth.user', {
                      id: this.database.db.parent('user_id'),
                    }),
                  },
                },
              ),
              memberGroups: this.database.db.select(
                'auth.group_group',
                { group_id: this.database.db.parent('id') },
                {
                  columns: [],
                  lateral: {
                    group: this.database.db.selectExactlyOne('auth.group', {
                      id: this.database.db.parent('member_group_id'),
                    }),
                  },
                },
              ),
            }
          : undefined,
      },
    )

    return new Group(result, [
      ...(result.memberUsers ?? []).map(({ user }) => new User(user)),
      ...(result.memberGroups ?? []).map(({ group }) => new Group(group)),
    ])
  }

  public async create({ name, description = '', tags = [] }: CreateGroupOptions, user: User) {
    const id = this.generateGroupId(name)

    try {
      const result = await this.database.insert('auth.group', {
        id,
        name,
        description,
        tags,
        created_by_user_id: Number(user.id),
      })

      return new Group(result)
    } catch (error) {
      if (error instanceof DuplicateException) {
        throw new Error(`A group named "${id}" already exists`)
      }

      throw error
    }
  }

  public async update(group: Group, { name, description, tags }: UpdateGroupOptions) {
    const id = name ? this.generateGroupId(name as string) : undefined

    const result = await this.database.update(
      'auth.group',
      { id, name, description, tags },
      { id: group.id },
    )

    if (!result[0]) {
      throw new Error('Failed to update group')
    }

    return new Group(result[0])
  }

  public async delete(group: Group) {
    if (group.system) {
      throw new Error('Cannot delete system group')
    }

    await this.database.delete('auth.group', { id: group.id })
  }

  public async listMembers(group: Group) {
    const result = await this.database.selectExactlyOne(
      'auth.group',
      { id: group.id },
      {
        columns: [],
        lateral: {
          users: this.database.db.select(
            'auth.group_user',
            { group_id: this.database.db.parent('id') },
            {
              columns: [],
              lateral: {
                user: this.database.db.selectExactlyOne(
                  'auth.user',
                  { id: this.database.db.parent('user_id') },
                  {},
                ),
              },
            },
          ),
        },
      },
    )

    return result.users.map(({ user }) => new User(user))
  }

  public async listGroupsForUser(user: User) {
    const id = this.database.db
      .sql<auth.group_user.SQL>`(SELECT ${'group_id'} FROM ${'auth.group_user'} WHERE ${{
      user_id: Number(user.id),
    }})`

    const result = await this.database.select('auth.group', { id })

    return result.map((group) => new Group(group))
  }

  public async removeUserFromGroup(user: User, group: Group) {
    await this.database.delete('auth.group_user', {
      user_id: Number(user.id),
      group_id: group.id,
    })
  }

  public async addUserToGroup(user: User, group: Group) {
    await this.database.insert('auth.group_user', {
      user_id: Number(user.id),
      group_id: group.id,
    })
  }

  private generateGroupId(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }
}

type UpdateGroupOptions = Partial<Pick<auth.group.Updatable, 'name' | 'description' | 'tags'>>
type CreateGroupOptions = Partial<Pick<auth.group.Insertable, 'name' | 'description' | 'tags'>> & {
  name: string
}
