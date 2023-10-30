<script lang="ts" setup>
import type { Invitation } from '@zen-trust/server'
import ZList from '@/components/list/z-list.vue'
import { useUserStore } from '@/stores/user'
import InvitationListItem from '@/components/user/invitations/invitation-list-item.vue'

const emit = defineEmits<{
  revoke: [Invitation]
}>()

const userStore = useUserStore()

function revokeInvitation(invitation: Invitation) {
  emit('revoke', invitation)
}
</script>

<template>
  <z-list v-if="userStore.invitations.length > 0">
    <invitation-list-item
      v-for="invitation in userStore.invitations"
      :key="invitation.id"
      :invitation="invitation"
      @revoke="revokeInvitation(invitation)"
    />
  </z-list>
  <span v-else class="text-gray-500 text-sm">There are no pending invitations.</span>
</template>
