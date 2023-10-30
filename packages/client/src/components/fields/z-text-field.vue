<script lang="ts" setup>
import { ref } from 'vue'
import ZField from '@/components/fields/z-field.vue'

withDefaults(
  defineProps<{
    autocapitalize?: string
    autocomplete?: string
    autofocus?: boolean
    disabled?: boolean
    hint?: string
    id?: string
    label?: string
    max?: number
    maxlength?: number
    min?: number
    modelValue?: string
    multiline?: boolean
    name: string
    pattern?: string
    placeholder?: string
    readonly?: boolean
    required?: boolean
    size?: number
    step?: number
    type?: string
  }>(),
  {
    autocapitalize: 'none',
    autocomplete: 'off',
    autofocus: false,
    disabled: false,
    multiline: false,
    readonly: false,
    required: false,
    type: 'text',
  },
)

const emit = defineEmits<{
  'update:modelValue': [string]
  blur: [Event]
  change: [Event]
  focus: [Event]
  keydown: [KeyboardEvent]
  keyup: [KeyboardEvent]
}>()

const input = ref<HTMLInputElement | null>(null)

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement

  emit('update:modelValue', target.value)
}
</script>

<template>
  <z-field :label="label" :name="name" :required="required" :hint="hint">
    <template v-if="$slots['prepend-icon']" #prepend-icon>
      <slot name="prepend-icon" />
    </template>
    <template #default="{ inputId, classes }">
      <input
        :id="inputId"
        ref="input"
        :autocapitalize="autocapitalize"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :class="classes"
        :disabled="disabled"
        :max="max"
        :maxlength="maxlength"
        :min="min"
        :name="name"
        :pattern="pattern"
        :placeholder="placeholder"
        :readonly="readonly"
        :required="required"
        :size="size"
        :step="step"
        :type="type"
        :value="modelValue"
        @blur="emit('blur', $event)"
        @change="emit('change', $event)"
        @focus="emit('focus', $event)"
        @input="updateValue"
        @keydown="$emit('keydown', $event)"
        @keyup="$emit('keyup', $event)"
      />
    </template>
    <template v-if="$slots['append-icon']" #append-icon>
      <slot name="append-icon" />
    </template>
  </z-field>
</template>
