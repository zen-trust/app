<script lang="ts" setup>
import type { Group } from '@zen-trust/server'
import { computed, ref, watch } from 'vue'
import { useGroupStore } from '@/stores/group'
import Icon from '@/components/z-icon.vue'
import ZButton from '@/components/z-button.vue'
import ZTextField from '@/components/fields/z-text-field.vue'
import { truncate, urnToId } from '@/lib/utils'
import { router } from '@/router'
import ZList from '@/components/list/z-list.vue'
import ZListItem from '@/components/list/z-list-item.vue'

const props = defineProps<{
  query?: string
}>()
const groupStore = useGroupStore()
const currentQuery = computed(() => props.query)
const searchTerm = ref(props.query ?? '')

function search() {
  router.push({ query: { query: searchTerm.value } })
}

watch(currentQuery, (query) => (query ? groupStore.search(query) : groupStore.fetchGroups()))

function groupRoute(group: Group) {
  return {
    name: 'team.groups.single',
    params: { id: urnToId(group.id) },
  }
}
</script>

<template>
  <header class="flex items-start justify-between">
    <div>
      <h3 class="text-lg font-medium">Groups</h3>
      <p class="text-gray-500 text-sm">
        Groups are used to organize your team members and assign access permissions.<br />
        You can add users and even other groups to a group.
      </p>
    </div>
  </header>

  <div id="toolbar" class="flex justify-between items-end mt-8">
    <z-text-field
      v-model="searchTerm"
      class="grow max-w-md"
      label=""
      name="search"
      placeholder="Search"
      small
      type="search"
      @keyup.enter="search"
    >
      <template #prepend-icon>
        <icon name="search" />
      </template>
    </z-text-field>

    <z-button :to="{ name: 'team.groups.create' }" inset>
      <span>Create Group</span>
    </z-button>
  </div>

  <section class="mt-4">
    <z-list>
      <z-list-item
        v-for="group in groupStore.groups"
        :key="group.id"
        :subtitle="group.description"
        :title="group.name"
        :to="groupRoute(group)"
      >
        <div class="grid grid-cols-5 gap-x-4 gap-y-0.5 items-center">
          <strong class="col-span-3 font-medium">
            <span
              class="inline-flex max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
              v-text="group.name"
            />
            <icon
              v-if="group.system"
              class="text-lg text-gray-400 dark:text-gray-700 ml-2 align-middle"
              name="lock"
            />
          </strong>
          <span class="text-xs">Tags</span>
          <span class="text-xs ml-auto">Modified</span>
          <div class="text-gray-600 dark:text-gray-500 text-sm col-span-3">
            <span v-if="group.description" v-text="truncate(group.description)" />
            <span v-else class="text-gray-400">No description available</span>
          </div>
          <div class="flex space-x-1 text-xs place-self-start">
            <template v-if="group.tags.length > 0">
              <span
                v-for="tag in group.tags"
                :key="tag"
                class="block px-1 rounded bg-gray-500/25 text-gray-700 dark:text-gray-400"
                v-text="tag"
              />
            </template>
            <span v-else class="text-gray-400">None</span>
          </div>
          <timeago
            v-if="!group.system"
            :datetime="group.updatedAt"
            class="text-gray-600 text-xs place-self-start ml-auto"
          />
          <span v-else class="text-gray-400 text-xs place-self-start ml-auto">Never</span>
        </div>
      </z-list-item>
    </z-list>
  </section>

  <footer class="mt-4 text-xs text-gray-500 py-2 border-t border-gray-100 dark:border-gray-800">
    <span>Total:&nbsp;</span>
    <code>{{ groupStore.groups.length }}</code>
  </footer>
</template>
