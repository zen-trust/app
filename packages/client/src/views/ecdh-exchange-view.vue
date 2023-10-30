<script lang="ts" setup>
import { inject, nextTick, ref } from 'vue'
import ZButton from '@/components/z-button.vue'
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/base64'
import {
  decryptPassPhrase,
  deriveEncryptionKey,
  deriveSharedSecret,
  encryptPassPhrase,
  exportPublicKey,
  generateKeyPair,
  generatePassPhrase,
  importServerPublicKey,
} from '@/lib/crypto'
import { HttpException } from '@/lib/http/context'
import { api as apiSymbol } from '@/lib/http/plugin'

const api = inject(apiSymbol)

if (!api) {
  throw new Error('Failed to inject API')
}

const logElement = ref<HTMLElement | null>(null)
const log = ref<LogEntry[]>([])

const loading = ref(false)
const keyExchangeButtonEnabled = ref(true)
const createRootCaButtonEnabled = ref(true)
const createIntermediateCaButtonEnabled = ref(true)
const validateCaCertificateButtonEnabled = ref(true)

async function executeKeyExchange() {
  loading.value = true
  keyExchangeButtonEnabled.value = false

  try {
    await executeLogged(testKeyExchange)
  } catch (error) {
    await appendToLog(error as Error)
  } finally {
    loading.value = false
    keyExchangeButtonEnabled.value = true
  }
}

async function executeCreateRootCa() {
  loading.value = true
  createRootCaButtonEnabled.value = false

  try {
    await executeLogged(createRootCa)
  } catch (error) {
    await appendToLog(error as Error)
  } finally {
    loading.value = false
    createRootCaButtonEnabled.value = true
  }
}

async function executeCreateIntermediateCa() {
  loading.value = true
  createIntermediateCaButtonEnabled.value = false

  try {
    await executeLogged(createIntermediateCa)
  } catch (error) {
    await appendToLog(error as Error)
  } finally {
    loading.value = false
    createIntermediateCaButtonEnabled.value = true
  }
}

async function executeValidateCaCertificate() {
  loading.value = true
  validateCaCertificateButtonEnabled.value = false

  try {
    await executeLogged(validateCaCertificate)
  } catch (error) {
    await appendToLog(error as Error)
  } finally {
    loading.value = false
    validateCaCertificateButtonEnabled.value = true
  }
}

async function executeLogged(action: () => Promise<any>): Promise<void> {
  try {
    await action()
  } catch (error) {
    await appendToLog(<Error>error, 'error')
  }
}

async function testKeyExchange() {
  clearLog()
  await appendToLog('Starting ECDH key exchange', 'info')

  const { publicKey, privateKey } = await generateKeyPair('P-256')
  const clientPublicKeyBase64 = await exportPublicKey(publicKey)
  await appendToLog('Generated client keys:', 'success', {
    algorithm: publicKey.algorithm.name,
    usages: publicKey.usages,
    type: publicKey.type,
    extractable: publicKey.extractable,
    value: clientPublicKeyBase64,
  })

  const { publicKey: serverPublicKeyBase64, sessionId } =
    await exchangePublicKeys(clientPublicKeyBase64)

  await appendToLog('Importing server public key', 'info', {
    publicKey: serverPublicKeyBase64,
  })
  const serverPublicKey = await importServerPublicKey(serverPublicKeyBase64, 'P-256')

  const sharedSecret = await deriveSharedSecret(privateKey, serverPublicKey, 'P-256')
  await appendToLog('Derived shared secret', 'success', {
    sharedSecret: arrayBufferToBase64(sharedSecret),
  })

  const derivedKey = await deriveEncryptionKey(sharedSecret, 'SHA-256', 256)
  await appendToLog('Derived encryption key', 'success', {
    derivedKey: arrayBufferToBase64(derivedKey),
  })

  const passPhrase = generatePassPhrase(32)
  const encryptedPassPhrase = await encryptPassPhrase(passPhrase, derivedKey)

  await appendToLog('Generated root CA encryption pass phrase', 'success', {
    passPhrase: arrayBufferToBase64(passPhrase),
    encrypted: arrayBufferToBase64(encryptedPassPhrase),
  })

  try {
    const badKey = generatePassPhrase(32).buffer
    const decrypted = await decryptPassPhrase(encryptedPassPhrase, badKey)

    if (arrayBufferToBase64(decrypted) === arrayBufferToBase64(passPhrase)) {
      await appendToLog('Decrypted pass phrase with invalid key', 'warning')
    }
  } catch (error) {
    await appendToLog('Failed to decrypt pass phrase with invalid key', 'success')
  }

  try {
    const decrypted = await decryptPassPhrase(encryptedPassPhrase, derivedKey)

    if (arrayBufferToBase64(decrypted) !== arrayBufferToBase64(passPhrase)) {
      await appendToLog('Decrypted pass phrase does not match original', 'warning')
    } else {
      await appendToLog('Verified passphrase decryption', 'success')
    }
  } catch (error) {
    await appendToLog(<Error>error, 'error')

    throw error
  }

  // Send the shared secret to the server
  const message = await exchangeSharedSecret(encryptedPassPhrase, sessionId)
  await appendToLog('Received message from server', 'info', {
    message,
  })

  if (message !== arrayBufferToBase64(passPhrase)) {
    throw new Error('Received message from server does not match expected message')
  }

  await appendToLog('Decrypted message matches client secret', 'success')
  await appendToLog('Exchange complete!', 'success')
}

