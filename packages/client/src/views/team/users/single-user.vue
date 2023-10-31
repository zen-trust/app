<script lang="ts" setup>
import type { Group, User } from '@zen-trust/server'
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import UserGroups from '@/components/user/groups/user-groups.vue'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  id: string
}>()

const userStore = useUserStore()
const loading = ref(false)
const { users } = storeToRefs(userStore)
const user = computed<User>(() => users.value.find(({ id }) => id === props.id) as User)

async function removeGroup(group: Group) {
  loading.value = true

  try {
    await userStore.removeGroup(user.value, group)
    await userStore.fetchUser(user.value.id)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <article>
    <header>
      <h3 class="text-xl font-medium">{{ user.name }}</h3>
      <p class="text-gray-500 text-sm">{{ user.email }}</p>
    </header>

    <user-groups
      id="groups"
      :loading="loading"
      :user="user"
      class="mt-4"
      @remove="removeGroup"
    />
  </article>
</template>
