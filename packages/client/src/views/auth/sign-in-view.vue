<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { router } from '@/router'
import { useOnboardingStore } from '@/stores/onboarding'
import ZButton from '@/components/z-button.vue'
import ZTextField from '@/components/fields/z-text-field.vue'

const props = defineProps<{
  message?: string
  previousPage?: string
}>()

// TODO: check if server is set up already. If not, redirect to setup page
// TODO: Generate nonce during server startup if no users in table. Require nonce to continue setup.
//       Create a guard to check if nonce is set. If not, redirect to setup page.
//       During setup, create a user and let them register an authenticator.
//       After setup, walk them through initial resource creation.
const onboardingStore = useOnboardingStore()
const userStore = useProfileStore()

const email = ref('')
const emailValid = computed(() => Boolean(email.value.match(/.+@.+/)))
const password = ref('')
const passkeyFailed = ref(false)
const passkeysSupported = Boolean(window.PublicKeyCredential)

onMounted(async () => {
  await onboardingStore.checkOnboardingStatus()

  if (!onboardingStore.complete) {
    return router.push('/setup')
  }

  await preparePasskeyAuthentication()
})

async function preparePasskeyAuthentication() {
  try {
    await userStore.offerPasskeyAuthentication()

    return userStore.redirectAfterSignIn(router, props.previousPage)
  } catch (error) {
    passkeyFailed.value = true
  }
}

// 11.07.24 13:30 ADHS 3. OG

async function signIn(event: Event) {
  if (!window.PublicKeyCredential) {
    throw new Error('Passkeys are not supported by this browser')
  }

  event.preventDefault()

  return userStore.redirectAfterSignIn(router, props.previousPage)
}
</script>

<template>
  <article class="flex flex-col justify-center items-center max-w-6xl py-8 mx-auto w-full">
    <div
      v-if="passkeyFailed"
      class="error max-w-xs mb-8 bg-red-500 text-white rounded py-2 px-4 shadow-md flex items-center"
    >
      <span>
        Uh-oh, Something went wrong while signing you in. Try again or request a passcode while we
        fix things!
      </span>
    </div>

    <form v-if="passkeysSupported" class="w-full max-w-xs" @submit="signIn">
      <z-text-field
        v-model="email"
        autocomplete="email webauthn"
        label="Email Address"
        name="email"
        placeholder="jane@doe.com"
        required
        type="email"
      />

      <z-button :disabled="!passkeyFailed || emailValid" class="mt-4 w-full" submit>
        <span>Continue</span>
      </z-button>
    </form>

    <form v-else class="flex flex-col" @submit="signIn">
      <z-text-field
        v-model="email"
        autocomplete="email"
        autofocus
        label="Email Address"
        name="email"
        placeholder="jane@doe.com"
        required
        type="email"
      />

      <z-text-field
        v-model="password"
        autocomplete="current-password"
        class="mt-2"
        name="credential"
        placeholder="Password"
        required
        type="password"
      />

      <z-button class="mt-8" submit>Sign in</z-button>
    </form>
  </article>
</template>
