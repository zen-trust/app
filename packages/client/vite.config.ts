import { fileURLToPath, URL } from "node:url";
import { defineConfig, HttpProxy, loadEnv, ProxyOptions } from "vite";
import vue from "@vitejs/plugin-vue";
import { performance } from "perf_hooks";
import { IncomingMessage, ServerResponse } from "http";
import { webfontDownload } from "vite-plugin-webfont-dl";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const apiUrlPathPrefix = env.VITE_API_URL_PATH_PREFIX ?? '/api'

  return {
    root: fileURLToPath(new URL('.', import.meta.url)),
    plugins: [
      webfontDownload(),
      vue()
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    build: {
      sourcemap: true,
      manifest: true
    },

    server: {
      host: '0.0.0.0',
      strictPort: true,
      proxy: {
        [env.VITE_API_URL_PATH_PREFIX ?? '/api']: {
          target: 'http://server:3000',
          changeOrigin: true,
          configure(proxy: HttpProxy.Server, options) {
            proxy.on('proxyRes', (_, request, response) =>
              logProxyRequest(request, response, options)
            )
          },
          rewrite: (path) => path.replace(new RegExp(`^${apiUrlPathPrefix}`), '')
        }
      }
    }
  }

  function logProxyRequest<T extends IncomingMessage>(
    request: T,
    response: ServerResponse<T>,
    options: ProxyOptions
  ): void {
    performance.mark('start')

    response.on('finish', () => {
      performance.mark('end')
      const { duration } = performance.measure('duration', 'start', 'end')
      const time = new Date().toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      })
      const url = apiUrlPathPrefix + request.url
      const upstreamUrl = new URL(
        <string>request.url,
        options.target?.toString() ?? 'http://unknown'
      )
      const durationSeconds = (duration / 1000).toLocaleString('en-US', {
        maximumFractionDigits: 6,
        minimumFractionDigits: 2,
        useGrouping: false,
        unitDisplay: 'narrow',
        style: 'unit',
        unit: 'second'
      })

      console.log(
        `${time} [proxy] ${request.method} ${url} → ${upstreamUrl} ${response.statusCode} (${durationSeconds})`
      )
    })
  }
})
