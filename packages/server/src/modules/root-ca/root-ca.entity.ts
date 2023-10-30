import type { JSONSelectableForTable } from 'zapatos/schema'
import { Type } from 'class-transformer'
import { Entity } from '../../entity.js'
import { Certificate } from '../../crypto/certificate.js'
import { hydrateCertificate } from '../../crypto/conversion.js'

export class RootCa extends Entity<'root_ca', 'rootCa'> {
  table = 'root_ca' as const
  type = 'rootCa' as const

  @Type(() => Certificate)
  readonly certificate: Certificate
  readonly revoked: boolean
  readonly active: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly validUntil: Date
  readonly subject: string

  constructor(rootCa: JSONSelectableForTable<'root_ca'>) {
    super(rootCa.id.toString())

    this.certificate = hydrateCertificate(rootCa.certificate)
    this.subject = rootCa.subject
    this.revoked = rootCa.is_revoked
    this.active = rootCa.active
    this.createdAt = new Date(rootCa.created_at)
    this.updatedAt = new Date(rootCa.updated_at)
    this.validUntil = new Date(rootCa.valid_until)
  }
}
