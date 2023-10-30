import { Inject, Injectable } from '@nestjs/common'
import { verify } from 'argon2'
import type { WhereableForTable } from 'zapatos/schema'
import { DatabaseService } from '../../database/database.service.js'
import type { RecordRepositoryContract } from '../../database/record-repository.contract.js'
import { Client } from './client.entity.js'

@Injectable()
export class ClientService implements RecordRepositoryContract<Client, 'id'> {
  public constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  public async all(where?: WhereableForTable<'oauth.client'>) {
    const results = await this.database.select('oauth.client', where ?? {})

    return results.map((result) => new Client(result))
  }

  public async findOneOrFail(id: string, where?: WhereableForTable<'oauth.client'>) {
    const result = await this.database.selectExactlyOne('oauth.client', {
      ...where,
      id,
    })

    return new Client(result)
  }

  public async findOne(id: string, where?: WhereableForTable<'oauth.client'>) {
    const result = await this.database.selectOne(
      'oauth.client',
      { ...where, id },
      {
        lateral: {
          scopes: this.database.db.select(
            'oauth.client_scope',
            { client_id: id },
            {
              lateral: this.database.db.selectExactlyOne(
                'oauth.scope',
                { id: this.database.db.parent() },
                { columns: ['id'] },
              ),
            },
          ),
        },
      },
    )

    return result ? new Client(result, result.scopes) : undefined
  }

  public async findOneByCredentials(
    id: string,
    secret: string,
    where?: WhereableForTable<'oauth.client'>,
  ) {
    const result = await this.database.selectOne(
      'oauth.client',
      { ...where, id },
      {
        lateral: {
          scopes: this.database.db.select(
            'oauth.client_scope',
            { client_id: id },
            {
              lateral: this.database.db.selectExactlyOne(
                'oauth.scope',
                { id: this.database.db.parent('scope_id') },
                { columns: ['id'] },
              ),
            },
          ),
        },
      },
    )

    if (!(await verify(result?.secret ?? '', secret))) {
      return undefined
    }

    return result ? new Client(result, result.scopes) : undefined
  }
}
