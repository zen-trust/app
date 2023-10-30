<script lang="ts" setup>
defineProps<{
  name?: string
}>()
</script>

<template>
  <span aria-hidden="true" class="material-symbols-outlined leading-none align-top select-none">
    <slot>{{ name }}</slot>
  </span>
</template>
