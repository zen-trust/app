<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  name: string
  id?: string
  label?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
}>()

const inputId = computed(() => `field-${props.id ?? props.name}`)
const labelText = computed(() => {
  const value = props.label ?? props.name ?? ''

  return value.charAt(0).toUpperCase() + value.slice(1)
})

const fieldClasses = computed(() => ({
  flex: true,
  'items-center': true,
  relative: true,
  'bg-[#FFFFFA] dark:bg-green-900/10': !props.disabled,
  'bg-green-50 dark:bg-gray-950': props.disabled,
  'pointer-events-none': props.disabled,
  'text-gray-700': true,
  'dark:text-gray-200': true,
  border: true,
  'border-green-200/50': true,
  'dark:border-green-500/25': true,
  'focus-within:border-green-500/40': true,
  'focus-within:ring': true,
  'ring-green-200': true,
  'dark:ring-green-800/50': true,
  rounded: true,
  shadow: true,
  transition: true,
}))
const controlClasses = computed(() => [
  'peer',
  'appearance-none',
  'bg-transparent',
  'outline-none',
  'grow',
  'dark:placeholder:text-gray-600',
  'placeholder:select-none',
])

function handleIconClick(event: Event) {
  const target = event.currentTarget as HTMLSpanElement

  target?.parentElement?.querySelector('input')?.focus()
}
</script>

<template>
  <div :class="$slots['label'] || labelText ? 'pt-7' : ''">
    <div
      v-show="loading"
      class="progress-line flex absolute top-7 mt-[1px] mx-[1px] left-0 right-0 h-1 z-10 rounded-t-[3px] overflow-hidden bg-green-500/40"
    />
    <div :class="fieldClasses">
      <span
        v-if="$slots['prepend-icon']"
        class="order-1 left-0 ml-3 absolute select-none"
        @click="handleIconClick"
      >
        <slot name="prepend-icon" />
      </span>
      <label
        :for="inputId"
        class="bg-inherit border-inherit rounded first:pl-3 min-h-[2.5rem] pl-11 w-full grow flex flex-wrap items-stretch order-2 cursor-text"
      >
        <slot
          :classes="controlClasses"
          :fieldName="name"
          :inputId="inputId"
          :labelText="labelText"
          :required="required"
        />
        <span
          class="absolute -top-6 left-0 pl-3 peer-required:after:content-['*'] after:font-bold after:pl-[2px] empty:hidden block w-full text-sm text-green-900/75 dark:text-green-200/50 peer-focus:text-green-500 order-1 cursor-default select-none"
        >
          <slot :text="labelText" name="label">
            <span v-text="labelText" />
          </slot>
        </span>
      </label>
      <span
        v-if="$slots['append-icon']"
        class="absolute order-3 right-0 mr-3 select-none"
        @click="handleIconClick"
      >
        <slot name="append-icon" />
      </span>
    </div>

    <span
      v-if="$slots['hint'] || hint"
      class="block leading-relaxed mt-1 text-xs pl-3 text-gray-500"
    >
      <slot :hint="hint" name="hint">
        <span v-text="hint" />
      </slot>
    </span>
  </div>
</template>

<style lang="postcss" scoped>
@keyframes indeterminate {
  0% {
    transform: translateX(0) scaleX(0);
  }
  40% {
    transform: translateX(20%) scaleX(0.4);
  }
  50% {
    transform: translateX(25%) scaleX(0.6);
  }
  70% {
    transform: translateX(60%) scaleX(0.4);
  }
  100% {
    transform: translateX(100%) scaleX(0.8);
  }
}

.progress-line::before {
  @apply h-full w-full;
  background: linear-gradient(
    to right,
    theme('colors.green.200') 0%,
    theme('colors.green.300') 5%,
    theme('colors.green.300') 95%,
    theme('colors.green.200') 100%
  );
  content: '';
  transform-origin: 0 50%;
  animation: indeterminate 1s infinite linear;
}
</style>
