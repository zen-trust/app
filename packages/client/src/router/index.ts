import { createRouter, createWebHistory } from 'vue-router'
import { useOnboardingStore } from '@/stores/onboarding'
import { useProfileStore } from '@/stores/profile'
import { useGroupStore } from '@/stores/group'
import { useUserStore } from '@/stores/user'
import { idToUrn } from '@/lib/utils'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth/sign-in',
      name: 'auth.signIn',
      component: () => import('../views/auth/sign-in-view.vue'),
      beforeEnter: (_to, _from, next) => {
        const profileStore = useProfileStore()

        if (profileStore.profile) {
          next({ name: 'home' })
        } else {
          next()
        }
      },
    },
    {
      path: '/auth/sign-out',
      name: 'auth.signOut',
      component: () => import('../views/auth/sign-out-view.vue'),
      beforeEnter: (_to, _from, next) => {
        const profileStore = useProfileStore()

        if (!profileStore.profile) {
          next({ name: 'auth.signIn' })
        } else {
          next()
        }
      },
    },
    {
      path: '/auth/invitation/:id/:token/accept',
      name: 'invitation.accept',
      props: true,
      component: () => import('../views/auth/accept-invitation.vue'),
      beforeEnter(_to, _from, next) {
        const profileStore = useProfileStore()

        if (profileStore.profile) {
          next({ name: 'home' })
        } else {
          next()
        }
      },
    },

    {
      path: '/user',
      component: () => import('../views/user/user-view.vue'),
      children: [
        {
          name: 'user.profile',
          path: 'profile',
          component: () => import('../views/user/user-profile.vue'),
        },
        {
          name: 'user.authentication',
          path: 'authentication',
          component: () => import('../views/user/user-authentication.vue'),
        },
        {
          name: 'user.accessTokens',
          path: 'access-tokens',
          component: () => import('../views/user/access-tokens.vue'),
        },
        {
          name: 'user.auditLog',
          path: 'audit-log',
          component: () => import('../views/user/audit-log.vue'),
        },
        {
          name: 'user.notifications',
          path: 'notifications',
          component: () => import('../views/user/user-notifications.vue'),
        },
      ],
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/onboarding/onboarding-view.vue'),
      beforeEnter: async (_to, _from, next) => {
        const onboardingStore = useOnboardingStore()
        await onboardingStore.checkOnboardingStatus()

        if (onboardingStore.complete) {
          next({ name: 'home' })
        } else {
          next()
        }
      },
    },
    {
      path: '/team',
      component: () => import('../views/team/team-root.vue'),
      children: [
        {
          path: '',
          redirect: '/team/users',
        },
        {
          path: 'users',
          component: () => import('../views/team/users/users-root.vue'),
          children: [
            {
              path: '',
              name: 'team.users',
              props: ({ query }) => ({ query: query.query }),
              component: () => import('../views/team/users/user-list.vue'),
              beforeEnter: async (_to, _from, next) => {
                const teamStore = useUserStore()
                await Promise.all([teamStore.fetchUsers(), teamStore.fetchInvitations()])

                next()
              },
            },
            {
              path: ':id',
              name: 'team.users.single',
              props: ({ params }) => ({ id: idToUrn(params.id as string, 'user') }),
              component: () => import('../views/team/users/single-user.vue'),
              beforeEnter: async (to, _from, next) => {
                const teamStore = useUserStore()
                const groupStore = useGroupStore()
                await Promise.all([
                  teamStore.fetchUser(to.params.id as string),
                  groupStore.fetchGroups(),
                ])

                next()
              },
            },
            {
              path: ':id/edit',
              name: 'team.users.edit',
              props: ({ params }) => ({ id: idToUrn(params.id as string, 'user') }),
              component: () => import('../views/team/users/edit-user.vue'),
            },
          ],
        },
        {
          path: 'groups',
          component: () => import('../views/team/groups/groups-root.vue'),
          children: [
            {
              path: '',
              name: 'team.groups',
              props: ({ query }) => ({ query: query.query }),
              component: () => import('../views/team/groups/group-list.vue'),
              beforeEnter: async (_to, _from, next) => {
                const groupStore = useGroupStore()
                await groupStore.fetchGroups()

                next()
              },
            },
            {
              path: 'create',
              name: 'team.groups.create',
              component: () => import('../views/team/groups/create-group.vue'),
            },
            {
              path: ':id',
              name: 'team.groups.single',
              props: ({ params }) => ({ id: idToUrn(params.id as string, 'group') }),
              component: () => import('../views/team/groups/single-group.vue'),
              beforeEnter: async (to, _from, next) => {
                const groupStore = useGroupStore()
                await groupStore.fetchGroup(to.params.id as string)

                next()
              },
            },
            {
              path: ':id/edit',
              name: 'team.groups.edit',
              props: true,
              beforeEnter: async (to, _from, next) => {
                const groupStore = useGroupStore()
                const groupId = to.params.id as string
                await groupStore.fetchGroup(groupId)
                const group = groupStore.findById(groupId)

                if (group?.system) {
                  next({ name: 'team.groups.single', params: { id: groupId } })
                }

                next()
              },
              component: () => import('../views/team/groups/edit-group.vue'),
            },
          ],
        },
        {
          path: 'invitations',
          name: 'team.invite',
          component: () => import('../views/team/team-invitations.vue'),
          beforeEnter: async (_to, _from, next) => {
            const groupStore = useGroupStore()
            await groupStore.fetchGroups()

            next()
          },
        },
      ],
    },
    {
      path: '/trust',
      component: () => import('../views/trust/trust-view.vue'),
      children: [
        {
          path: 'root',
          name: 'trust.root',
          component: () => import('../views/trust/trust-root-view.vue'),
        },
        {
          path: 'intermediate',
          name: 'trust.intermediate',
          component: () => import('../views/trust/trust-intermediate-view.vue'),
        },
      ],
    },
    {
      path: '/certificates',
      redirect: '/trust',
    },

    {
      path: '/ecdh-exchange',
      name: 'ecdhExchange',
      component: () => import('../views/ecdh-exchange-view.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/home-view.vue'),
    },

    {
      path: '/:segments(.*)*',
      name: 'notFound',
      component: () => import('../views/not-found-view.vue'),
    },
  ],
})
