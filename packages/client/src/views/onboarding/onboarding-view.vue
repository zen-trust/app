<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import BaseLayout from '@/components/layouts/base-layout.vue'
import CompletedMessage from '@/components/setup/completed-message.vue'
import ReadyMessage from '@/components/setup/ready-message.vue'
import SetupStep from '@/components/setup/setup-step.vue'
import SetupSteps from '@/components/setup/setup-steps.vue'
import { HttpException } from '@/lib/http/context'
import { inferNameFromEmail } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboarding'
import { useProfileStore } from '@/stores/profile'
import ZTextField from "@/components/fields/z-text-field.vue";

const onboardingStore = useOnboardingStore()
const profileStore = useProfileStore()

const loading = ref(false)
const started = ref(false)
const complete = ref(false)
const currentStep = ref(0)

const nonce = ref(getNonceFromSearchParams())
const nonceError = ref<string | undefined>(undefined)
const onboardingSealed = computed(() => onboardingStore.sealed)

const email = ref('')
const name = ref<string | undefined>(undefined)

watch(
  email,
  () =>
    (name.value = typeof name.value === 'undefined' ? inferNameFromEmail(email.value) : name.value),
)

onMounted(async () => {
  if (nonce.value) {
    started.value = true
    currentStep.value = 1
    await sealOnboarding()
  }
})

async function sealOnboarding() {
  loading.value = true
  nonceError.value = undefined

  try {
    await onboardingStore.seal(nonce.value)
    currentStep.value = 1
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    const body = await error.response.json()
    nonceError.value = body.message
  } finally {
    loading.value = false
  }
}

async function exchangeOnboardingTokenForUserToken() {
  loading.value = true

  try {
    await onboardingStore.createUserAccount(email.value, <string>name.value)
    await profileStore.registerPasskey()
    currentStep.value = 2
  } catch (error) {
    if (!(error instanceof HttpException)) {
      throw error
    }

    const body = await error.response.json()
    nonceError.value = body.message
  } finally {
    loading.value = false
  }
}

function getNonceFromSearchParams() {
  const params = new URLSearchParams(window.location.search)

  return params.get('nonce') ?? ''
}
</script>

<template>
  <base-layout>
    <transition mode="out-in" name="fade">
      <ready-message v-if="!started" :key="3" @started="started = true" />
      <completed-message v-else-if="complete" :key="1" />
      <setup-steps v-else :key="2" v-model="currentStep" @complete="complete = true">
        <setup-step
          id="nonce"
          v-slot="{ disabled }"
          :valid="nonce.length == 32"
          description="In the log output of your Fides instance, you should see a nonce. Please enter it here to confirm that you are the owner of this instance."
          ready
          title="Confirm instance control"
          @continue="sealOnboarding"
        >
          <z-text-field
            v-model="nonce"
            :disabled="disabled || loading"
            class="max-w-md"
            label="Nonce"
            name="nonce"
            required
          />
          <span
            v-if="nonceError"
            class="block ml-3 mt-2 leading-relaxed max-w-3xl text-sm text-red-500"
          >
            {{ nonceError }}
          </span>
        </setup-step>

        <setup-step
          id="account"
          v-slot="{ disabled }"
          :ready="onboardingSealed"
          :valid="!!(email && name)"
          description="You will be able to invite other users later."
          title="Create your user account"
          @continue="exchangeOnboardingTokenForUserToken"
        >
          <z-text-field
            v-model="email"
            :disabled="disabled"
            class="max-w-md mb-2"
            label="Email Address"
            name="email"
            placeholder="jane@doe.com"
          />
          <z-text-field
            v-model="name"
            :disabled="disabled"
            class="max-w-md"
            label="Name"
            name="name"
            placeholder="Jane Doe"
          />
        </setup-step>

        <setup-step
          id="trust-root"
          description="Configure your trust root certification authority."
          title="Trust root"
        ></setup-step>

        <setup-step
          id="signing-cas"
          description="Create intermediate certification authorities to sign your certificates."
          title="Signing CAs"
        ></setup-step>

        <setup-step
          id="invite-users"
          description="Send invites to your team mates."
          title="Invite users"
        ></setup-step>
      </setup-steps>
    </transition>
  </base-layout>
</template>
