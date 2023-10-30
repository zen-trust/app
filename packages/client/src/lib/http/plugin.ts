import ky from 'ky'
import type { PiniaPlugin } from 'pinia'
import type { InjectionKey, Plugin } from "vue";
import { authenticateRequest, handleUnauthorizedResponse } from '@/lib/http/hooks'
import { type ApiContext, buildContext } from '@/lib/http/context'

export const api = Symbol('apiContext') as InjectionKey<ApiContext>

export function createApiContext() {
  const prefixUrl = new URL(
    (import.meta.env.VITE_API_URL_PATH_PREFIX ?? '') as string,
    import.meta.env.VITE_API_URL as string,
  )

  const client = ky.create({
    prefixUrl,
    timeout: Number(import.meta.env.VITE_HTTP_CLIENT_TIMEOUT ?? 5_000),
    hooks: {
      beforeRequest: [
        // checkCache(cacheStore, options),
        authenticateRequest,
      ],
      afterResponse: [
        // cacheResponse(cacheStore, options),
        handleUnauthorizedResponse,
      ],
    },
  })
  const context = buildContext(client)
  const vuePlugin: Plugin = function vuePlugin(this: never, app) {
    app.config.globalProperties.$api = context
    app.provide(api, context)
  }
  const piniaPlugin: PiniaPlugin = function piniaPlugin(this: never, { store }) {
    store.$api = context
  }

  return {
    vuePlugin,
    piniaPlugin,
  }
}
