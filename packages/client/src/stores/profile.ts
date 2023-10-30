import type { User } from '@zen-trust/server'
import {
  browserSupportsWebAuthnAutofill,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types'
import { defineStore } from 'pinia'
import type { Router } from 'vue-router'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: undefined as User | undefined,
  }),
  actions: {
    async fetchProfile(): Promise<void> {
      this.profile = await this.$api.single<User>('authentication/profile')
    },

    async signOut(): Promise<void> {
      await this.$api.http.post('authentication/session/terminate')
      this.profile = undefined
    },

    redirectAfterSignIn(router: Router, previousPage?: string) {
      return router.push({
        name: previousPage ?? 'user.profile',
        force: true,
      })
    },

    async confirmInvitation(id: string, token: string) {
      await this.$api.http.post(`invitation/${id}/${token}/accept`)
    },

    async createAccount(email: string, name: string) {
      this.profile = await this.$api.create<User>('authentication/profile', {
        type: 'user',
        attributes: { email, name },
      })
    },

    async offerPasskeyAuthentication() {
      const available = await browserSupportsWebAuthnAutofill()

      if (!available) {
        throw new Error('Passkeys are not available on this platform')
      }

      const options = await this.requestAssertion()
      const credential = await startAuthentication(options, true)

      try {
        await this.verifyAssertion(credential)
        await this.fetchProfile()
      } catch (verificationError) {
        const message = (verificationError as Error).message

        throw new OfferedPassKeyAuthenticationException(
          `Failed to verify assertion: ${message}`,
          credential,
        )
      }
    },

    async registerPasskey() {
      const options = await this.requestAttestation()
      let attestation: RegistrationResponseJSON

      if (options.authenticatorSelection) {
        options.authenticatorSelection.residentKey = 'required'
        options.authenticatorSelection.requireResidentKey = true
      }

      options.extensions = { credProps: true }

      try {
        attestation = await startRegistration(options)
      } catch (error) {
        const message = (error as Error).message

        throw new Error(`Failed to generate attestation options: ${message}`)
      }

      await this.verifyAttestation(attestation)
    },

    async requestAssertion(): Promise<PublicKeyCredentialRequestOptionsJSON> {
      let assertionOptionsResponse: Response
      let assertionOptions: PublicKeyCredentialRequestOptionsJSON

      try {
        assertionOptionsResponse = await this.$api.http.get('authentication/assertion/generate')
        assertionOptions =
          (await assertionOptionsResponse.json()) as PublicKeyCredentialRequestOptionsJSON
      } catch (error) {
        const message = (error as Error).message

        throw new Error(`Failed to generate assertion options: ${message}`)
      }

      return assertionOptions
    },

    async verifyAssertion(assertion: AuthenticationResponseJSON) {
      await this.$api.http.post('authentication/assertion/verify', assertion)
    },

    async requestAttestation(): Promise<PublicKeyCredentialCreationOptionsJSON> {
      try {
        const attestationOptionsResponse = await this.$api.http.get(
          '/authentication/attestation/generate',
        )

        return (await attestationOptionsResponse.json()) as PublicKeyCredentialCreationOptionsJSON
      } catch (error) {
        const message = (error as Error).message

        throw new Error(`Failed to generate attestation options: ${message}`)
      }
    },

    async verifyAttestation(attestation: RegistrationResponseJSON) {
      await this.$api.http.post('authentication/attestation/verify', attestation)
    },

    async updateName(name: string) {
      this.profile = await this.$api.update<User>('authentication/profile', {
        type: 'user',
        id: 'urn:zen-trust:user:me',
        attributes: { name },
      })
    },

    updateProfile(profile: User): void {
      this.profile = profile
    },
  },
  persist: true,
})

class OfferedPassKeyAuthenticationException extends Error {
  public readonly credential?: AuthenticationResponseJSON

  public constructor(message: string, credential?: AuthenticationResponseJSON) {
    super(message)
    this.credential = credential
  }
}
