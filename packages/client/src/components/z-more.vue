<script lang="ts" setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { computed } from 'vue'
import ZIcon from '@/components/z-icon.vue'

interface Action {
  name: string
  label: string
}

interface OptionalAction {
  name: string
  label: undefined
}

const props = defineProps<{
  actions: Record<string, string | undefined>
}>()

const emit = defineEmits<{
  action: [string]
}>()

const items = computed(() => {
  return Object.entries(props.actions)
    .map(([name, label]) => ({ name, label }))
    .filter((item: Action | OptionalAction): item is Action => typeof item.label !== 'undefined')
})

function invoke(action: string) {
  emit('action', action)
}
</script>

<template>
  <Menu v-slot="{ open }" as="nav" class="relative">
    <menu-button
      :class="open ? 'ring' : ''"
      class="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-800 outline-none focus:ring ring-green-500 ring-opacity-50 focus:opacity-100 transition rounded-full"
    >
      <slot name="icon">
        <z-icon class="leading-none h-4" name="more_horiz" />
      </slot>
    </menu-button>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-out"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <menu-items
        as="ul"
        class="absolute z-10 right-0 p-1 mt-2 w-56 origin-top-right divide-y divide-gray-50 dark:divide-gray-900 rounded-md bg-white dark:bg-black shadow-lg ring-1 ring-gray-50 dark:ring-gray-800/50 focus:outline-none"
      >
        <menu-item
          v-for="action in items"
          :key="`${action.name}t`"
          v-slot="{ active }"
          as="template"
        >
          <li
            :key="action.name"
            :class="active ? 'bg-gray-50/50' : ''"
            class="px-2 py-1 z-10 hover:bg-gray-50/50 dark:hover:bg-gray-900/75 active:bg-gray-50/75 dark:active:bg-gray-900 text-gray-700 dark:text-gray-400 last:rounded-b first:rounded-t cursor-pointer"
            @click.stop="invoke(action.name)"
          >
            <slot
              :action="action.name"
              :active="active"
              :label="action.label"
              :name="`action-${action.name}`"
            >
              <span>{{ action.label }}</span>
            </slot>
          </li>
        </menu-item>
      </menu-items>
    </transition>
  </Menu>
</template>
