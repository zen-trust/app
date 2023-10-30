import { Exclude, Transform } from 'class-transformer'
import type { JSONSelectableForTable } from 'zapatos/schema'
import { Certificate } from '../../crypto/certificate.js'
import { hydrateCertificate } from '../../crypto/conversion.js'
import { Entity } from '../../entity.js'

export class Ca extends Entity<'ca'> {
  table = 'ca' as const
  type = 'ca' as const

  @Transform(({ value }: { value: Certificate }) => ({
    subject: {
      attributes: value.subject.attributes.reduce(
        (attributes, attribute, index) => ({
          ...attributes,
          [(attribute.name ?? attribute.shortName ?? attribute.type ?? index) as string]:
            attribute.value,
        }),
        {},
      ),
      hash: String(value.subject.hash),
    },
    serialNumber: value.serialNumber,
    version: value.version,
    validFrom: value.validFrom,
    validUntil: value.validUntil,
    publicKey: value.publicKey.toString(),
    issuer: {
      commonName: value.issuerCommonName,
      organization: value.issuerOrganization,
    },
  }))
  readonly certificate: Certificate
  readonly revoked: boolean
  readonly active: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly validUntil: Date
  readonly subject: string

  @Exclude()
  readonly rootCaId: number

  public constructor(ca: JSONSelectableForTable<'ca'>) {
    super(ca.id.toString())

    this.subject = ca.subject
    this.certificate = hydrateCertificate(ca.certificate)
    this.revoked = ca.is_revoked
    this.active = ca.active
    this.createdAt = new Date(ca.created_at)
    this.updatedAt = new Date(ca.updated_at)
    this.validUntil = new Date(ca.valid_until)
    this.rootCaId = ca.root_ca_id
  }

  public getLinks() {
    return {
      certificate: `/ca/${this.id}/certificate`,
      rootCa: `/root-ca/${this.rootCaId}`,
      cas: `/ca`,
    }
  }
}
