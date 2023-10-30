<script lang="ts" setup>
import type { User } from '@zen-trust/server'
// @ts-ignore
import VueAvatar from '@webzlodimir/vue-avatar'
import '@webzlodimir/vue-avatar/dist/style.css'

withDefaults(
  defineProps<{
    user: User
    size?: number
    borderRadius?: string
  }>(),
  {
    size: 4,
  },
)
</script>

<template>
  <vue-avatar class="select-none" :border-radius="borderRadius" :size="size * 8" :username="user.name" />
</template>
