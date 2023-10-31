<script lang="ts" setup>
import type { Invitation } from '@zen-trust/server'
import InvitationListItem from '@/components/user/invitations/invitation-list-item.vue'
import ZList from '@/components/list/z-list.vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import ZPopout from '@/components/z-popout.vue'

const emit = defineEmits<{
  revoke: [Invitation]
}>()
const { invitations } = storeToRefs(useUserStore())

async function revokeInvitation(invitation: Invitation) {
  emit('revoke', invitation)
}
</script>

<template>
  <z-popout title="Pending Invitations">
    <z-list v-if="invitations.length > 0">
      <invitation-list-item
        v-for="invitation in invitations"
        :key="invitation.id"
        :invitation="invitation"
        @revoke="revokeInvitation(invitation)"
      />
    </z-list>
    <span v-else class="text-gray-500 text-sm">There are no pending invitations.</span>
  </z-popout>
</template>
