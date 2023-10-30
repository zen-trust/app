import { Transform } from 'class-transformer'
import type { Certificate } from '../../crypto/certificate.js'

export class RootCaCertificateResponse {
  readonly commonName: string | undefined

  @Transform(({ value }: { value: number }) => value.toString(16))
  readonly serialNumber: number
  readonly version: number
  readonly validFrom: Date
  readonly validUntil: Date
  readonly publicKey: string
  readonly issuer: {
    commonName: string | undefined
    organization: string | undefined
  }

  constructor(certificate: Certificate) {
    this.commonName = certificate.commonName
    this.serialNumber = certificate.serialNumber
    this.version = certificate.version
    this.validFrom = certificate.validFrom
    this.validUntil = certificate.validUntil
    this.publicKey = certificate.publicKey.toString()
    this.issuer = {
      commonName: certificate.issuerCommonName,
      organization: certificate.issuerOrganization,
    }
  }
}
