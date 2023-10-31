<script lang="ts" setup>
import { computed, ref, toRef } from 'vue'
import type { Group, User } from '@zen-trust/server'
import ZButton from '@/components/z-button.vue'
import UserGroupList from '@/components/user/groups/group-list.vue'
import AddGroupsModal from '@/components/user/add-groups-modal.vue'
import ZPopout from '@/components/z-popout.vue'

const props = defineProps<{
  loading?: boolean
  user: User
}>()
const emit = defineEmits<{
  remove: [Group]
}>()
const addModalOpen = ref(false)
const user = toRef(props, 'user')
const groups = computed<Group[]>(() => user.value.groups ?? [])

function showAddModal() {
  addModalOpen.value = true
}

function removeGroup(group: Group) {
  emit('remove', group)
}
</script>

<template>
  <z-popout title="Groups">
    <template #actions>
      <z-button :disabled="loading" subtle @click="showAddModal">Add groups</z-button>
    </template>

    <user-group-list :groups="groups" @remove="removeGroup" />
    <footer
      v-if="groups.length > 0"
      class="mt-4 text-xs text-gray-500 py-2 border-t border-gray-100 dark:border-gray-800"
    >
      <span>Total:&nbsp;</span>
      <code>{{ groups.length }}</code>
    </footer>
    <add-groups-modal v-model="addModalOpen" :user="user" />
  </z-popout>
</template>
