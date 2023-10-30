<script lang="ts" setup>
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  submit?: boolean
  reset?: boolean
  subtle?: boolean
  text?: boolean
  disabled?: boolean
  small?: boolean
  large?: boolean
  inset?: boolean
  target?: '_blank' | '_self' | '_parent' | '_top'
  to?: string | URL | RouteLocationRaw
}>()

const elementType = computed(() => (props.to ? 'router-link' : 'button'))
const type = computed(() =>
  elementType.value === 'button'
    ? props.submit
      ? 'submit'
      : props.reset
      ? 'reset'
      : 'button'
    : undefined,
)

const insetClasses =
  'text-gray-500 dark:text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-800/75 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-200 active:bg-gray-100 focus:ring-gray-300 dark:focus:ring-gray-500/50'
const subtleClasses =
  'text-white bg-green-500/75 dark:bg-green-700 hover:bg-green-500 dark:hover:bg-green-900 focus:ring-green-100 dark:focus:ring-green-900/75'
const defaultClasses =
  'text-white bg-green-500 dark:bg-green-700 hover:bg-green-600 dark:hover:bg-green-900 focus:ring-green-300 dark:focus:ring-green-900/75'
const textClasses = 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-500'

const classes = [
  'flex',
  'items-center',
  props.inset
    ? insetClasses
    : props.subtle
    ? subtleClasses
    : props.text
    ? textClasses
    : defaultClasses,
  'outline-none',
  'focus:ring',
  props.small ? 'px-2 py-1 text-sm' : props.large ? 'px-6 py-3 text-lg' : 'px-4 py-2',
  'rounded',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'transition',
  'select-none',
]
</script>

<template>
  <component
    :is="elementType"
    :class="classes"
    :disabled="disabled"
    :target="target"
    :to="to"
    :type="type"
  >
    <slot />
  </component>
</template>
