<script lang="ts" setup>
import type { Invitation } from '@zen-trust/server'
import { computed, ref } from 'vue'
import IconAvatar from '@/components/avatar/icon-avatar.vue'
import ZListItem from '@/components/list/z-list-item.vue'
import ZConfirmation from '@/components/z-confirmation.vue'

const props = defineProps<{
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
      break

    case 'resend':
      console.log('TODO: Resend invitation')
  }
}

const expiration = computed(() => new Date(props.invitation.expiresAt))
const expired = computed(() => expiration.value < new Date())
</script>

<template>
  <z-list-item
    :actions="{ delete: 'Revoke', resend: 'Resend' }"
    :title="invitation.email"
    @action="handleAction"
  >
    <template #avatar>
      <icon-avatar
        class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200"
        icon-class="text-lg"
        name="email"
      />
    </template>

    <template #subtitle>
      <span>Sent&nbsp;</span>
      <timeago :datetime="invitation.createdAt" />
      <span>&nbsp;·&nbsp;</span>
      <span v-if="expired">
        <span>Invitation has expired.</span>
        <span class="ml-1 underline underline-offset-1 cursor-pointer hover:text-black dark:hover:text-white transition" @click.stop="handleAction('resend')"
          >Send another</span
        >
      </span>
      <span v-else>
        <span>Expires&nbsp;</span>
        <timeago :datetime="invitation.expiresAt" />
      </span>
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
