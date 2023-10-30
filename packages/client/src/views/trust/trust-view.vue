<script lang="ts" setup>
import BaseLayout from '@/components/layouts/base-layout.vue'
import NavigationItem from '@/components/navigation-item.vue'
</script>

<template>
  <base-layout>
    <template #title>Chain of Trust</template>
    <template #subtitle>Manage your PKI trust chain here.</template>

    <template #navigation>
      <navigation-item to="/trust/root"> Root CAs</navigation-item>
      <navigation-item to="/trust/intermediate"> Intermediate CAs</navigation-item>
      <navigation-item to="/trust/users"> Users</navigation-item>
      <navigation-item to="/trust/hosts"> Hosts</navigation-item>
    </template>

    <router-view />
  </base-layout>
</template>
