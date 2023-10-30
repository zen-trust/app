<script lang="ts" setup>
import { ref } from 'vue'
import ZButton from '@/components/z-button.vue'
import ZTagField from '@/components/fields/z-tag-field.vue'
import ZMultilineField from '@/components/fields/z-multiline-field.vue'
import ZTextField from '@/components/fields/z-text-field.vue'
import { useGroupStore } from '@/stores/group'
import { router } from '@/router'

const groupStore = useGroupStore()
const loading = ref(false)
const error = ref<string | undefined>()
const name = ref('')
const description = ref('')
const tags = ref<string[]>([])

async function create() {
  loading.value = true

  try {
    await groupStore.createGroup({
      name: name.value,
      description: description.value,
      tags: tags.value,
    })

    return router.push({ name: 'team.groups' })
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
      <h3 class="text-lg font-medium">Add new group</h3>
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
          Description for this group. You can use it to help your team members understand what this
          group is for. The content is full-text searchable, too.
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
          Add tags to this group to help you organize your groups. In addition to the description,
          tags are also full-text searchable.
        </p>
      </div>

      <div class="mt-4 flex items-center space-x-2">
        <z-button :disabled="loading" @click="create">Create</z-button>

        <z-button :disabled="loading" :to="{ name: 'team.groups' }" inset>
          <span>Cancel</span>
        </z-button>

        <span v-if="error" class="ml-auto pl-2 whitespace-nowrap text-red-500 text-sm">
          Error creating group: {{ error }}
        </span>
      </div>
    </form>
  </section>
</template>
