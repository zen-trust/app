import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { PrivateKey } from './certificate.js'

export function encryptBuffer(value: Buffer, secret: Buffer): [Buffer, Buffer] {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', secret, iv)

  return [Buffer.concat([cipher.update(value), cipher.final()]), iv]
}

export function decryptBuffer(value: Buffer, iv: Buffer, secret: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-cbc', secret, iv)

  return Buffer.concat([decipher.update(value), decipher.final()])
}

export function encryptPrivateKey(privateKey: PrivateKey, secret: Buffer): Buffer {
  if (secret.length !== 32) {
    throw new Error('Secret key must be exactly 32 bytes')
  }

  const key = randomBytes(32)
  const [header, headerIv] = encryptBuffer(key, secret)
  const [payload, payloadIv] = encryptBuffer(privateKey.toBuffer(), key)

  // An encrypted private key is a buffer of the following format:
  // 16 bytes: IV for the key
  // 48 bytes: Encrypted key
  // 16 bytes: IV for the payload
  // n bytes: Encrypted payload
  // We need to store the IVs, so we can decrypt the key and payload later.
  return Buffer.concat([headerIv, header, payloadIv, payload])
}

export function decryptPrivateKey(encryptedPrivateKey: Buffer, secret: Buffer): PrivateKey {
  // Split the payload into the IVs and the encrypted data, as described in
  // the comment in `encryptPrivateKey`.
  const keyIv = encryptedPrivateKey.subarray(0, 16)
  const key = encryptedPrivateKey.subarray(16, 64)
  const payloadIv = encryptedPrivateKey.subarray(64, 80)
  const payload = encryptedPrivateKey.subarray(80)
  const decryptedKey = decryptBuffer(key, keyIv, secret)
  const decryptedPayload = decryptBuffer(payload, payloadIv, decryptedKey)

  return PrivateKey.fromBuffer(decryptedPayload)
}
