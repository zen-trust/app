import type { auth } from 'zapatos/schema'
import {Exclude, Expose} from 'class-transformer'
import { Entity } from '../../entity.js'
import type { User } from '../user/user.entity.js'

export class Group extends Entity<'auth.group', 'group'> {
  table = 'auth.group' as const
  type = 'group' as const

  name: string
  description: string
  tags: string[]
  createdBy: string | null
  createdAt: Date
  updatedAt: Date

  @Exclude()
  members: (User | Group)[]

  public constructor(group: auth.group.JSONSelectable, members?: (User | Group)[]) {
    super(group.id.toString())

    this.name = group.name
    this.description = group.description
    this.tags = group.tags ?? []
    this.createdBy = group.created_by_user_id?.toString() ?? null
    this.createdAt = new Date(group.created_at)
    this.updatedAt = new Date(group.updated_at)
    this.members = members ?? []
  }

  @Expose()
  get system(): boolean {
    return this.createdBy === null
  }
}
