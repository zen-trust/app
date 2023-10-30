<script lang="ts" setup>
import type { User } from '@zen-trust/server'
import { computed, ref } from 'vue'
import UserAvatar from '@/components/user/user-avatar.vue'
import { router } from '@/router'
import { urnToId } from '@/lib/utils'
import ZConfirmation from '@/components/z-confirmation.vue'
import { useProfileStore } from '@/stores/profile'
import ZListItem from '@/components/list/z-list-item.vue'

const props = withDefaults(
  defineProps<{
    user: User
    editable?: boolean
    deletable?: boolean
  }>(),
  { showable: true, editable: false, deletable: false },
)
const emit = defineEmits<{
  delete: []
}>()

const profileStore = useProfileStore()
const deletionConfirmationOpen = ref(false)
const isCurrentUser = computed(() => profileStore.profile?.id === props.user.id)
const username = computed(() => props.user.name + (isCurrentUser.value ? ' (You)' : ''))

const showRoute = {
  name: 'team.users.single',
  params: {
    id: urnToId(props.user.id),
  },
}
const actions = computed(() => ({
  edit: props.editable ? 'Edit' : undefined,
  delete: props.deletable && !isCurrentUser.value ? 'Delete' : undefined,
}))

function action(name: string) {
  switch (name) {
    case 'edit':
      if (isCurrentUser.value) {
        return router.push({ name: 'user.profile' })
      }

      return router.push({
        name: 'team.users.edit',
        params: {
          id: urnToId(props.user.id),
        },
      })

    case 'delete':
      return (deletionConfirmationOpen.value = true)
  }
}

function deleteUser() {
  emit('delete')
}
</script>

<template>
  <z-list-item
    :actions="actions"
    :subtitle="user.email"
    :title="username"
    :to="showRoute"
    @action="action"
  >
    <template #avatar>
      <user-avatar :user="user" />
    </template>

    <template #append>
      <z-confirmation
        v-model="deletionConfirmationOpen"
        :subtitle="`Are you sure you want to delete the user account of ${user.name}?`"
        title="Delete User"
        @confirm="deleteUser"
      />
    </template>
  </z-list-item>
</template>
