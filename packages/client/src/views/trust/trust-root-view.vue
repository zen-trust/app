<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRootCaStore } from '@/stores/root-ca'

const rootCaStore = useRootCaStore()

onMounted(() => {
  rootCaStore.fetchRootCas()
})
</script>

<template>
  <section>
    <ul>
      <li v-for="ca in rootCaStore.rootCas" :key="ca.id">
        <span>{{ ca.id }}</span>
        <span>{{ ca.subject }}</span>
      </li>
    </ul>
  </section>
</template>
