<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: string | RouteLocationRaw
  title: string
  exact?: boolean
}>()

const classes =
  'py-2 px-4 hover:border-r-4 hover:bg-green-50 dark:hover:bg-green-700/50 hover:border-green-200 focus:bg-green-50 dark:focus:bg-green-700/50 focus:border-green-200 outline-none select-none whitespace-nowrap transition'
const activeClasses =
  'border-r-4 border-green-500 hover:border-green-500 bg-green-100 dark:bg-green-900/50'
</script>

<template>
  <router-link
    :active-class="activeClasses"
    :class="classes"
    :exact="exact"
    :exact-active-class="activeClasses"
    :to="to"
  >
    <span v-text="title"/>
  </router-link>
</template>