async function createRootCa() {
  clearLog()
  await appendToLog('Creating root CA', 'info')

  const { publicKey, privateKey } = await generateKeyPair('P-256')
  const clientPublicKeyBase64 = await exportPublicKey(publicKey)
  const { publicKey: serverPublicKeyBase64, sessionId } =
    await exchangePublicKeys(clientPublicKeyBase64)
  const serverPublicKey = await importServerPublicKey(serverPublicKeyBase64, 'P-256')
  const sharedSecret = await deriveSharedSecret(privateKey, serverPublicKey, 'P-256')
  const derivedKey = await deriveEncryptionKey(sharedSecret, 'SHA-256', 256)

  await appendToLog('Created encryption session', 'success', {
    sharedSecret: arrayBufferToBase64(sharedSecret),
    derivedKey: arrayBufferToBase64(derivedKey),
  })

  const passPhrase = generatePassPhrase(32)
  const encryptedPassPhrase = await encryptPassPhrase(passPhrase, derivedKey)

  await appendToLog('Generated root CA encryption pass phrase', 'success', {
    passPhrase: arrayBufferToBase64(passPhrase),
    encrypted: arrayBufferToBase64(encryptedPassPhrase),
  })

  const request = new Request('api/root-ca', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Encryption-Session-Id': sessionId,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      passPhrase: arrayBufferToBase64(encryptedPassPhrase),
    }),
  })
  let response: Response

  await appendToLog('→ Dispatching root CA creation request', 'info', request)

  try {
    response = await api!.http.request(request)
    await appendToLog('← Received root CA creation response', response)
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    response = error.response
    await appendToLog('← Received root CA creation response', response)
    await reportHttpError('Failed to create root CA', error)
  }

  const responseBody = await response.json()

  await appendToLog('Root CA created', 'success', {
    rootCa: responseBody.data,
  })

  // Activate the root CA, so it will be used in intermediary creation
  await activateRootCa(responseBody.data.id)

  updateCurrentSecret(passPhrase)
}

async function createIntermediateCa() {
  clearLog()
  await appendToLog('Creating intermediate CA', 'info')

  const { publicKey, privateKey } = await generateKeyPair('P-256')
  const clientPublicKeyBase64 = await exportPublicKey(publicKey)
  const {
    publicKey: serverPublicKeyBase64,
    sessionId,
  } = await exchangePublicKeys(clientPublicKeyBase64)
  const serverPublicKey = await importServerPublicKey(serverPublicKeyBase64, 'P-256')
  const sharedSecret = await deriveSharedSecret(privateKey, serverPublicKey, 'P-256')
  const derivedKey = await deriveEncryptionKey(sharedSecret, 'SHA-256', 256)

  await appendToLog('Created encryption session', 'success', {
    sharedSecret: arrayBufferToBase64(sharedSecret),
    derivedKey: arrayBufferToBase64(derivedKey),
  })

  const passPhrase = await promptForUserInput(
    'Enter the root CA passphrase:',
    'info',
    'Enter passphrase',
    'Enter the root CA passphrase to sign the intermediate CA.',
    arrayBufferToBase64(getCurrentSecret() as ArrayBuffer),
  )

  const encryptedPassPhrase = await encryptPassPhrase(
    base64ToArrayBuffer(<string>passPhrase),
    derivedKey,
  )

  const responseBody = await createCa(encryptedPassPhrase,sessionId)

  await appendToLog('Intermediate CA created', 'success', {
    intermediateCa: responseBody.links.self,
  })
}

