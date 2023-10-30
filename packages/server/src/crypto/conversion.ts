import { Certificate } from './certificate.js'

export function hydrateCertificate(data: string): Certificate {
  return Certificate.fromBuffer(pgBytesToBuffer(data))
}

export function bufferToPgBytes(value: Buffer): string {
  return `\\x${value.toString('hex')}`
}

export function pgBytesToBuffer(value: string): Buffer {
  return Buffer.from(value.slice(2), 'hex')
}
