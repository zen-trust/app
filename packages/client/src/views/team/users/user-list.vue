<script lang="ts" setup>
import type { Invitation, User } from '@zen-trust/server'
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import UserListComponent from '@/components/user/user-list.vue'
import InvitationList from '@/components/user/invitations/invitation-list.vue'

const teamStore = useUserStore()
const loading = ref(false)

async function deleteUser(user: User) {
  loading.value = true

  try {
    await teamStore.deleteUser(user)
  } finally {
    loading.value = false
  }
}

async function revokeInvitation(invitation: Invitation) {
  loading.value = true

  try {
    await teamStore.revokeInvitation(invitation)
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

  <section class="mt-4">
    <header class="mb-2">
      <h3 class="text-lg font-medium">Pending Invitations</h3>
    </header>

    <invitation-list @revoke="revokeInvitation" />
  </section>

  <section class="mt-4">
    <header class="mb-2">
      <h3 class="text-lg font-medium">Members</h3>
    </header>
    <user-list-component
      :showable="false"
      :users="teamStore.users"
      deletable
      editable
      @delete="deleteUser"
    />
    <footer class="mt-4 text-xs text-gray-500 py-2 border-t border-gray-100 dark:border-gray-800">
      <span>Total:&nbsp;</span>
      <code>{{ teamStore.users.length }}</code>
    </footer>
  </section>
</template>
