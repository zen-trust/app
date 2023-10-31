<script lang="ts" setup>
import type { Invitation, User } from '@zen-trust/server'
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import UserListComponent from '@/components/user/user-list.vue'
import { storeToRefs } from 'pinia'
import ZIcon from '@/components/z-icon.vue'
import Icon from '@/components/z-icon.vue'
import ZTextField from '@/components/fields/z-text-field.vue'
import ZButton from '@/components/z-button.vue'
import { router } from '@/router'
import PendingInvitations from '@/components/user/invitations/pending-invitations.vue'

const props = defineProps<{
  query?: string
}>()
const userStore = useUserStore()
const { users, lastUpdated } = storeToRefs(userStore)
const currentQuery = computed(() => props.query)
const searchTerm = ref(props.query ?? '')
const loading = ref(false)

function search() {
  router.push({ query: { query: searchTerm.value } })
}

watch(currentQuery, () => loadUsers())

async function loadUsers() {
  loading.value = true

  try {
    if (currentQuery.value) {
      await userStore.search(currentQuery.value)
    } else {
      await userStore.fetchUsers()
    }
  } finally {
    loading.value = false
  }
}

async function revokeInvitation(invitation: Invitation) {
  loading.value = true

  try {
    await userStore.revokeInvitation(invitation)
  } finally {
    loading.value = false
  }
}

async function deleteUser(user: User) {
  loading.value = true

  try {
    await userStore.deleteUser(user)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <header>
    <h3 class="text-xl font-medium">Users</h3>
    <p class="text-gray-500 text-sm">
      Users are the people that are part of your team. You can add them to groups to assign access
      permissions.
    </p>
  </header>

  <pending-invitations class="mt-4" @revoke="revokeInvitation" />

  <section class="mt-4">
    <header class="mb-2">
      <h3 class="text-lg font-medium">Members</h3>

      <div id="toolbar" class="flex justify-between items-end mt-4">
        <z-text-field
          v-model="searchTerm"
          class="grow max-w-md"
          label=""
          name="search"
          placeholder="Search"
          small
          type="search"
          @keyup.enter="search"
        >
          <template #prepend-icon>
            <icon name="search" />
          </template>
        </z-text-field>

        <z-button :to="{ name: 'team.invite' }" inset>
          <span>Invite users</span>
        </z-button>
      </div>
    </header>

    <user-list-component :showable="false" :users="users" deletable editable @delete="deleteUser" />
    <footer
      class="mt-4 text-xs text-gray-500 flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800"
    >
      <div>
        <span>Total:&nbsp;</span>
        <code>{{ users.length }}</code>
      </div>

      <div
        :class="{ 'pointer-events-none': loading }"
        class="flex items-center group cursor-pointer"
        @click="loadUsers"
      >
        <z-icon
          :class="{ 'animate-spin': loading }"
          class="mr-1 hover:no-underline text-xs"
          name="refresh"
        />
        <span v-if="loading">Loading...</span>
        <span v-else class="group-hover:underline">
          <span>Last updated:&nbsp;</span>
          <timeago :datetime="lastUpdated" :title="lastUpdated.toISOString()" />
        </span>
      </div>
    </footer>
  </section>
</template>
