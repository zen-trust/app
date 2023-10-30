<script lang="ts" setup>
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <ul class="flex flex-col" :class="compact ? 'space-y-1' : 'space-y-2'">
    <slot :compact="compact" />
  </ul>
</template>
