<script lang="ts" setup>
import BaseLayout from '@/components/layouts/base-layout.vue'
import NavigationItem from '@/components/navigation-item.vue'
</script>

<template>
  <base-layout>
    <template #title>User Profile</template>
    <template #subtitle>You can edit your profile information here.</template>

    <template #navigation>
      <navigation-item to="/user/profile">
        <span>Profile</span>
      </navigation-item>

      <navigation-item to="/user/authentication">
        <span>Authentication</span>
      </navigation-item>

      <navigation-item to="/user/access-tokens">
        <span>Access Tokens</span>
      </navigation-item>

      <navigation-item to="/user/audit-log">
        <span>Audit Log</span>
      </navigation-item>

      <navigation-item to="/user/notifications">
        <span>Notification Preferences</span>
      </navigation-item>
    </template>

    <router-view />
  </base-layout>
</template>
