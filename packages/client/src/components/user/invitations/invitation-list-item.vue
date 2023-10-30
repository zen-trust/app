<script lang="ts" setup>
import type { Invitation } from '@zen-trust/server'
import { ref } from 'vue'
import IconAvatar from '@/components/avatar/icon-avatar.vue'
import ZListItem from '@/components/list/z-list-item.vue'
import ZConfirmation from '@/components/z-confirmation.vue'

defineProps<{
  invitation: Invitation
}>()
const emit = defineEmits<{
  revoke: []
}>()

const revokationDialogOpen = ref(false)

function revokeInvitation() {
  emit('revoke')
}

function handleAction(action: string) {
  switch (action) {
    case 'delete':
      revokationDialogOpen.value = true
  }
}
</script>

<template>
  <z-list-item :actions="{ delete: 'Revoke' }" :title="invitation.email" @action="handleAction">
    <template #avatar>
      <icon-avatar
        class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200"
        icon-class="text-lg"
        name="email"
      />
    </template>

    <template #append>
      <z-confirmation
        v-model="revokationDialogOpen"
        :subtitle="`Are you sure you want to revoke the invitation for ${invitation.email}?`"
        title="Revoke invitation"
        @confirm="revokeInvitation"
      />
    </template>
  </z-list-item>
</template>
