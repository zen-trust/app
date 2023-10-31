<script lang="ts" setup>
import BaseLayout from '@/components/layouts/base-layout.vue'
import ZButton from '@/components/z-button.vue'

const menu = [
  {
    title: 'Members',
    to: '/team/users',
  },
  {
    title: 'Groups',
    to: '/team/groups',
  },
  {
    title: 'Invitations',
    to: '/team/invitations',
    exact: true,
  },
]
</script>

<template>
  <base-layout :menu="menu">
    <template #title>Team</template>
    <template #subtitle>
      <span class="ml-1">Manage your team members here.</span>
    </template>
    <template #actions>
      <z-button :to="{ name: 'team.invite' }">
        <span>Invite user</span>
      </z-button>
    </template>

    <router-view />
  </base-layout>
</template>
