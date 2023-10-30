<script generic="T extends string | Tag" lang="ts" setup>
import {VueTagsInput} from '@vojtechlanka/vue-tags-input'
import {computed, ref, toRef, watch} from 'vue'
import ZField from '@/components/fields/z-field.vue'

export type Tag = Record<string, any> & { text: string }

interface TagData extends Tag {
  v?: any
}

const props = withDefaults(
    defineProps<{
      name: string
      modelValue?: T[]
      allowCustomValues?: boolean
      showAutocompleteImmediately?: boolean
      items?: T[]
      tag?: string
      label?: string
      required?: boolean
      disabled?: boolean
      placeholder?: string
    }>(),
    {
      placeholder: '',
      showAutocompleteImmediately: false,
      allowCustomValues: true,
    },
)

const emit = defineEmits<{
  'update:modelValue': [T[]]
  'update:tag': [string]
}>()

const localTag = ref(props.tag ?? '')
const tagRef = toRef(props, 'tag')
watch(tagRef, (newTag) => (localTag.value = newTag ?? ''))

const tags = computed(() => props.modelValue?.map((value): Tag => valueToTag(value)) ?? [])
const suggestions = computed(
    () =>
        props.items
            ?.map((value): Tag => valueToTag(value))
            ?.filter((item) => item.text.toLowerCase().includes(localTag.value.toLowerCase())) ?? [],
)

function updateTags(updatedTags: TagData[]) {
  const updatedValues = updatedTags.map((tag) => tagToValue(tag))

  if (
      updatedTags.length === tags.value.length &&
      updatedTags.every((value, index) => value.text === tags.value[index].text)
  ) {
    return
  }

  emit('update:modelValue', updatedValues)
}

function valueToTag(value: T): TagData {
  return typeof value === 'string'
      ? {text: value, v: value}
      : {
        ...value,
        v: value,
      }
}

function tagToValue(tag: TagData): T {
  return tag.v ?? tag.text
}

function updateTagInput(value: string) {
  localTag.value = value
  emit('update:tag', value)
}
</script>

<template>
  <z-field v-slot="{ inputId, classes }" :label="label" :name="name" :required="required">
    <vue-tags-input
      :id="inputId"
      :add-only-from-autocomplete="!allowCustomValues"
      :autocomplete-items="suggestions"
      :autocomplete-min-length="showAutocompleteImmediately ? 0 : 1"
      :class="classes"
      :disabled="disabled"
      :model-value="localTag"
      :placeholder="placeholder"
      :tags="tags"
      class="z-tag-input"
      is-draggable
      @update:modelValue="updateTagInput"
      @update:tags="updateTags"
    />
  </z-field>
</template>

<style lang="postcss" scoped>
.z-tag-input {
  @apply bg-inherit border-inherit max-w-none w-full rounded-r;
}

.z-tag-input :deep(.ti-input) {
  @apply bg-transparent border-none text-inherit p-0 h-full;
}

.z-tag-input :deep(.ti-new-tag-input-wrapper) {
  @apply first:pl-0 pl-2 m-0 p-0 text-base;
}

.z-tag-input :deep(.ti-new-tag-input) {
  @apply bg-transparent text-base shadow-none outline-none focus:ring-0 focus:outline-0;
}

.z-tag-input :deep(.ti-tag) {
  @apply py-0.5 my-1 pl-2 pr-1 bg-gray-400 dark:bg-gray-600 dark:text-gray-200 rounded-sm shadow cursor-default;
}

.z-tag-input :deep(.ti-tag-center) {
  @apply text-base;
}

.z-tag-input :deep(.ti-actions) {
  @apply ml-1;
}

.z-tag-input :deep(.ti-actions i) {
  @apply text-sm p-0.5 rounded-full text-gray-700 dark:text-gray-100 leading-none transition;
}

.z-tag-input :deep(.ti-autocomplete) {
  @apply mt-2 border-none w-[calc(100%_+_0.75rem_+_2px)] -ml-[calc(0.75rem_+_1px)] bg-inherit bg-white dark:bg-black overflow-hidden rounded-md shadow-lg ring-1 ring-gray-50 dark:ring-gray-900;
}

.z-tag-input :deep(.ti-autocomplete ul) {
  @apply divide-y divide-gray-50 dark:divide-gray-800 p-1;
}

.z-tag-input :deep(.ti-selected-item) {
  @apply bg-gray-50/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 transition;
}

.z-tag-input :deep(.ti-item) {
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 last:rounded-b first:rounded-t transition;
}
</style>
