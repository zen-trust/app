import type { RootCa } from "@zen-trust/server";
import { defineStore } from 'pinia'

export const useRootCaStore = defineStore('rootCa', {
  state: () => ({
    rootCas: [] as RootCa[],
  }),

  actions: {
    async fetchRootCas(): Promise<void> {
      this.rootCas = await this.$api.all<RootCa>('root-ca')
    }
  }
})
