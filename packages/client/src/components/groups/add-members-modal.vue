<script lang="ts" setup>
import type { Group, User } from '@zen-trust/server'
import { computed, ref, watch } from 'vue'
import { debouncedWatch, watchArray } from '@vueuse/core'
import ZListItem from '@/components/list/z-list-item.vue'
import ZIcon from '@/components/z-icon.vue'
import UserAvatar from '@/components/user/user-avatar.vue'
import ZButton from '@/components/z-button.vue'
import ZModal from '@/components/z-modal.vue'
import ZList from '@/components/list/z-list.vue'
import { useGroupStore } from '@/stores/group'
import type { AutocompleteOption } from '@/components/fields/z-autocomplete-field.vue'
import ZAutocompleteField from '@/components/fields/z-autocomplete-field.vue'

const props = defineProps<{
  group: Group
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

type Member = User | Group

const groupStore = useGroupStore()
const loading = ref(false)
const query = ref('')
const matchedMembers = ref<Member[]>([])
const suggestions = computed<AutocompleteOption<'label'>[]>(() =>
  matchedMembers.value.map(({ id, name: label }) => ({ id, label })),
)
const selected = ref<AutocompleteOption<'label'>[]>([])
const pendingMembers = ref<Member[]>([])

// If the search query changes, but the results include members that are
// already pending, we want to add them to the selected list, so they are
// shown in the dropdown as selected, too.
watch(suggestions, (suggestions) =>
  suggestions.forEach(
    (suggestion) => memberIsPending(suggestion) && selected.value.push(suggestion),
  ),
)

// If the selected items of the autocomplete change, we'll sync the pending
// members list with the selected items.
watchArray(selected, (_items, _previous, added, removed) => {
  for (const item of added) {
    if (memberIsPending(item)) {
      continue
    }

    const member = resolveMemberForSuggestion(item)
    pendingMembers.value.push(member)
  }

  for (const item of removed) {
    if (!memberIsPending(item)) {
      continue
    }

    removePendingMember(item)
  }
})

// If the query changes, we'll search for members that match the query.
debouncedWatch(query, async (query) => search(query), {
  debounce: 500,
})

async function search(query: string) {
  if (query.length < 2) {
    return
  }

  loading.value = true

  try {
    matchedMembers.value = await groupStore.suggestMembers(props.group, query)
  } finally {
    loading.value = false
  }
}

function removePendingMember(member: Pick<Member, 'id'>) {
  selected.value = selected.value.filter(({ id }) => id !== member.id)
  pendingMembers.value = pendingMembers.value.filter(({ id }) => id !== member.id)
}

function memberIsPending(member: Pick<Member, 'id'>): boolean {
  return Boolean(pendingMembers.value.find(({ id }) => id === member.id))
}

function resolveMemberForSuggestion(suggestion: AutocompleteOption<'label'>): Member {
  return matchedMembers.value.find(({ id }) => id === suggestion.id) as Member
}

async function addMembers() {
  loading.value = true

  try {
    await groupStore.addMembers(props.group, pendingMembers.value)
    await groupStore.fetchGroup(props.group.id)
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
    subtitle="Add users or groups to this group."
    title="Add members"
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
      name="search-members"
      placeholder="Search for users and groups"
    >
      <template #no-results>
        <span v-if="loading">Loading...</span>
        <span v-else>No results found.</span>
      </template>

      <template #item="{ item, active, selected, display }">
        <div class="flex w-full items-center justify-between">
          <span
            :class="{ 'font-medium': selected, 'font-normal': !selected }"
            class="block truncate"
            v-text="display(item)"
          />

          <span
            :class="{ 'text-gray-500': !active, 'text-gray-200': active }"
            v-text="item.type === 'group' ? 'Group' : 'User'"
          />
        </div>
      </template>
    </z-autocomplete-field>

    <z-list class="mt-4" compact>
      <z-list-item
        v-for="member in pendingMembers"
        :key="member.id"
        :subtitle="'email' in member ? member.email : undefined"
        :title="member.name"
      >
        <template #avatar>
          <user-avatar v-if="member.type === 'user'" :user="member" />
          <div
            v-else
            class="flex justify-center items-center rounded-full bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-200 h-8 w-8"
          >
            <z-icon class="text-lg" name="groups" />
          </div>
        </template>

        <template #actions>
          <button class="p-2" @click="removePendingMember(member)">
            <z-icon
              class="text-gray-500 hover:text-gray-700 dark:text-gray-200 dark:hover:text-gray-100 transition"
              name="close"
            />
          </button>
        </template>
      </z-list-item>
    </z-list>

    <template #actions>
      <z-button @click="addMembers">Confirm</z-button>
      <z-button inset @click="close">Cancel</z-button>
    </template>
  </z-modal>
</template>
