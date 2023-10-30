const textEncoder = new TextEncoder()

function uInt8ArrayToString(value: Uint8Array): string {
  return String.fromCharCode.apply(null, Array.from(value))
}

export function stringToBase64(value: string): string {
  const base64 = btoa(value)

  return uInt8ArrayToString(textEncoder.encode(base64))
}

export function stringToBase64Url(value: string): string {
  return stringToBase64(value)
    .replace(/=/g, '')
    .replace(/[+/]/g, (char) => (char === '+' ? '-' : '_'))
}

export function base64UrlToString(value: string): string {
  return atob(value.replace(/-/g, '+').replace(/_/g, '/'))
}

export function base64ToBase64Url(base64String: string): string {
  return btoa(atob(base64String)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlToBase64(base64UrlString: string): string {
  const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4)

  return (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/')
}

export function base64urlToArrayBuffer(base64UrlString: string): ArrayBuffer {
  return base64ToArrayBuffer(base64UrlToBase64(base64UrlString))
}

export function base64ToArrayBuffer(base64String: string): ArrayBuffer {
  return new Uint8Array(
    atob(base64String)
      .split('')
      .map((c) => c.charCodeAt(0)),
  )
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))))
}
