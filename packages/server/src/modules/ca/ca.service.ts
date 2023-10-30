import { Inject, Injectable } from '@nestjs/common'
import type { InsertableForTable, SelectableForTable, WhereableForTable } from 'zapatos/schema'
import { ConfigService } from '@nestjs/config'
import { pki } from 'node-forge'
import { DatabaseService } from '../database/database.service.js'
import type { RecordRepositoryContract } from '../database/record-repository.contract.js'
import {
  generateKeyPair,
  issueIntermediateCertificateAuthority,
} from '../../crypto/certificates.js'
import { decryptPrivateKey, encryptPrivateKey } from '../../crypto/encryption.js'
import { hydrateCertificate, pgBytesToBuffer } from '../../crypto/conversion.js'
import type { User } from '../user/user.entity.js'
import { Ca } from './ca.entity.js'

@Injectable()
export class CaService implements RecordRepositoryContract<'ca'> {
  public constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  public async all(where?: WhereableForTable<'ca'>) {
    const results = await this.database.select('ca', where ?? {})

    return results.map((result) => new Ca(result))
  }

  public async findOneOrFail(
    identifier: SelectableForTable<'ca'>['id'],
    where?: WhereableForTable<'ca'>,
  ) {
    const result = await this.database.selectExactlyOne('ca', { ...where, id: identifier })
    return new Ca(result)
  }

  public async issue(options: IssueCaOptions, signingKey: Buffer) {
    const result = await this.database.db.serializable(this.database.pool, async (transaction) => {
      const maxSerial = await this.database.db
        .max('ca', this.database.db.all, { columns: ['serial_number'] })
        .run(transaction)

      const rootCa = await this.database.selectExactlyOne(
        'root_ca',
        { active: true },
        undefined,
        transaction,
      )

      if (rootCa.is_revoked) {
        throw new Error('Root CA has been revoked')
      }

      if (new Date(rootCa.valid_until) < new Date()) {
        throw new Error('Root CA has expired')
      }

      const rootCaCertificate = hydrateCertificate(rootCa.certificate)

      rootCaCertificate.privateKey = decryptPrivateKey(
        pgBytesToBuffer(rootCa.encrypted_private_key),
        signingKey,
      )

      const certificate = issueIntermediateCertificateAuthority(
        await generateKeyPair(2048),
        rootCaCertificate,
        {
          commonName: options.subject,
          serialNumber: (maxSerial + 1).toString(),
          validity: {
            notBefore: options.validFrom,
            notAfter: options.validUntil,
          },
          issuerAttributes: {
            commonName: this.config.get<string>('CERTIFICATE_ISSUER_NAME', 'Fides.io'),
            organizationName: this.config.get<string>(
              'CERTIFICATE_ISSUER_ORGANIZATION',
              'zen-trust.net',
            ),
          },
        },
      )

      console.log('Issued CA', {
        rootIsIssuer: certificate.cert.isIssuer(rootCaCertificate.cert),
        rootIssuedCa: rootCaCertificate.cert.issued(certificate.cert),
        verify: rootCaCertificate.cert.verify(certificate.cert),
      })

      const caStore = pki.createCaStore()
      caStore.addCertificate(rootCaCertificate.cert)
      caStore.addCertificate(certificate.cert)

      const secret = this.config.get<string>('SECRET_KEY')

      if (!secret) {
        throw new Error('No secret key configured')
      }

      const encryptedPrivateKey = encryptPrivateKey(
        certificate.privateKey,
        Buffer.from(secret, 'base64'),
      )

      const query = this.database.db.insert('ca', {
        subject: certificate.commonName,
        description: options.description,
        encrypted_private_key: encryptedPrivateKey,
        certificate: certificate.toBuffer(),
        serial_number: certificate.serialNumber,
        valid_from: options.validFrom,
        valid_until: options.validUntil,
        tags: options.tags,
        root_ca_id: rootCa.id,
        user_id: Number(options.user.id),
      } as InsertableForTable<'ca'>)

      return query.run(transaction)
    })

    return new Ca(result)
  }

  public async revoke(ca: Ca) {
    await this.database.update('ca', { is_revoked: true }, { id: Number(ca.id) })
  }

  public async enable(ca: Ca) {
    await this.database.update('ca', { active: true }, { id: Number(ca.id) })
  }

  public async disable(ca: Ca) {
    await this.database.update('ca', { active: false }, { id: Number(ca.id) })
  }
}

interface IssueCaOptions {
  subject: string
  description?: string
  tags: Record<string, string>
  validFrom: Date
  validUntil: Date
  user: User
}
