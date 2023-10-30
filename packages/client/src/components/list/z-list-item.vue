<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'
import ZMore from '@/components/z-more.vue'
import { router } from '@/router'

const props = defineProps<{
  title?: string
  subtitle?: string
  actions?: Record<string, string | undefined>
  to?: RouteLocationRaw
  disabled?: boolean
}>()

const emit = defineEmits<{
  show: []
  action: [string]
}>()

function show() {
  emit('show')

  if (props.to) {
    return router.push(props.to)
  }
}

function action(name: string) {
  emit('action', name)
}
</script>

<template>
  <li
    :class="{ 'pointer-events-none': disabled }"
    class="flex items-center hover:before:opacity-50 before:pointer-events-none before:opacity-0 before:absolute before:scale-y-105 before:scale-x-[102%] before:top-0 before:left-0 before:w-full before:h-full before:bg-gray-50 dark:before:bg-gray-800 before:transition-all before:rounded relative group"
  >
    <slot name="prepend" />

    <div v-if="$slots.avatar" class="mr-4 py-1 relative" @click.stop="show">
      <slot name="avatar" />
    </div>

    <div class="flex flex-col relative grow overflow-hidden" @click.stop="show">
      <slot>
        <strong class="font-medium dark:text-gray-200">
          <slot name="title">{{ title }}</slot>
        </strong>
        <span class="text-sm text-gray-500 text-ellipsis max-w-full overflow-hidden">
          <slot name="subtitle">{{ subtitle }}</slot>
        </span>
      </slot>
    </div>

    <div class="relative select-none">
      <slot name="actions">
        <z-more v-if="actions" :actions="actions" @action="action" />
      </slot>
    </div>

    <slot name="append" />
  </li>
</template>
