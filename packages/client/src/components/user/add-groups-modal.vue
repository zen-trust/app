<script lang="ts" setup>
import type { Group, User } from '@zen-trust/server'
import { computed, ref, watch } from 'vue'
import { debouncedWatch, watchArray } from '@vueuse/core'
import ZAutocompleteField, {
  type AutocompleteOption,
} from '@/components/fields/z-autocomplete-field.vue'
import { useUserStore } from '@/stores/user'
import ZIcon from '@/components/z-icon.vue'
import ZList from '@/components/list/z-list.vue'
import ZListItem from '@/components/list/z-list-item.vue'
import ZModal from '@/components/z-modal.vue'
import ZButton from '@/components/z-button.vue'
import IconAvatar from '@/components/avatar/icon-avatar.vue'

const props = defineProps<{
  user: User
  modelValue: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const userStore = useUserStore()
const loading = ref(false)
const query = ref<string>('')
const matchedGroups = ref<Group[]>([])
const suggestions = computed<AutocompleteOption<'label'>[]>(() =>
  matchedGroups.value.map(({ id, name: label }) => ({ id, label })),
)
const selected = ref<AutocompleteOption<'label'>[]>([])
const pendingGroups = ref<Group[]>([])

watch(suggestions, (suggestions) =>
  suggestions.forEach(
    (suggestion) => groupIsPending(suggestion) && selected.value.push(suggestion),
  ),
)

watchArray(selected, (_items, _previous, added, removed) => {
  for (const item of added) {
    if (groupIsPending(item)) {
      continue
    }

    const group = resolveGroupForSuggestion(item)
    pendingGroups.value.push(group)
  }

  for (const item of removed) {
    if (!groupIsPending(item)) {
      continue
    }

    removePendingGroup(item)
  }
})

debouncedWatch(query, async (query) => search(query), {
  debounce: 500,
})

async function search(query: string) {
  if (query.length < 2) {
    return
  }

  loading.value = true

  try {
    matchedGroups.value = await userStore.suggestGroups(props.user, query)
    suggestions.value.forEach((suggestion) => {
      if (groupIsPending(suggestion)) {
        selected.value.push(suggestion)
      }
    })
  } finally {
    loading.value = false
  }
}

function removePendingGroup(group: Pick<Group, 'id'>) {
  selected.value = selected.value.filter(({ id }) => id !== group.id)
  pendingGroups.value = pendingGroups.value.filter(({ id }) => id !== group.id)
}

function groupIsPending(group: Pick<Group, 'id'>): boolean {
  return Boolean(pendingGroups.value.find(({ id }) => id === group.id))
}

function resolveGroupForSuggestion(suggestion: AutocompleteOption<'label'>): Group {
  return matchedGroups.value.find(({ id }) => id === suggestion.id) as Group
}

async function addGroups() {
  loading.value = true

  try {
    await userStore.addGroups(props.user, pendingGroups.value)
    await userStore.fetchUser(props.user.id)
    close()
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <z-modal
    :model-value="modelValue"
    subtitle="Add the user to additional groups."
    title="Add to groups"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <z-autocomplete-field
      v-model="selected"
      v-model:query="query"
      :items="suggestions"
      :loading="loading"
      item-label="label"
      label=""
      multiple
      name="search-groups"
      placeholder="Search for groups"
    >
      <template #no-results>
        <span v-if="loading">Loading...</span>
        <span v-else>No results found.</span>
      </template>
    </z-autocomplete-field>

    <z-list class="mt-4" compact>
      <z-list-item v-for="group in pendingGroups" :key="group.id" :title="group.name">
        <template #avatar>
          <icon-avatar
            class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200"
            icon-class="text-lg"
            name="groups"
          />
        </template>

        <template #actions>
          <button class="p-2" @click="removePendingGroup(group)">
            <z-icon
              class="text-gray-500 hover:text-gray-700 dark:text-gray-200 dark:hover:text-gray-100 transition"
              name="close"
            />
          </button>
        </template>
      </z-list-item>
    </z-list>

    <template #actions>
      <z-button @click="addGroups">Confirm</z-button>
      <z-button inset @click="close">Cancel</z-button>
    </template>
  </z-modal>
</template>