async function validateCaCertificate() {
  clearLog()
  await appendToLog('Validating CA certificate', 'info')

  const id = await promptForUserInput(
    'Enter the CA ID to validate:',
    'info',
    'Enter certificate ID',
    'Enter the certificate ID to validate.',
  )
  const request = new Request(`api/ca/${id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
  let response: Response

  await appendToLog('→ Dispatching CA data request', 'info', request)

  try {
    response = await api!.http.request(request)
    await appendToLog('← Received CA data response', response)
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    response = error.response
    await appendToLog('← Received CA data response', response)
    await reportHttpError('Failed to validate CA certificate', error)
  }

  const responseBody = await response.json()
  await appendToLog('Validated CA certificate', 'success', {
    certificate: responseBody.data,
  })
}

async function exchangePublicKeys(publicKey: string) {
  const request = new Request('api/encryption-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ publicKey }),
  })
  let response: Response

  await appendToLog('→ Dispatching key exchange request', 'info', request)

  try {
    response = await api!.http.request(request)
    await appendToLog('← Received key exchange response', response)
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    response = error.response
    await appendToLog('← Received key exchange response', response)
    await reportHttpError('Failed to exchange public keys with server', error)
  }

  const responseBody = await response.json()

  return {
    publicKey: responseBody.data.publicKey,
    sessionId: responseBody.data.sessionId,
  }
}

async function exchangeSharedSecret(
  encryptedPassPhrase: ArrayBuffer,
  sessionId: string,
): Promise<string> {
  const request = new Request(`api/encryption-session/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Encryption-Session-Id': sessionId,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      secret: arrayBufferToBase64(encryptedPassPhrase),
    }),
  })
  let response: Response

  await appendToLog('→ Dispatching session verification request', 'info', request)

  try {
    response = await api!.http.request(request)
    await appendToLog('← Received session verification response', response)
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    response = error.response
    await appendToLog('← Received session verification response', response)
    await reportHttpError('Failed to verify session', error)
  }

  const responseBody = await response.json()

  return responseBody.data.message
}

async function createCa(encryptedPassPhrase: ArrayBuffer, sessionId: string): Promise<any> {
  const request = new Request('api/ca', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Encryption-Session-Id': sessionId
    },
    body: JSON.stringify({
      signingPassPhrase: arrayBufferToBase64(encryptedPassPhrase),
      subject: 'Zen Trust Intermediate CA',
    }),
  })

  await appendToLog('→ Dispatching intermediate CA creation request', 'info', request)

  let response: Response

  try {
    response = await api!.http.request(request)

    await appendToLog('← Received intermediate CA creation response', response)
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    response = error.response
    await appendToLog('← Received intermediate CA creation response', response)
    await reportHttpError('Failed to create intermediate CA', error)
  }

  return response.json()
}

async function activateRootCa(id: number): Promise<void> {
  const request = new Request(`api/root-ca/${id}/activate`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
    },
  })

  await appendToLog('→ Dispatching intermediate CA activation request', 'info', request)

  let response: Response

  try {
    response = await api!.http.request(request)

    await appendToLog('← Received intermediate CA activation response', response)
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    response = error.response
    await appendToLog('← Received intermediate CA activation response', response)
    await reportHttpError('Failed to activate intermediate CA', error)
  }
}

interface LogEntry {
  timestamp: Date
  time: string
  messageType: string
  message: string
  trace?: string
  meta?: string
  action?: {
    label: string
    handler: (event: Event) => void
    value?: any
  }
}

