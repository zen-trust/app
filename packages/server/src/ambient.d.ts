import type { AccessToken, AccessTokenPayload } from './modules/token/token.service.js'
import type { User } from './modules/user/user.entity.js'
import type { Invitation } from './modules/invitation/invitation.entity.js'

interface RuntimeEnvironmentVariables {
  LISTEN_PORT: string | undefined
  LISTEN_HOST: string | undefined
  DATABASE_URL: string | undefined
  SECRET_KEY: string | undefined
  SESSION_SECRET: string | undefined
  JWT_SECRET: string | undefined
  WEBAUTHN_ORIGIN: string | undefined
}

declare global {
  namespace NodeJS {
    // interface ProcessEnv extends RuntimeEnvironmentVariables {}

    namespace Process {
      let env: RuntimeEnvironmentVariables
    }
  }
}

declare module '@fastify/secure-session' {
  interface SessionData {
    'passkey.challenge': string
    'passkey.authenticator': string

    'onboarding.sealed': boolean
    'onboarding.nonce': string

    authenticated: boolean
    'user.id': string
    'invitation.id': string

    'encryption.session': string
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    encryptionSessionId: string | undefined
    jwt: (AccessToken & AccessTokenPayload) | undefined
    user: User | undefined
    invitation: Invitation | undefined
  }
}

export {}
