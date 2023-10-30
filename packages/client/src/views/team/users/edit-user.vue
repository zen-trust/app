<script lang="ts" setup>
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  id: string
}>()

const userStore = useUserStore()
const user = userStore.findById(props.id)
</script>

<template>
  <span>edit user {{ user?.name }}</span>
</template>
