<script lang="ts" setup>
import ZButton from '@/components/z-button.vue'
</script>

<template>
  <article>
    <div class="flex items-center flex-col pt-[10vh] justify-center">
      <span class="text-7xl mb-4">🎉</span>
      <strong class="font-medium text-2xl">Great, you're all set up!</strong>

      <z-button class="mt-12" to="/" large> Continue to dashboard </z-button>
    </div>
  </article>
</template>
