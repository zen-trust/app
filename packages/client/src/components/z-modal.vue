<script lang="ts" setup>
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

defineProps<{
  modelValue: boolean
  title?: string
  subtitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  close: []
}>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <transition-root :show="modelValue" as="template">
    <Dialog :open="modelValue" @close="close">
      <transition-child
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div aria-hidden="true" class="fixed inset-0 backdrop-blur-xl bg-black/30" />
      </transition-child>

      <div class="fixed inset-0 flex w-screen items-center justify-center p-4">
        <transition-child
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <dialog-panel
            class="w-full min-w-[25vw] mb-[25vh] max-w-md transform overflow-hidden rounded-2xl bg-paper dark:bg-black p-6 text-left align-middle shadow-xl transition-all"
          >
            <dialog-title class="text-xl font-medium dark:text-gray-200">
              <slot name="title">{{ title }}</slot>
            </dialog-title>
            <dialog-description v-if="$slots['subtitle'] || subtitle" class="text-gray-700 dark:text-gray-500 text-sm">
              <slot name="subtitle">{{ subtitle }}</slot>
            </dialog-description>

            <div class="mt-4">
            <slot />
            </div>

            <footer class="flex items-center space-x-2 mt-8">
              <slot name="actions" />
            </footer>
          </dialog-panel>
        </transition-child>
      </div>
    </Dialog>
  </transition-root>
</template>
