<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ZButton from '@/components/z-button.vue'
import Icon from '@/components/z-icon.vue'
import UserAvatar from '@/components/user/user-avatar.vue'
import { useProfileStore } from '@/stores/profile'
import ZTextField from "@/components/fields/z-text-field.vue";

const userStore = useProfileStore()
const user = computed(() => userStore.profile)
const loading = ref(false)
const editing = ref(false)
const newName = ref(userStore.profile?.name)
const currentName = computed(() => userStore.profile?.name)
const userId = computed(() => userStore.profile?.id)
const userNameField = ref<typeof ZButton | null>(null)

watch(user, (user) => {
  if (!editing.value && user) {
    newName.value = userStore.profile?.name
  }
})

onMounted(() => {
  newName.value = userStore.profile?.name
})

watch(editing, (editing) => {
  if (editing) {
    nextTick(() => userNameField.value?.$refs.input.focus())
  }
})

function updateUserName() {
  try {
    if (newName.value && newName.value?.length > 0) {
      userStore.updateName(newName.value)
    }
  } catch (error) {
    console.error(error)
  } finally {
    editing.value = false
  }
}
</script>

<template>
  <div v-if="user" class="flex items-center">
    <user-avatar :user="user" class="mr-4" :size="8" />
    <div>
      <div class="flex items-center h-14">
        <h2 class="text-3xl">
          <z-text-field
            v-if="editing"
            ref="userNameField"
            v-model="newName"
            :disabled="loading"
            :placeholder="currentName"
            autofocus
            label=""
            name="name"
            @keyup.enter="updateUserName"
            @keyup.esc="editing = false"
          />
          <span v-else class="block py-3">{{ currentName }}</span>
        </h2>
        <z-button v-if="editing" class="ml-4 h-full" inset large @click="updateUserName">
          <span>Save</span>
        </z-button>
        <button
          v-else
          class="ml-2 leading-none opacity-25 hover:opacity-100 focus:opacity-100 transition"
          @click="editing = true"
        >
          <Icon name="edit" />
        </button>
      </div>
      <div class="flex items-center">
        <code>#</code>
        <code>{{ userId }}</code>
      </div>
    </div>
  </div>
</template>
