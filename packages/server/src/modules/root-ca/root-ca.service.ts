import { Inject, Injectable } from '@nestjs/common'
import type { InsertableForTable, WhereableForTable } from 'zapatos/schema'
import { generateKeyPair, issueRootCertificateAuthority } from '../../crypto/certificates.js'
import { encryptPrivateKey } from '../../crypto/encryption.js'
import { Ca } from '../ca/ca.entity.js'
import { DatabaseService } from '../database/database.service.js'
import type { RecordRepositoryContract } from '../database/record-repository.contract.js'
import type { User } from '../user/user.entity.js'
import { RootCa } from './root-ca.entity.js'

@Injectable()
export class RootCaService implements RecordRepositoryContract<RootCa, 'id'> {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  public async total(): Promise<number> {
    return this.database.db.count(RootCa.table, this.database.db.all).run(this.database.pool)
  }

  public async all(where?: WhereableForTable<'root_ca'>) {
    const results = await this.database.select('root_ca', where ?? {})

    return results.map((result) => new RootCa(result))
  }

  public async allCas(rootCa: number | RootCa, where?: WhereableForTable<'root_ca'>) {
    const results = await this.database.select('ca', {
      ...where,
      root_ca_id: typeof rootCa === 'number' ? rootCa : Number(rootCa.id),
    })

    return results.map((result) => new Ca(result))
  }

  public async findOne(id: number) {
    const result = await this.database.selectOne('root_ca', { id })

    return result ? new RootCa(result) : undefined
  }

  public async findOneOrFail(id: number, where?: WhereableForTable<'root_ca'>) {
    const result = await this.database.selectExactlyOne('root_ca', { ...where, id })

    return new RootCa(result)
  }

  public async activate(rootCa: number | RootCa) {
    const id = typeof rootCa === 'number' ? rootCa : Number(rootCa.id)

    await this.database.db.serializable(this.database.pool, async (transaction) => {
      await this.database.db.update('root_ca', { active: false }, { active: true }).run(transaction)

      await this.database.db.update('root_ca', { active: true }, { id }).run(transaction)
    })
  }

  public async revoke(rootCa: number | RootCa) {
    const id = typeof rootCa === 'number' ? rootCa : Number(rootCa.id)

    await this.database.update('root_ca', { is_revoked: true }, { id })
  }

  public async issue({ commonName, passPhrase, user, tags = {} }: IssueRootCaOptions) {
    const result = await this.database.db.serializable(this.database.pool, async (transaction) => {
      const maxSerial = await this.database.db
        .max('root_ca', this.database.db.all, { columns: ['serial_number'] })
        .run(transaction)

      const rootCa = issueRootCertificateAuthority(await generateKeyPair(2048), {
        commonName,
        serialNumber: (maxSerial + 1).toString(),
      })

      const encryptedPrivateKey = encryptPrivateKey(rootCa.privateKey, passPhrase)

      return this.database.db
        .insert('root_ca', {
          subject: rootCa.commonName ?? '',
          certificate: rootCa.toBuffer(),
          encrypted_private_key: encryptedPrivateKey,
          serial_number: rootCa.serialNumber,
          valid_until: rootCa.validUntil,
          valid_from: rootCa.validFrom,
          active: false,
          user_id: Number(user.id),
          tags,
        } satisfies InsertableForTable<'root_ca'>)
        .run(transaction)
    })

    return new RootCa(result)
  }

  public async issueIntermediateCa(
    rootCa: RootCa,
    { commonName, user, tags = {} }: IntermediateCaOptions,
  ) {
    return this.database.db
      .insert('ca', {
        subject: commonName,
        certificate: Buffer.from(''),
        encrypted_private_key: Buffer.from(''),
        serial_number: 0,
        valid_until: new Date(),
        valid_from: new Date(),
        active: false,
        user_id: Number(user.id),
        root_ca_id: Number(rootCa.id),
        tags,
      } satisfies InsertableForTable<'ca'>)
      .run(this.database.pool)
  }
}

interface IssueRootCaOptions extends CaOptions {
  passPhrase: Buffer
}

type IntermediateCaOptions = CaOptions

interface CaOptions {
  commonName: string
  tags: Record<string, string>
  user: User
}
