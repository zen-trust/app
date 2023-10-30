import type { Group, Invitation, User } from '@zen-trust/server'
import { defineStore } from 'pinia'
import { urnToId } from '@/lib/utils'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    invitations: [] as Invitation[],
  }),

  actions: {
    // region Users
    async fetchUsers() {
      this.users = await this.$api.all<User>('user')
    },

    async fetchUser(id: string) {
      const user = await this.$api.single<User>(`user/${id}`, {
        searchParams: [['include', 'groups']],
      })

      this.users = [...this.users.filter((u) => u.id !== user.id), user]
    },

    async deleteUser(user: User) {
      await this.$api.remove(`user/${user.id}`)
    },
    // endregion

    // region Invitations
    async fetchInvitations() {
      this.invitations = await this.$api.all<Invitation>('invitation')
    },

    async fetchInvitation(id: string) {
      const invitation = await this.$api.single<Invitation>(`invitation/${id}`)

      this.invitations = [...this.invitations.filter((i) => i.id !== invitation.id), invitation]
    },

    async revokeInvitation(invitation: Invitation) {
      await this.$api.remove(`invitation/${invitation.id}`)
    },

    async createInvitation(email: string, groups: string[]) {
      await this.$api.create<Invitation>('invitation', {
        type: 'invitation',
        attributes: { email, groups },
      })
    },
    // endregion

    // region Groups
    async suggestGroups(user: User, query: string): Promise<Group[]> {
      const groups = await this.$api.all<Group>('group', {
        searchParams: {
          query,
        },
      })

      return groups.filter((group) => !user.groups.some(({ id }) => group.id === id))
    },

    async addGroups(user: User, groups: Group[]) {
      await Promise.all(groups.map((group) => this.addGroup(user, group)))
    },

    async addGroup(user: User, group: Group) {
      const userId = urnToId(user.id)
      const groupId = urnToId(group.id)

      await this.$api.createRelationship<Group>(`user/${userId}/groups/${groupId}`, {
        type: 'group',
        id: groupId,
      })
    },

    async removeGroup(user: User, group: Group) {
      const userId = urnToId(user.id)
      const groupId = urnToId(group.id)

      await this.$api.remove(`user/${userId}/groups/${groupId}`)
    },
    // endregion
  },

  getters: {
    all: (state): User[] => {
      return state.users
    },

    findById:
      (state) =>
      (id: string): User | undefined => {
        return state.users.find((user) => user.id === `urn:zen-trust:user:${id}`)
      },
  },
})
