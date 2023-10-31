<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'

interface NavigationItem {
  title: string
  to: string | RouteLocationRaw
  exact?: boolean
}

defineProps<{
  fullWidth?: boolean
  menu?: NavigationItem[]
}>()
</script>

<template>
  <article :class="fullWidth ? '' : 'mx-auto max-w-6xl'" class="flex flex-col grow w-full pb-8">
    <header
      v-if="$slots.title"
      :class="fullWidth ? 'w-full mx-auto max-w-6xl' : ''"
      class="px-4 my-8 flex items-center"
    >
      <div>
        <h1 class="font-medium text-3xl">
          <slot name="title" />
        </h1>
        <p v-if="$slots.subtitle" class="mt-2 text-gray-500 dark:text-gray-400">
          <slot name="subtitle" />
        </p>
      </div>

      <div class="ml-auto">
        <slot name="actions" />
      </div>
    </header>

    <div class="flex grow h-full items-stretch">
      <aside v-if="$slots.navigation || menu" class="w-1/5">
        <nav class="flex flex-col mr-8 border-r border-gray-100 dark:border-gray-800">
          <slot :menu="menu" name="navigation">
            <router-link
              v-for="(item, index) in menu"
              :key="index"
              :exact="item.exact"
              :to="item.to"
              active-class="border-r-4 border-green-500 hover:border-green-500 bg-green-100 dark:bg-green-900/50"
              class="py-2 px-4 hover:border-r-4 hover:bg-green-50 dark:hover:bg-green-700/50 hover:border-green-200 focus:bg-green-50 dark:focus:bg-green-700/50 focus:border-green-200 outline-none select-none whitespace-nowrap transition"
            >
              <span v-text="item.title" />
            </router-link>
          </slot>
        </nav>
      </aside>

      <div :class="fullWidth ? '' : 'px-4'" class="w-full">
        <slot />
      </div>
    </div>
  </article>
</template>
