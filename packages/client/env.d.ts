/// <reference types="vite/client" />
import type { ApiContext } from '@/lib/http/context'

interface ImportMetaEnv {
  readonly VITE_API_URL: string | undefined
  readonly VITE_API_URL_PATH_PREFIX: string | undefined
  readonly VITE_HTTP_CLIENT_TIMEOUT: string | undefined
  readonly VITE_WEBAUTHN_RELAY_PARTY_DOMAIN: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'pinia' {
  export interface PiniaCustomProperties {
    $api: ApiContext
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: ApiContext
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: ApiContext
  }
}

export {}
