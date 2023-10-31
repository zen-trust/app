<script lang="ts" setup>
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    as?: string | Component
    title?: string
  }>(),
  {
    as: 'section',
  },
)
</script>

<template>
  <component
    :is="as"
    :class="{ 'pb-2': !!$slots.footer }"
    class="-mx-6 p-6 rounded-2xl bg-white dark:bg-black shadow dark:shadow-md"
  >
    <header class="flex items-start justify-between mb-2">
      <slot name="header">
        <h3 class="text-lg font-medium">
          <slot name="title">{{ title }}</slot>
        </h3>

        <slot name="actions" />
      </slot>
    </header>
    <slot />

    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>
  </component>
</template>
