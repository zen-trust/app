<script lang="ts" setup>
import { ref } from 'vue'
import ZButton from '@/components/z-button.vue'
import ZTagField from '@/components/fields/z-tag-field.vue'
import ZMultilineField from '@/components/fields/z-multiline-field.vue'
import ZTextField from '@/components/fields/z-text-field.vue'
import { useGroupStore } from '@/stores/group'
import { router } from '@/router'

const props = defineProps<{
  id: string
}>()

const groupStore = useGroupStore()
const group = groupStore.findById(props.id)

const loading = ref(false)
const error = ref<string | undefined>()
const name = ref(group?.name ?? '')
const description = ref(group?.description ?? '')
const tags = ref<string[]>(group?.tags ?? [])

async function update() {
  loading.value = true

  try {
    await groupStore.updateGroup(props.id, {
      name: name.value,
      description: description.value,
      tags: tags.value,
    })

    return router.push({
      name: 'team.groups',
    })
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <header class="flex items-start justify-between">
    <div>
      <h3 class="text-lg font-medium">Update group {{ group?.name }}</h3>
    </div>
  </header>

  <section class="mt-4">
    <form class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <z-text-field
        v-model="name"
        :disabled="loading"
        class="md:col-span-1 xl:col-span-2"
        label="Name"
        name="name"
        placeholder="Group Name"
        required
      />
      <div class="mb-4 md:mb-0 md:mt-5 text-sm text-gray-500">
        <p>
          The group name is used to identify the group in the system. It is also used as the group's
          email address.
        </p>
      </div>

      <z-multiline-field
        v-model="description"
        :disabled="loading"
        class="md:col-span-1 xl:col-span-2"
        label="Description"
        name="description"
        placeholder="Group description for humans"
      />
      <div class="mb-4 md:mb-0 md:mt-5 text-sm text-gray-500">
        <p>
          The group name is used to identify the group in the system. It is also used as the group's
          email address.
        </p>
      </div>

      <z-tag-field
        v-model="tags"
        :disabled="loading"
        class="md:col-span-1 xl:col-span-2"
        name="Tags"
      />
      <div class="mb-4 md:mb-0 md:mt-5 text-sm text-gray-500">
        <p>
          The group name is used to identify the group in the system. It is also used as the group's
          email address.
        </p>
      </div>

      <div class="mt-4 flex items-center space-x-2">
        <z-button :disabled="loading" @click="update">Update</z-button>

        <z-button :disabled="loading" :to="{ name: 'team.groups' }" inset>
          <span>Cancel</span>
        </z-button>

        <span v-if="error" class="ml-auto pl-2 whitespace-nowrap text-red-500 text-sm">
          Error updating group: {{ error }}
        </span>
      </div>
    </form>
  </section>
</template>
