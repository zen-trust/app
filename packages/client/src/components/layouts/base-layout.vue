<script lang="ts" setup>
defineProps<{
  fullWidth?: boolean
}>()
</script>

<template>
  <article class="flex flex-col grow w-full pb-8" :class="fullWidth ? '' : 'mx-auto max-w-6xl'">
    <header v-if="$slots.title" class="px-4 my-8 flex items-center" :class="fullWidth ? 'w-full mx-auto max-w-6xl' : ''">
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
      <aside v-if="$slots.navigation" class="w-1/5">
        <nav class="flex flex-col mr-8 border-r border-gray-100 dark:border-gray-800">
          <slot name="navigation" />
        </nav>
      </aside>

      <div class="w-full" :class="fullWidth ? '': 'px-4'">
        <slot />
      </div>
    </div>
  </article>
</template>
