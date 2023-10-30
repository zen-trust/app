import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64";

const crypto = globalThis.crypto

export function generateKeyPair(namedCurve: string): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve,
    },
    false,
    ['deriveKey', 'deriveBits'],
  )
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const rawPublicKey = await crypto.subtle.exportKey('raw', publicKey)

  return arrayBufferToBase64(rawPublicKey)
}

export async function deriveSharedSecret(
  privateKey: CryptoKey,
  serverPublicKey: CryptoKey,
  namedCurve: string,
  bits = 256,
): Promise<ArrayBuffer> {
  const algorithm = {
    name: 'ECDH',
    namedCurve,
    public: serverPublicKey,
  }

  return crypto.subtle.deriveBits(algorithm, privateKey, bits)
}

export async function deriveEncryptionKey(
  sharedSecret: BufferSource,
  hashAlgorithm: string,
  bits = 256,
): Promise<Uint8Array> {
  const sharedSecretKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits'],
  )

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: hashAlgorithm,
      salt: new Uint8Array(0),
      info: new Uint8Array(0),
    },
    sharedSecretKey,
    bits,
  )

  // TODO: Why is this working? There is a type mismatch here somewhere...
  return derivedKey as Uint8Array
}

export async function importServerPublicKey(
  publicKey: string,
  namedCurve: string,
): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      'raw',
      base64ToArrayBuffer(publicKey),
      { name: 'ECDH', namedCurve },
      false,
      [],
    )
  } catch (error) {
    throw new Error(`Failed to import public key: ${(error as Error).message}`)
  }
}

export function generatePassPhrase(length = 32): Uint8Array {
  if (length < 32) {
    throw new Error('Pass phrase must be at least 32 bytes')
  }

  return crypto.getRandomValues(new Uint8Array(length))
}

export async function encryptPassPhrase(
  passPhrase: ArrayBuffer,
  derivedKey: Uint8Array,
  difficulty = 10,
): Promise<Uint8Array> {
  const hashKey = await grindKey(derivedKey, difficulty)
  const encryptionKey = await crypto.subtle.importKey('raw', hashKey, { name: 'AES-GCM' }, false, [
    'encrypt',
  ])

  const iv = await getIv(derivedKey, passPhrase)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    encryptionKey,
    passPhrase,
  )

  // Combine the IV and cipher text into a single buffer. The server needs
  // to know the length of the IV to be able to decrypt the cipher text.
  const cipherBuffer = new Uint8Array(iv.byteLength + cipher.byteLength)
  cipherBuffer.set(new Uint8Array(iv))
  cipherBuffer.set(new Uint8Array(cipher), iv.byteLength)

  return cipherBuffer
}

export async function decryptPassPhrase(
  cipherText: ArrayBuffer,
  derivedKey: ArrayBuffer,
  difficulty = 10,
): Promise<ArrayBuffer> {
  const hashKey = await grindKey(derivedKey, difficulty)
  const encryptionKey = await crypto.subtle.importKey('raw', hashKey, { name: 'AES-GCM' }, false, [
    'decrypt',
  ])

  const iv = new Uint8Array(cipherText.slice(0, 12))
  const cipherTextBuffer = new Uint8Array(cipherText.slice(12))

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    encryptionKey,
    cipherTextBuffer,
  )
}

export function grindKey(key: ArrayBuffer, difficulty: number): Promise<ArrayBuffer> {
  const keyBuffer = new Uint8Array(key)

  return pbkdf2(
    keyBuffer,
    new Uint8Array([...keyBuffer, ...keyBuffer]),
    Math.pow(2, difficulty),
    32,
    'SHA-256',
  )
}

export async function pbkdf2(
  message: BufferSource,
  salt: BufferSource,
  iterations: number,
  keyLength: number,
  algorithm: string,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    message,
    {
      name: 'PBKDF2',
    },
    false,
    ['deriveBits'],
  )

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: algorithm,
    },
    key,
    keyLength * 8,
  )
}

export function getIv(password: Uint8Array, data: BufferSource): Promise<ArrayBuffer> {
  const randomData = crypto.getRandomValues(new Uint8Array(12))
  const timestamp = new TextEncoder().encode(new Date().getTime().toString())

  return pbkdf2(
    new Uint8Array([...new Uint8Array(password.buffer), ...randomData]),
    // @ts-expect-error - Uint8Array is not a BufferSource
    new Uint8Array([...data, ...timestamp]),
    1,
    12,
    'SHA-256',
  )
}
