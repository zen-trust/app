<script lang="ts" setup>
import type { User } from '@zen-trust/server'
import UserListItem from '@/components/user/user-list-item.vue'
import ZList from '@/components/list/z-list.vue'

withDefaults(
  defineProps<{
    users: User[]
    editable?: boolean
    deletable?: boolean
  }>(),
  {
    editable: false,
    deletable: false,
  },
)

const emit = defineEmits<{
  delete: [User]
}>()

function deleteUser(user: User) {
  emit('delete', user)
}
</script>

<template>
  <z-list>
    <user-list-item
      v-for="user in users"
      :key="user.id"
      :deletable="deletable"
      :editable="editable"
      :user="user"
      @delete="deleteUser(user)"
    />
  </z-list>
</template>
