<script lang="ts" setup>
import { ref, toRef } from 'vue'
import { syncRef, useTextareaAutosize } from '@vueuse/core'
import ZField from '@/components/fields/z-field.vue'

const { textarea, input: proxyValue } = useTextareaAutosize()

const props = withDefaults(
  defineProps<{
    autocapitalize?: string
    autocomplete?: string
    autofocus?: boolean
    disabled?: boolean
    id?: string
    label?: string
    maxlength?: number
    modelValue?: string
    name: string
    placeholder?: string
    readonly?: boolean
    required?: boolean
  }>(),
  {
    autocapitalize: 'none',
    autocomplete: 'off',
    autofocus: false,
    disabled: false,
    readonly: false,
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

syncRef(toRef(props, 'modelValue'), proxyValue, {
  immediate: true,
  direction: 'ltr',
})

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  const value = target.value

  proxyValue.value = value
  emit('update:modelValue', value)
}

const input = ref<HTMLInputElement | null>(null)
</script>

<template>
  <z-field v-slot="{ inputId, classes }" :label="label" :name="name" :required="required">
    <textarea
      :id="inputId"
      ref="textarea"
      :autocapitalize="autocapitalize"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      :class="classes"
      :disabled="disabled"
      :maxlength="maxlength"
      :name="name"
      :placeholder="placeholder"
      :readonly="readonly"
      :value="modelValue"
      class="py-2 min-h-[4rem] resize-none"
      @input="updateValue"
    />
  </z-field>
</template>
