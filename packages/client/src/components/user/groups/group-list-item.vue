<script lang="ts" setup>
import { Group } from '@zen-trust/server'
import { ref } from 'vue'
import {truncate, urnToId} from '@/lib/utils'
import IconAvatar from '@/components/avatar/icon-avatar.vue'
import ZListItem from '@/components/list/z-list-item.vue'
import ZConfirmation from '@/components/z-confirmation.vue'

defineProps<{
  group: Group
}>()
const emit = defineEmits<{
  remove: []
}>()

const deleteConfirmationOpen = ref(false)

function handleAction(action: string) {
  if (action === 'remove') {
    deleteConfirmationOpen.value = true
  }
}

function removeGroup() {
  emit('remove')
}
</script>

<template>
  <z-list-item
    :actions="{ remove: 'Remove' }"
    :title="group.name"
    :subtitle="truncate(group.description, 15)"
    :to="{ name: 'team.groups.single', params: { id: urnToId(group.id) } }"
    @action="handleAction"
  >
    <template #avatar>
      <icon-avatar
        class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200 dark:group-hover:bg-gray-700"
        icon-class="text-lg"
        name="groups"
      />
    </template>

    <template #append>
      <z-confirmation
        v-model="deleteConfirmationOpen"
        subtitle="Are you sure you want to remove this user from the group?"
        title="Delete group"
        @confirm="removeGroup"
      />
    </template>
  </z-list-item>
</template>