async function appendToLog(
  message: string | Error,
  messageType: string | number | Response = 'info',
  meta: Record<string, any> | Request | Response | string | null = null,
  callback: ((entry: LogEntry) => LogEntry | Promise<LogEntry>) | null = null,
) {
  if (messageType instanceof Response) {
    // eslint-disable-next-line no-param-reassign -- in this case we're just allowing different call signatures
    meta = messageType
    // eslint-disable-next-line no-param-reassign -- in this case we're just allowing different call signatures
    messageType = messageType.status >= 200 && messageType.status <= 299 ? 'success' : 'error'
  }

  if (message instanceof Error) {
    // eslint-disable-next-line no-param-reassign -- it makes the most sense here
    messageType = 'error'
  }

  if (meta !== null) {
    if (meta instanceof Request) {
      const request = meta.clone()
      let body

      if (request.body) {
        const bodyString = (await readBodyStream(request)) || ''

        try {
          body = JSON.parse(bodyString)
        } catch (error) {
          body = bodyString
        }
      }

      const url = new URL(request.url)
      const uri = `${url.pathname}${url.search}${url.hash}`.trim()
      const headers = [`Host: ${url.host}`, ...formatHeaders(request.headers)]
      const bodyString = request.body
        ? typeof body === 'string'
          ? body
          : JSON.stringify(body, null, 2)
        : ''
      // eslint-disable-next-line no-param-reassign -- in this case we're just allowing different call signatures
      meta = `${request.method} ${uri} HTTP/1.1\n${headers.join('\n')}\n\n${bodyString}`.trim()
    } else if (meta instanceof Response) {
      const response = meta.clone()
      const bodyData = await response.text()
      let body

      if (response.headers.get('Content-Type')?.startsWith('application/json')) {
        try {
          body = JSON.parse(bodyData)
        } catch (error) {
          body = bodyData
        }
      } else {
        body = bodyData
      }

      const bodyString = typeof body === 'string' ? body : JSON.stringify(body, null, 2)
      // eslint-disable-next-line no-param-reassign -- in this case we're just allowing different call signatures
      meta =
        `HTTP/1.1 ${response.status} ${response.statusText}\n` +
        `${formatHeaders(response.headers).join('\n')}\n\n${bodyString.trim()}`
    }
  }

  const timestamp = new Date()
  let logEntry: LogEntry = {
    timestamp,
    time: timestamp.toLocaleTimeString('de', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      // @ts-ignore
      fractionalSecondDigits: 3,
    }),
    messageType: messageType.toString(),
    message: message instanceof Error ? message.message : message,
    trace: message instanceof Error && message.stack ? message.stack : undefined,
    meta: meta ? (typeof meta === 'string' ? meta : JSON.stringify(meta, null, 2)) : undefined,
    action: undefined,
  }

  if (callback) {
    logEntry = await callback(logEntry)
  }

  log.value.push(logEntry)

  await nextTick(
    () => logElement.value?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' }),
  )
}

function promptForUserInput(
  message: string,
  messageType: string,
  label: string,
  promptMessage: string,
  fallback: string | null = null,
) {
  return new Promise((resolve) => {
    appendToLog(message, messageType, null, (entry) => {
      const entryAction: LogEntry['action'] = {
        label,
        handler: () => {
          // eslint-disable-next-line no-alert -- this is just a demo
          const value = prompt(promptMessage, fallback !== null ? fallback : '')
          if (entryAction) {
            entryAction.value = value
          }

          resolve(value)
        },
      }

      return {
        ...entry,
        action: entryAction,
      }
    })
  })
}

async function readBodyStream(request: Request): Promise<string> {
  const reader = request.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let body = ''

  if (!reader) {
    return body
  }

  // eslint-disable-next-line no-constant-condition -- reading a stream works this way
  while (true) {
    // eslint-disable-next-line no-await-in-loop -- it makes the most sense here
    const { done, value } = await reader.read()

    if (done) {
      return body
    }

    body += decoder.decode(value, { stream: true })
  }
}

function formatHeaders(headers: Headers): string[] {
  return Array.from(headers.entries())
    .map(([name, value]) => [
      name
        .split('-')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('-'),
      value,
    ])
    .map(([name, value]) => `${name}: ${value}`)
}

async function reportHttpError(reason: string, error: HttpException): Promise<never> {
  const response = error.response
  const responseBodyText = await response.text()
  let responseBody: Record<string, any>

  try {
    responseBody = JSON.parse(responseBodyText)
  } catch (error) {
    responseBody = { message: responseBodyText || response.statusText }
  }

  throw new Error(
    `${reason}: ${response.statusText} (${response.status}):\n${responseBody.message}`,
  )
}

