<script
  generic="T extends AutocompleteOption<K>, K extends string, M extends boolean"
  lang="ts"
  setup
>
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  TransitionRoot,
} from '@headlessui/vue'
import ZField from '@/components/fields/z-field.vue'
import ZIcon from '@/components/z-icon.vue'

export type AutocompleteOption<K extends string> = { [key: string]: string } & {
  [V in K]: string
} & { id: string }

const props = withDefaults(
  defineProps<{
    autocapitalize?: string
    autocomplete?: string
    autofocus?: boolean
    disabled?: boolean
    hint?: string
    id?: string
    itemLabel?: K
    items: T[]
    label?: string
    loading?: boolean
    max?: number
    maxlength?: number
    min?: number
    modelValue: M extends true ? T[] : T | undefined
    multiple?: M
    name: string
    nullable?: boolean
    pattern?: string
    placeholder?: string
    query: string
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
    nullable: false,
    readonly: false,
    required: false,
    type: 'text',
  },
)
const defaultLabelProperty = 'label' as K
const emit = defineEmits<{
  'update:modelValue': [T]
  'update:query': [string]
}>()

function updateQueryFromEvent(event: Event) {
  updateQuery((event.target as HTMLInputElement)?.value ?? '')
}

function updateQuery(value: string) {
  emit('update:query', value)
}

function updateValue(event: T) {
  emit('update:modelValue', event)
}

function display(value: unknown): string {
  const item = value as T
  const key = props.itemLabel ?? defaultLabelProperty

  return item[key] ?? ''
}
</script>

<template>
  <combobox
    :disabled="disabled"
    :model-value="modelValue as object"
    :multiple="multiple as boolean"
    :name="name"
    :nullable="nullable"
    as="div"
    class="relative"
    @update:modelValue="updateValue"
  >
    <z-field
      :disabled="disabled"
      :label="label"
      :loading="loading"
      :name="name"
      :required="required"
    >
      <template v-slot="{ classes, inputId }">
        <combobox-input
          :id="inputId"
          ref="input"
          :autocapitalize="autocapitalize"
          :autocomplete="autocomplete"
          :autofocus="autofocus"
          :class="classes"
          :disabled="disabled"
          :display-value="display"
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
          @change="updateQueryFromEvent"
        />
      </template>

      <template v-if="$slots['prepend-icon']" #prepend-icon>
        <slot name="prepend-icon" />
      </template>

      <template #append-icon>
        <slot name="append-icon">
          <combobox-button
            :disabled="disabled"
            class="text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-300 transition -mr-1"
          >
            <z-icon name="unfold_more" />
          </combobox-button>
        </slot>
      </template>
    </z-field>

    <transition-root
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      @after-leave="updateQuery('')"
    >
      <combobox-options
        as="ul"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-black py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
      >
        <div
          v-if="items.length === 0 && query !== ''"
          class="relative cursor-default select-none py-2 px-3 text-gray-500"
        >
          <slot :query="query" name="no-results">
            <span>Nothing found.</span>
          </slot>
        </div>

        <combobox-option
          v-for="item in items"
          :key="item.id"
          v-slot="{ active, selected }"
          :value="item"
        >
          <li
            :class="{
              'bg-green-500 text-white': active,
              'bg-white dark:bg-black text-black dark:text-gray-200': !active,
              'pl-11': !selected,
              'pl-3': selected,
            }"
            class="flex items-center pr-3 py-2 select-none cursor-default transition"
          >
            <span v-show="selected" class="mr-2">
              <slot name="selected-icon">
                <z-icon name="check" />
              </slot>
            </span>
            <slot :active="active" :display="display" :item="item" :selected="selected" name="item">
              <span
                :class="{ 'font-medium': selected, 'font-normal': !selected }"
                class="block truncate"
                v-text="display(item)"
              />
            </slot>
          </li>
        </combobox-option>
      </combobox-options>
    </transition-root>
  </combobox>
</template>
