import { defineStore } from 'pinia'
import type { Group, User } from '@zen-trust/server'

export const useGroupStore = defineStore('group', {
  state: () => ({
    groups: [] as Group[],
    members: {} as Record<Group['id'], (User | Group)[]>,
  }),

  actions: {
    async fetchGroups() {
      this.groups = await this.$api.all<Group>('group')
    },

    async search(query: string) {
      this.groups = await this.$api.all<Group>('group', {
        searchParams: {
          query,
        },
      })
    },

    async suggestMembers(group: Group, query: string) {
      const [users, groups] = await Promise.all([
        this.$api.all<User>('user', {
          searchParams: { query },
        }),
        this.$api.all<Group>('group', {
          searchParams: { query },
        }),
      ])

      return [...users, ...groups].filter(
        (member) => !group.members.some(({ id }) => member.id === id),
      )
    },

    async fetchGroup(id: string) {
      const group = await this.$api.single<Group>(`group/${id}`)
      this.groups = [...this.groups.filter((g) => g.id !== group.id), group]
    },

    async fetchGroupMembers(id: string) {
      const members = await this.$api.all<User>(`group/${id}/member`)

      this.members = { ...this.members, [id]: members }
    },

    async createGroup(group: Pick<Group, 'name' | 'description' | 'tags'>) {
      await this.$api.create<Group>('group', {
        type: 'group',
        attributes: group,
      })

      return this.fetchGroups()
    },

    async updateGroup(id: string, group: Pick<Group, 'name' | 'description' | 'tags'>) {
      await this.$api.update<Group>(`group/${id}`, {
        type: 'group',
        id,
        attributes: {
          name: group.name,
          description: group.description,
          tags: group.tags,
        },
      })

      return this.fetchGroups()
    },

    async addMembers(group: Group, pendingMembers: (Group | User)[]) {
      const resources = pendingMembers.map((member) => ({
        type: member.type,
        id: member.id,
      }))

      await this.$api.create<Group>(`group/${group.id}/member`, {
        type: 'member',
        attributes: {},
      })

      return this.fetchGroups()
    },

    async deleteGroup(id: string) {
      await this.$api.remove(`group/${id}`)

      return this.fetchGroups()
    },
  },

  getters: {
    findById: (state) => (id: string) => {
      return state.groups.find((group) => group.id === `urn:zen-trust:group:${id}`)
    },
    findMembersById: (state) => (id: string) => {
      return state.members[id]
    },
    findGroupsByUserId: (state) => (id: string) => {
      return state.groups.filter(
        (group: Group) =>
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- members may not be loaded
          group.members && group.members.some((member) => member.id === `urn:zen-trust:user:${id}`),
      )
    },
  },
})