function clearLog(): void {
  log.value = []
}

function updateCurrentSecret(secret: ArrayBuffer): void {
  const element: HTMLElement | null = document.querySelector('.actions .current-secret')

  if (element) {
    element.innerText = arrayBufferToBase64(secret)
  }
}

function getCurrentSecret() {
  const element: HTMLElement | null = document.querySelector('.actions .current-secret')

  if (element) {
    return base64ToArrayBuffer(element.innerText)
  }
}
</script>

<template>
  <div class="w-full flex-col flex py-8 max-w-6xl mx-auto">
    <header>
      <h1 class="font-medium text-2xl">ECDH Exchange</h1>

      <div class="actions flex mt-4 items-end">
        <z-button :disabled="loading" class="mr-2" @click="executeKeyExchange"
          >Test key Exchange
        </z-button>
        <z-button :disabled="loading" class="mr-2" @click="executeCreateRootCa"
          >Create Root CA
        </z-button>
        <z-button :disabled="loading" class="mr-2" @click="executeCreateIntermediateCa"
          >Create Intermediate CA
        </z-button>
        <z-button :disabled="loading" class="mr-2" @click="executeValidateCaCertificate"
          >Validate CA certificate
        </z-button>

        <code
          class="ml-auto py-1 px-2 text-sm rounded relative bg-gray-100 select-all cursor-pointer transition current-secret"
        ></code>
      </div>
    </header>

    <div
      ref="logElement"
      class="log empty:hidden mt-8 px-4 divide-y text-sm bg-paper dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl max-h-full overflow-auto"
    >
      <div v-for="(entry, index) in log" :key="index" class="log-entry flex items-center py-4">
        <time class="self-start text-right text-gray-500 text-xs mt-1 mr-4 w-full basis-12"
          >{{ entry.time }}
        </time>
        <div class="entry-details w-full flex flex-wrap items-center">
          <code
            :data-type="entry.messageType"
            class="message-type inline-block mr-4 py-1.5 leading-none px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
          >
            {{ entry.messageType }}
          </code>
          <code>{{ entry.message }}</code>
          <template v-if="entry.action">
            <span
              v-if="entry.action.value"
              class="entry-action-value bg-blue-100 text-blue-700 px-2 rounded-md ml-2"
            >
              {{ entry.action.value }}
            </span>
            <z-button v-else class="entry-action ml-2" small @click="entry.action.handler">
              {{ entry.action.label }}
            </z-button>
          </template>

          <pre
            v-if="entry.trace"
            class="w-full mt-2 p-2 bg-gray-100 text-gray-700 rounded-md whitespace-pre-wrap break-all text-sm"
            >{{ entry.trace?.trim() }}</pre
          >
          <pre
            v-if="entry.meta"
            class="w-full mt-2 p-2 bg-gray-100 text-gray-700 rounded-md whitespace-pre-wrap break-all text-sm"
            >{{ entry.meta?.trim() }}</pre
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.actions .current-secret:empty::after {
  content: 'No secret set';
}

.actions .current-secret::before {
  position: absolute;
  top: calc(-100% + 0.6rem);
  left: 0.5rem;
  font-size: 0.6rem;
  white-space: nowrap;
  content: 'Current secret:';
  font-family: sans-serif;
  user-select: none;
}

.log .log-entry .message-type[data-type='error'] {
  @apply bg-red-200;
}

.log .log-entry .message-type[data-type='success'] {
  @apply bg-green-200;
}

.log .log-entry .message-type[data-type='info'] {
  @apply bg-blue-200;
}

.log .log-entry .message-type[data-type='warning'] {
  @apply bg-orange-200;
}

@media screen and (prefers-color-scheme: dark) {
  .actions .current-secret {
    background-color: rgba(255, 255, 255, 0.075);
  }

  .actions .current-secret:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .log .log-entry .entry-details pre {
    background-color: rgb(2 6 23);
    color: rgb(148 163 184);
  }

  .log .log-entry:not(:last-child) {
    border-bottom: 1px solid rgb(51 65 85);
  }
}
</style>
