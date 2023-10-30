<script lang="ts" setup>
import ZButton from '@/components/z-button.vue'

const emit = defineEmits<{
  started: []
}>()
</script>

<template>
  <article class="flex flex-col grow">
    <header class="mb-8">
      <h1 class="font-medium text-3xl">Setup</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Welcome to your Fides instance! Let's get you started.
      </p>
    </header>

    <div class="flex pt-[10vh] justify-center">
      <z-button large @click="emit('started')">Get Started</z-button>
    </div>
  </article>
</template>
