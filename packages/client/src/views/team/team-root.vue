<script lang="ts" setup>
import BaseLayout from '@/components/layouts/base-layout.vue'
import NavigationItem from '@/components/navigation-item.vue'
import ZButton from '@/components/z-button.vue'
</script>

<template>
  <base-layout>
    <template #title>Team</template>
    <template #subtitle>
      <span class="ml-1">Manage your team members here.</span>
    </template>
    <template #actions>
      <z-button :to="{ name: 'team.invite' }">
        <span>Invite user</span>
      </z-button>
    </template>

    <template #navigation>
      <navigation-item to="/team/users">
        <span>Members</span>
      </navigation-item>
      <navigation-item to="/team/groups">
        <span>Groups</span>
      </navigation-item>
      <navigation-item exact to="/team/invitations">
        <span>Invitations</span>
      </navigation-item>
    </template>

    <router-view />
  </base-layout>
</template>
