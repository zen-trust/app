import { Inject, Injectable } from '@nestjs/common'
import type { oauth } from 'zapatos/schema'
import { DatabaseService } from '../../database/database.service.js'
import type { RecordRepositoryContract } from '../../database/record-repository.contract.js'
import { AccessToken } from './access-token.entity.js'

@Injectable()
export class AccessTokenService implements RecordRepositoryContract<AccessToken, 'id'> {
  public constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  public async all(where?: oauth.access_token.Whereable) {
    const results = await this.database.select('oauth.access_token', {
      ...where,
    })

    return results.map((result) => new AccessToken(result))
  }

  public async findOneOrFail(id: number, where?: oauth.access_token.Whereable) {
    const result = await this.database.selectExactlyOne('oauth.access_token', {
      ...where,
      id,
    })

    return new AccessToken(result)
  }

  public async create(accessToken: oauth.access_token.Insertable) {
    const result = await this.database.insert('oauth.access_token', accessToken)

    return new AccessToken(result)
  }
}
