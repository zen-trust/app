<script lang="ts" setup>
import { onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'
import BaseLayout from '@/components/layouts/base-layout.vue'

const userStore = useProfileStore()

onMounted(async () => {
  await userStore.signOut()

  setTimeout(() => {
    window.location.href = '/'
  }, 3000)
})
</script>

<template>
  <base-layout>
    <template #title>Sign out</template>
    <template #subtitle>
      You have been signed out. You will be redirected to the home page in a few seconds.
    </template>
  </base-layout>
</template>
