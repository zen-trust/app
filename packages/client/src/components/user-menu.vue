<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { Popover, PopoverButton, PopoverOverlay, PopoverPanel } from '@headlessui/vue'
import { useProfileStore } from '@/stores/profile'
import Icon from '@/components/z-icon.vue'

const userStore = useProfileStore()
const { profile } = storeToRefs(userStore)
</script>

<template>
  <div v-if="profile" class="-mr-3">
    <Popover v-slot="{ open, close }" class="relative">
      <!--
      <PopoverOverlay class="fixed inset-0 bg-black opacity-10 transition" />
      -->
      <PopoverButton
        :class="open ? '' : 'text-opacity-90'"
        class="group inline-flex items-center rounded-md px-3 py-2 text-base font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
      >
        <span v-text="profile.name" />
        <Icon
          :class="open ? '' : 'text-opacity-70'"
          :name="open ? 'expand_less' : 'expand_more'"
          class="ml-1 text-gray-500 transition duration-150 ease-in-out group-hover:text-opacity-50"
        />
      </PopoverButton>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <PopoverPanel
          class="absolute right-0 z-10 mt-3 w-screen max-w-xs transform px-4 sm:px-0 lg:max-w-xs"
        >
          <div class="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            <div class="relative grid gap-2 grid-cols-1 bg-white dark:bg-black p-4">
              <router-link
                class="flex items-center hover:bg-gray-50 dark:hover:bg-gray-950 p-2 rounded-md group transition"
                to="/user/profile"
                @click="close"
               >
                <Icon
                  class="text-gray-400 dark:text-gray-600 group-hover:text-green-500 transition"
                  name="account_circle"
                />
                <span class="ml-2">User Profile</span>
              </router-link>
              <router-link
                class="flex items-center hover:bg-gray-50 dark:hover:bg-gray-950 p-2 rounded-md group transition"
                to="/auth/sign-out"
                @click="close"
              >
                <Icon
                  class="text-gray-400 dark:text-gray-600 group-hover:text-green-500 transition"
                  name="logout"
                />
                <span class="ml-2">Sign out</span>
              </router-link>
            </div>
            <div class="bg-gray-50 dark:bg-gray-950 p-4">
              <a
                class="flow-root rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                href="#"
              >
                <span class="flex items-center">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-300">
                    Documentation
                  </span>
                </span>
                <span class="block text-sm text-gray-500 dark:text-gray-400">
                  Start integrating products and tools
                </span>
              </a>
            </div>
          </div>
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
  <nav v-else>
    <router-link to="/auth/sign-in">Sign in</router-link>
  </nav>
</template>
