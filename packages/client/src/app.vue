<script lang="ts" setup>
import { RouterLink, RouterView } from 'vue-router'
import UserMenu from '@/components/user-menu.vue'

const menu = [
  {
    title: 'Team',
    path: '/team',
  },
  {
    title: 'Certificates',
    path: '/certificates',
  },
  {
    title: 'Trust',
    path: '/trust',
  },
]
</script>

<template>
  <article class="flex flex-col grow h-full dark:text-gray-300">
    <header
      class="flex px-4 w-full max-w-6xl mx-auto border-b border-gray-100 dark:border-gray-800 select-none"
    >
      <router-link to="/" class="py-4">
        <img
          alt="Zen Trust logo"
          class="w-16 h-16"
          height="512"
          src="@/assets/logo.png"
          width="512"
        />
      </router-link>

      <nav class="mx-8 flex-1 flex space-x-4">
        <router-link
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          exact-active-class="border-b-green-500 hover:border-b-green-500"
          class="flex px-2 mx-2 hover:text-black dark:hover:text-white hover:border-b-green-500/50 items-center border-y-4 border-transparent transition"
        >
          <span v-text="item.title"/>
        </router-link>

        <!--
        <router-link to="/ecdh-exchange">ECDH Exchange</router-link>
        -->
      </nav>

      <user-menu class="ml-auto py-4 self-center" />
    </header>

    <router-view />

    <footer class="py-4 text-center text-xs text-gray-500">
      <span>Powered by <a class="underline" href="https://zen-trust">Fides.io</a></span>
      <span>&nbsp;•&nbsp;</span>
      <span>Made with ❤️ by OSS contributors</span>
      <span>&nbsp;•&nbsp;</span>
      <a class="underline" href="https://github.com/zen-trust/">GitHub</a>
    </footer>
  </article>
</template>
