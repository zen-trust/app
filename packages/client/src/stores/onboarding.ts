import type { ApiResponseWithSingleResourceObject as SingleResponse } from '@zen-trust/json-api'
import type { User } from '@zen-trust/server'
import { defineStore } from 'pinia'
import { useProfileStore } from './profile'

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    complete: false,
    sealed: false,
  }),

  actions: {
    async checkOnboardingStatus() {
      const response = await this.$api.http.get('onboarding/status')
      const { complete } = (await response.json()) as {
        complete: boolean
      }

      this.complete = complete
    },

    async seal(nonce: string) {
      await this.$api.http.post('onboarding/seal', { nonce })
      this.sealed = true
    },

    async createUserAccount(email: string, name: string) {
      const userStore = useProfileStore()
      const userResponse = await this.$api.http.post('onboarding/account', { email, name })
      const userResponseBody = (await userResponse.json()) as SingleResponse<User>
      const user = userResponseBody.data.attributes

      userStore.updateProfile(user)
    },
  },
})
