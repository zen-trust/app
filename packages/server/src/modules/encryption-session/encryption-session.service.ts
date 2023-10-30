import {
  createDecipheriv,
  createECDH,
  ECDH,
  hkdf as Hkdf,
  pbkdf2 as Pbkdf2,
  randomUUID,
} from 'node:crypto'
import { promisify } from 'node:util'
import { Buffer } from 'node:buffer'
import { Inject, Injectable } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

const hkdf = promisify(Hkdf)
const pbkdf2 = promisify(Pbkdf2)

@Injectable({})
export class EncryptionSessionService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public async createSession(publicKey: string) {
    const keyExchange = createECDH('prime256v1')
    keyExchange.generateKeys()

    const clientPublicKey = ECDH.convertKey(
      publicKey,
      'prime256v1',
      'base64',
      'base64',
      'compressed',
    ) as string
    const sharedSecret = keyExchange.computeSecret(clientPublicKey, 'base64', 'base64')
    const sessionId = randomUUID()

    // Store the private key in the cache, so that we can retrieve it later
    // when the client sends us the encrypted secret.
    await this.cacheManager.set(
      this.getCacheIdentifier(sessionId),
      {
        privateKey: keyExchange.getPrivateKey('base64'),
        clientPublicKey,
        sharedSecret,
      } satisfies EncryptionSession,
      30_000,
    )

    return {
      publicKey: keyExchange.getPublicKey('base64', 'compressed'),
      sessionId,
    }
  }

  public hasSession(sessionId: string) {
    return Boolean(this.cacheManager.get<EncryptionSession>(this.getCacheIdentifier(sessionId)))
  }

  public async decryptSecret(sessionId: string, encryptedSecret: string) {
    const { sharedSecret } = await this.pullSession(sessionId)
    const key = await this.deriveKey(sharedSecret)
    const keyHash = await this.grindKey(key)

    return this.decrypt(encryptedSecret, keyHash)
  }

  private async pullSession(id: string) {
    const session: EncryptionSession | undefined = await this.cacheManager.get(
      this.getCacheIdentifier(id),
    )

    if (!session) {
      throw new Error('No such session')
    }

    // Remove the private key from the cache, so that it can't be used again
    await this.cacheManager.del(this.getCacheIdentifier(id))

    return session
  }

  private async deriveKey(sharedSecret: string) {
    const key = await hkdf(
      'sha256',
      Buffer.from(sharedSecret, 'base64'),
      new Uint8Array(0),
      new Uint8Array(0),
      32,
    )

    return Buffer.from(key)
  }

  private async grindKey(key: Buffer) {
    const hash = await pbkdf2(key, Buffer.concat([key, key]), Math.pow(2, 10), 32, 'sha256')

    return Buffer.from(hash)
  }

  private decrypt(cipherText: string, key: Buffer) {
    const cipher = Buffer.from(cipherText, 'base64')
    const iv = cipher.subarray(0, 12)
    const encryptedPassPhrase = cipher.subarray(12, -16)
    const tag = cipher.subarray(-16)
    const decipher = createDecipheriv('aes-256-gcm', key, iv, {
      authTagLength: 16,
    })
    decipher.setAuthTag(tag)

    return Buffer.concat([decipher.update(encryptedPassPhrase), decipher.final()])
  }

  private getCacheIdentifier(sessionId: string): string {
    return `encryptionSession:${sessionId}`
  }
}

export interface EncryptionSession {
  privateKey: string
  clientPublicKey: string
  sharedSecret: string
}
