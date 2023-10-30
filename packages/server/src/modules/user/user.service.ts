import { Inject, Injectable } from '@nestjs/common'
import type { auth } from 'zapatos/schema'
import { DatabaseService } from '../database/database.service.js'
import type { RecordRepositoryContract } from '../database/record-repository.contract.js'
import { Group } from '../group/group.entity.js'
import { User } from './user.entity.js'

@Injectable()
export class UserService implements RecordRepositoryContract<User, 'id'> {
  public constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  public total(where?: auth.user.Whereable) {
    return this.database.count('auth.user', where ?? {})
  }

  public async all(where?: auth.user.Whereable, loadGroups?: boolean) {
    const results = await this.database.select('auth.user', where ?? {}, {
      lateral: loadGroups
        ? {
            groupMemberships: this.database.db.select(
              'auth.group_user',
              { user_id: this.database.db.parent('id') },
              {
                columns: [],
                lateral: {
                  group: this.database.db.selectExactlyOne('auth.group', {
                    id: this.database.db.parent('group_id'),
                  }),
                },
              },
            ),
          }
        : undefined,
    })

    return results.map(
      (result) =>
        new User(
          result,
          (result.groupMemberships ?? []).map(({ group }) => new Group(group)),
        ),
    )
  }

  public async search(query: string, where?: auth.user.Whereable, loadGroups?: boolean) {
    return this.all(
      {
        ...where,
        search_vector: this.database.sql`${
          this.database.self
        } @@ websearch_to_wildcard_tsquery(${this.database.param(query)}::text)`,
      },
      loadGroups,
    )
  }

  public async findOneOrFail(
    identifier: number,
    where?: auth.user.Whereable,
    options?: {
      loadGroups?: boolean
    },
  ) {
    const result = await this.database.selectExactlyOne(
      'auth.user',
      {
        ...where,
        id: Number(identifier),
      },
      {
        lateral: options?.loadGroups
          ? {
              groupMemberships: this.database.db.select(
                'auth.group_user',
                { user_id: this.database.db.parent('id') },
                {
                  columns: [],
                  lateral: {
                    group: this.database.db.selectExactlyOne('auth.group', {
                      id: this.database.db.parent('group_id'),
                    }),
                  },
                },
              ),
            }
          : undefined,
      },
    )

    return new User(
      result,
      result.groupMemberships ? result.groupMemberships.map(({ group }) => new Group(group)) : [],
    )
  }

  public async create(user: auth.user.Insertable) {
    const result = await this.database.insert('auth.user', user)

    return new User(result)
  }

  public async update(
    user: User,
    data: Partial<Pick<auth.user.Updatable, 'name' | 'email' | 'email_verified_at' | 'tags'>>,
  ) {
    const results = await this.database.update('auth.user', data, { id: Number(user.id) })

    if (!results[0]) {
      throw new Error('Failed to update user')
    }

    return new User(results[0])
  }
}
