import { Inject, Injectable } from '@nestjs/common'
import type { oauth } from 'zapatos/schema'
import { DatabaseService } from '../../database/database.service.js'
import type { RecordRepositoryContract } from '../../database/record-repository.contract.js'
import { RefreshToken } from './refresh-token.entity.js'

@Injectable()
export class RefreshTokenService implements RecordRepositoryContract<RefreshToken, 'id'> {
  public constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  public async all(where?: oauth.refresh_token.Whereable) {
    const results = await this.database.select('oauth.refresh_token', {
      ...where,
    })

    return results.map((result) => new RefreshToken(result))
  }

  public async findOneOrFail(id: number, where?: oauth.refresh_token.Whereable) {
    const result = await this.database.selectExactlyOne('oauth.refresh_token', {
      ...where,
      id,
    })

    return new RefreshToken(result)
  }

  public async create(refreshToken: oauth.refresh_token.Insertable) {
    const result = await this.database.insert('oauth.refresh_token', refreshToken)

    return new RefreshToken(result)
  }
}
