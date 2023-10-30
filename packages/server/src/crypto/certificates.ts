import { promisify } from 'node:util'
import { md, pki } from 'node-forge'
import { Certificate } from './certificate.js'

const generate = promisify(pki.rsa.generateKeyPair)

export function generateKeyPair(modulusLength = 2048): Promise<pki.KeyPair> {
  if (modulusLength < 2048) {
    throw new Error('Modulus length must be at least 2048')
  }

  return generate({ bits: modulusLength })
}

export function signCertificate<T extends Certificate, V extends Certificate>(
  authority: T,
  certificate: V,
  algorithm: md.Algorithm = 'sha512',
): V {
  certificate.sign(authority.privateKey.key, md[algorithm].create())

  return certificate
}

export function issueRootCertificateAuthority(
  keyPair: pki.KeyPair,
  options?: Partial<CaOptions>,
): Certificate {
  const certificate = issueCertificateAuthority(keyPair, {
    ...options,
    extensions: {
      ...options?.extensions,
      basicConstraints: {
        cA: true,
        pathLenConstraint: 0,
      },
      keyUsage: {
        keyCertSign: true,
      },
    },
  })

  return signCertificate(certificate, certificate)
}

export function issueIntermediateCertificateAuthority(
  keyPair: pki.KeyPair,
  authority: Certificate,
  options?: Partial<CaOptions>,
): Certificate {
  const certificate = issueCertificateAuthority(keyPair, {
    ...options,
    issuerAttributes: authority.subject.attributes,
    extensions: {
      ...options?.extensions,
      basicConstraints: {
        cA: true,
        pathLenConstraint: 1,
      },
      keyUsage: {
        keyCertSign: true,
        cRLSign: true,
      },
    },
  })

  return signCertificate(authority, certificate)
}

export function issueCertificateAuthority(
  keyPair: pki.KeyPair,
  options?: Partial<CaOptions>,
): Certificate {
  // eslint-disable-next-line no-param-reassign -- merging with defaults here
  options = {
    ...options,
    commonName: options?.commonName ?? 'zen-trust CA',
    issuerAttributes: options?.issuerAttributes ?? {},
    subjectAttributes: options?.subjectAttributes ?? {},
    extensions: options?.extensions ?? {},
    validity: options?.validity ?? 365 * 24 * 60 * 60 * 1000,
  }

  const certificate = pki.createCertificate()
  const { publicKey, privateKey } = keyPair

  certificate.privateKey = privateKey
  certificate.publicKey = publicKey

  if (!options.serialNumber) {
    throw new Error('No serial number provided')
  }

  certificate.serialNumber = options.serialNumber
  certificate.validity.notBefore = new Date()
  // eslint-disable-next-line no-nested-ternary -- makes the most sense here
  certificate.validity.notAfter = options?.validity
    ? // eslint-disable-next-line no-nested-ternary -- makes the most sense here
      options.validity instanceof Date
      ? options.validity
      : typeof options.validity === 'number'
      ? new Date(Date.now() + options.validity)
      : options.validity?.notBefore ?? new Date()
    : new Date()

  certificate.setSubject(
    buildFields({
      ...(options.subjectAttributes ?? {}),
      commonName: options.commonName ?? 'zen-trust CA',
    }),
  )

  certificate.setIssuer(
    Array.isArray(options.issuerAttributes)
      ? options.issuerAttributes
      : buildFields({
          ...(options.issuerAttributes ?? {}),
          commonName: options.commonName ?? 'zen-trust CA',
        }),
  )

  certificate.setExtensions([...buildFields({ ...options?.extensions })])

  return new Certificate(certificate)
}

function buildFields(fields: Fields | Extensions) {
  return Object.entries(fields).map(([name, options]) => ({
    name,
    ...(typeof options === 'string' ? { value: options } : options),
  }))
}

interface CaOptions {
  serialNumber: string
  commonName: string
  issuerAttributes: Fields | pki.CertificateField[]
  subjectAttributes: Fields
  validity:
    | {
        notBefore?: Date
        notAfter?: Date
      }
    | Date
    | number
  extensions: Extensions
}

type Fields = Record<string, Omit<pki.CertificateField, 'name'> | string>
type Extensions = Record<string, Omit<Record<string, unknown>, 'name'> | string>
