<script lang="ts" setup>
import { ref } from 'vue'
import BaseLayout from '@/components/layouts/base-layout.vue'
import ZButton from '@/components/z-button.vue'
import { useProfileStore } from '@/stores/profile'
import { HttpException } from '@/lib/http/context'
import ZTextField from '@/components/fields/z-text-field.vue'
import { inferNameFromEmail } from '@/lib/utils'
import {router} from "@/router";

const props = defineProps<{
  token: string
  id: string
}>()

const profileStore = useProfileStore()
const accepted = ref(false)
const loading = ref(false)
const error = ref<string | undefined>(undefined)
const email = ref('')
const namePristine = ref(true)
const nameHint = ref<string | undefined>('Your name will be visible to other users.')
const name = ref('')

async function accept() {
  loading.value = true

  try {
    await profileStore.confirmInvitation(props.id, props.token)
    accepted.value = true
  } catch (invitationError) {
    if (!(invitationError instanceof HttpException)) {
      throw invitationError
    }

    switch (invitationError.statusCode) {
      case 404:
        return (error.value = 'The invitation link is invalid: No such invitation.')

      case 403:
        return (error.value = `The invitation link is invalid: ${invitationError.message}.`)
    }
  } finally {
    loading.value = false
  }
}

function inferName() {
  if (!namePristine.value) {
    return
  }

  name.value = inferNameFromEmail(email.value)
  nameHint.value = "We've filled in your name based on your email address. Feel free to change it."
}

async function createAccount(event: Event) {
  event.preventDefault()
  loading.value = true

  try {
    await profileStore.createAccount(email.value, name.value)
    await profileStore.registerPasskey()
    await router.push({ name: 'home' })
  } catch (accountError) {
    if (!(accountError instanceof HttpException)) {
      throw accountError
    }

    switch (accountError.statusCode) {
      case 403:
        return (error.value = `The invitation link is invalid: ${accountError.message}.`)

      case 409:
        return (error.value = 'An account with this email address already exists.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <base-layout>
    <template #title>Join Fides</template>
    <template #subtitle>
      You have been invited to join Fides. Please create an account to get started.
    </template>

    <section v-if="!accepted" class="flex flex-col items-center justify-center py-16">
      <z-button :disabled="loading || !!error" @click="accept">
        Accept invitation
      </z-button>

      <span v-if="error" class="text-sm text-red-500 mt-4 max-w-lg text-center">
        {{ error }}
      </span>
    </section>

    <section v-else class="max-w-lg">
      <form @submit="createAccount">
        <z-text-field
          v-model="email"
          :disabled="loading"
          autocomplete="email"
          label="Email Address"
          name="email"
          placeholder="jane.doe@example.com"
          required
          type="email"
          @blur="inferName"
        />

        <z-text-field
          v-model="name"
          :disabled="loading"
          :hint="nameHint"
          autocomplete="full-name"
          class="mt-4"
          label="Your Name"
          name="name"
          placeholder="Jane Margaret Doe"
          required
          @keydown.once="namePristine = false"
        />

        <footer class="flex items-center mt-8">
          <z-button :disabled="loading" submit>Create Account</z-button>

          <span v-if="error" class="text-sm text-red-500 ml-4">
            {{ error }}
          </span>
        </footer>
      </form>
    </section>
  </base-layout>
</template>
