<script lang="ts" setup>
import { ref } from 'vue'
import type { Group, User } from '@zen-trust/server'
import { useGroupStore } from '@/stores/group'
import ZButton from '@/components/z-button.vue'
import { router } from '@/router'
import ZList from '@/components/list/z-list.vue'
import ZListItem from '@/components/list/z-list-item.vue'
import UserAvatar from '@/components/user/user-avatar.vue'
import { urnToId } from '@/lib/utils'
import AddMembersModal from '@/components/groups/add-members-modal.vue'
import { type AutocompleteOption } from '@/components/fields/z-autocomplete-field.vue'

const props = defineProps<{
  id: string
}>()
const groupStore = useGroupStore()
const group = groupStore.findById(props.id)

const loading = ref(false)
const addMembersDialogOpen = ref(false)
const editLink = {
  name: 'team.groups.edit',
  params: {
    id: props.id,
  },
}

async function deleteGroup() {
  loading.value = true
  try {
    await groupStore.deleteGroup(props.id)
  } finally {
    loading.value = false
  }

  return router.push({ name: 'team.groups' })
}

function memberRoute(member: User | Group) {
  return {
    name: member.type === 'user' ? 'team.users.single' : 'team.groups.single',
    params: {
      id: urnToId(member.id),
    },
  }
}

function showAddMembersModal() {
  addMembersDialogOpen.value = true
}
</script>

<template>
  <article class="flex flex-col space-y-2">
    <header class="flex items-start justify-between">
      <div>
        <h3 class="text-xl font-medium" v-text="group?.name" />

        <span v-if="group && !group?.system" class="text-xs text-gray-500 py-3 mr-4 ml-auto">
          <span>Last updated&nbsp;</span>
          <timeago :datetime="group?.updatedAt" />
        </span>
      </div>

      <div v-if="!group?.system" class="flex items-center space-x-2">
        <z-button :disabled="loading" :to="editLink" inset>
          <span>Edit</span>
        </z-button>

        <z-button :disabled="loading" inset @click="deleteGroup">
          <span>Delete</span>
        </z-button>
      </div>
    </header>

    <section id="description">
      <p
        v-if="group?.description"
        class="text-gray-900 dark:text-gray-400"
        v-text="group?.description"
      />
      <span v-else class="text-gray-400 text-sm">No description available</span>
    </section>

    <section id="tags">
      <ul class="flex items-center space-x-1 mt-2 mb-8">
        <li
          v-for="tag in group?.tags"
          :key="tag"
          class="block px-2 text-gray-700 dark:text-gray-400 bg-gray-500/25 rounded shadow-sm"
        >
          <span v-text="tag" />
        </li>
      </ul>
    </section>

    <section
      id="members"
      class="p-6 pb-2 rounded-2xl border-2 border-gray-100 dark:border-gray-800"
    >
      <header class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-medium">Members</h3>

        <z-button @click="showAddMembersModal">Add members</z-button>
      </header>

      <z-list>
        <z-list-item
          v-for="member in group?.members"
          :key="member.id"
          :subtitle="'email' in member ? member.email : undefined"
          :title="member.name"
          :to="memberRoute(member)"
        >
          <template #avatar>
            <user-avatar v-if="member.type === 'user'" :user="member" />
          </template>
        </z-list-item>
      </z-list>

      <footer class="mt-4 text-xs text-gray-500 py-2 border-t border-gray-100 dark:border-gray-800">
        <span>Total:&nbsp;</span>
        <code>{{ group?.members.length }}</code>
      </footer>
    </section>

    <add-members-modal v-if="group" v-model="addMembersDialogOpen" :group="group" />
  </article>
</template>
