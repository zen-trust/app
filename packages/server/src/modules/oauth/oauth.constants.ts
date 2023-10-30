export const grantType = {
  AUTHORIZATION_CODE: 'authorization_code' as const,
  CLIENT_CREDENTIALS: 'client_credentials' as const,
  REFRESH_TOKEN: 'refresh_token' as const,
  TOKEN_EXCHANGE: 'urn:ietf:params:oauth:grant-type:token-exchange' as const,
}

export type GrantType = (typeof grantType)[keyof typeof grantType]
