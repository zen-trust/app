import type { md } from 'node-forge'
import { asn1, pki } from 'node-forge'
import { Exclude, Expose, Transform } from 'class-transformer'
import type { TransformationContext } from '../entity.js'
import { Entity } from '../entity.js'

export class PrivateKey {
  @Exclude()
  public readonly key: pki.PrivateKey

  constructor(key: pki.PrivateKey) {
    this.key = key
  }

  static fromBuffer(buffer: Buffer): PrivateKey {
    return new PrivateKey(pki.privateKeyFromAsn1(asn1.fromDer(buffer.toString())))
  }

  static fromPem(pem: string): PrivateKey {
    return new PrivateKey(pki.privateKeyFromPem(pem))
  }

  toBuffer(): Buffer {
    const privateKey = asn1.toDer(pki.privateKeyToAsn1(this.key))

    return Buffer.from(privateKey.data)
  }

  toString(): string {
    return pki.privateKeyToPem(this.key)
  }
}

export class PublicKey {
  @Exclude()
  public readonly key: pki.PublicKey

  constructor(key: pki.PublicKey) {
    this.key = key
  }

  toString(): string {
    return pki.publicKeyToPem(this.key)
  }
}

export class Certificate extends Entity<'certificate'> {
  public table = 'certificate' as const
  public type = 'certificate' as const

  @Exclude()
  readonly cert: pki.Certificate

  @Exclude()
  private readonly _publicKey: PublicKey

  constructor(certificate: pki.Certificate) {
    super(certificate.serialNumber.toString())

    this.cert = certificate
    this._privateKey = new PrivateKey(this.cert.privateKey)
    this._publicKey = new PublicKey(this.cert.publicKey)
  }

  @Exclude()
  private _privateKey: PrivateKey

  get privateKey(): PrivateKey {
    return this._privateKey
  }

  set privateKey(key: PrivateKey) {
    this.cert.privateKey = key.key
    this._privateKey = key
  }

  @Transform(({ value }: TransformationContext<'certificate', Certificate>) => value.toString())
  @Expose()
  get publicKey(): PublicKey {
    return this._publicKey
  }

  @Transform(({ value }: { value: pki.Certificate['subject'] }) => ({
    attributes: value.attributes.reduce(
      (attributes, attribute, index) => ({
        ...attributes,
        [attribute.name ?? attribute.shortName ?? attribute.type ?? index]: attribute.value,
      }),
      {},
    ),
    hash: value.hash as string,
  }))
  @Expose()
  get subject() {
    return this.cert.subject
  }

  @Transform(({ value }: { value: pki.Certificate['issuer'] }) => ({
    attributes: value.attributes.reduce(
      (attributes, attribute, index) => ({
        ...attributes,
        [attribute.name ?? attribute.shortName ?? attribute.type ?? index]: attribute.value,
      }),
      {},
    ),
    hash: value.hash as string,
  }))
  @Expose()
  get issuer() {
    console.log('Getting issuer')
    return this.cert.issuer
  }

  @Expose()
  get serialNumber(): number {
    return Number(this.cert.serialNumber)
  }

  @Expose()
  get version(): number {
    return this.cert.version
  }

  @Expose()
  get validUntil(): Date {
    return this.cert.validity.notAfter
  }

  @Expose()
  get validFrom(): Date {
    return this.cert.validity.notBefore
  }

  @Expose()
  get commonName(): string | undefined {
    return this.cert.subject.getField('CN')?.value as string | undefined
  }

  @Exclude()
  get issuerCommonName(): string | undefined {
    return this.cert.issuer.getField('CN')?.value as string | undefined
  }

  @Exclude()
  get issuerOrganization(): string | undefined {
    return this.cert.issuer.getField('O')?.value as string | undefined
  }

  static fromPem(pem: string): Certificate {
    return new Certificate(pki.certificateFromPem(pem))
  }

  static fromBuffer(buffer: Buffer): Certificate {
    return new Certificate(pki.certificateFromAsn1(asn1.fromDer(buffer.toString())))
  }

  sign(key: pki.PrivateKey, digest: md.MessageDigest): void {
    this.cert.sign(key, digest)
  }

  toString(): string {
    return pki.certificateToPem(this.cert)
  }

  toBuffer(): Buffer {
    const certificate = asn1.toDer(pki.certificateToAsn1(this.cert))

    return Buffer.from(certificate.data)
  }
}
