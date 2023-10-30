<script lang="ts" setup>
import { type Group, type User } from '@zen-trust/server'
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import UserGroups from '@/components/user/groups/user-groups.vue'

const props = defineProps<{
  id: string
}>()

const userStore = useUserStore()
const loading = ref(false)
const user = userStore.findById(props.id) as User

async function removeGroup(group: Group) {
  loading.value = true

  try {
    await userStore.removeGroup(user, group)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <article>
    <header>
      <h3 class="text-xl font-medium">{{ user?.name }}</h3>
      <p class="text-gray-500 text-sm">{{ user?.email }}</p>
    </header>

    <user-groups
      id="groups"
      :user="user"
      class="mt-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800"
      @remove="removeGroup"
    />
  </article>
</template>
