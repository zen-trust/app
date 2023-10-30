<script lang="ts" setup>
import { computed, ref } from 'vue'
import ZButton from '@/components/z-button.vue'
import ZTextField from '@/components/fields/z-text-field.vue'
import ZTagField from '@/components/fields/z-tag-field.vue'
import { useGroupStore } from '@/stores/group'
import { useUserStore } from '@/stores/user'
import { router } from '@/router'

const teamStore = useUserStore()
const groupStore = useGroupStore()
const availableGroups = computed(() =>
  groupStore.groups
    .filter((group) => !group.system)
    .filter((group) => !groups.value.some((g) => g.value === group.id))
    .map((group) => ({
      text: group.name,
      value: group.id,
    })),
)

const email = ref('')
const groups = ref<{ text: string; value: string }[]>([])

async function createInvitation(event: Event) {
  event.preventDefault()

  await teamStore.createInvitation(
    email.value,
    groups.value.map(({ value }) => value),
  )
  return router.push({ name: 'team.users' })
}
</script>

<template>
  <form class="max-w-md" @submit="createInvitation">
    <z-text-field
      v-model="email"
      label="Email"
      name="email"
      placeholder="jane.doe@example.com"
      required
      type="email"
    />

    <z-tag-field
      v-model="groups"
      :allow-custom-values="false"
      :items="availableGroups"
      :show-autocomplete-immediately="true"
      class="mt-2"
      label="Groups"
      name="groups"
      placeholder="Add groups"
    />

    <z-button class="mt-8" submit>
      <span>Send Invitation</span>
    </z-button>
  </form>
</template>
