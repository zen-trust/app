<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { Group, User } from '@zen-trust/server'
import ZButton from '@/components/z-button.vue'
import UserGroupList from '@/components/user/groups/group-list.vue'
import AddGroupsModal from '@/components/user/add-groups-modal.vue'

const props = defineProps<{
  loading?: boolean
  user: User
}>()
const emit = defineEmits<{
  remove: [Group]
}>()
const addModalOpen = ref(false)
const groups = computed<Group[]>(() => props.user.groups ?? [])

function showAddModal() {
  addModalOpen.value = true
}

function removeGroup(group: Group) {
  emit('remove', group)
}
</script>

<template>
  <section class="p-6 pb-2">
    <header class="flex items-start justify-between mb-2">
      <h3 class="text-lg font-medium">Groups</h3>

      <z-button subtle :disabled="loading" @click="showAddModal">Add groups</z-button>
    </header>

    <user-group-list :groups="groups" @remove="removeGroup" />
    <footer
      v-if="groups.length > 0"
      class="mt-4 text-xs text-gray-500 py-2 border-t border-gray-100 dark:border-gray-800"
    >
      <span>Total:&nbsp;</span>
      <code>{{ groups.length }}</code>
    </footer>
    <add-groups-modal v-model="addModalOpen" :user="user" />
  </section>
</template>
