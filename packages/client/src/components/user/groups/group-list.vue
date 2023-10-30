<script lang="ts" setup>
import { Group } from '@zen-trust/server'
import ZList from '@/components/list/z-list.vue'
import GroupListItem from '@/components/user/groups/group-list-item.vue'

defineProps<{
  groups: Group[]
}>()
const emit = defineEmits<{
  remove: [Group]
}>()

function removeGroup(group: Group) {
  emit('remove', group)
}
</script>

<template>
  <z-list v-if="groups.length > 0" class="mt-2">
    <group-list-item
      v-for="group in groups"
      :key="group.id"
      :group="group"
      @remove="removeGroup(group)"
    />
  </z-list>
  <span v-else class="text-gray-500 text-sm">This user is not part of any groups.</span>
</template>
