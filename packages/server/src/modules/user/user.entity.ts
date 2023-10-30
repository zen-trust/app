import type { auth } from 'zapatos/schema'
import type { Links } from '@zen-trust/json-api'
import { Entity } from '../../entity.js'
import type { Group } from '../group/group.entity.js'

export class User extends Entity<'auth.user', 'user'> {
  table = 'auth.user' as const
  type = 'user' as const

  readonly name: string
  readonly email: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly emailVerifiedAt: Date | null
  readonly tags: string[]
  readonly groups: Group[]

  constructor(user: auth.user.JSONSelectable, groups?: Group[]) {
    super(user.id.toString())

    this.name = user.name
    this.email = user.email
    this.createdAt = new Date(user.created_at)
    this.updatedAt = new Date(user.updated_at)
    this.emailVerifiedAt = user.email_verified_at ? new Date(user.email_verified_at) : null
    this.tags = user.tags ?? []
    this.groups = groups ?? []
  }

  public getLinks(): Links {
    return {
      users: '/users',
    }
  }
}
