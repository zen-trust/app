<script lang="ts" setup>
import ZIcon from '@/components/z-icon.vue'

defineProps<{
  name?: string
  iconClass?: string
}>()
</script>

<template>
  <div
    class="flex justify-center items-center rounded-full h-8 w-8"
  >
    <z-icon :class="iconClass" :name="name">
      <slot />
    </z-icon>
  </div>
</template>
