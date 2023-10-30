import type { auth } from 'zapatos/schema'
import { Entity } from '../../entity.js'

export class Invitation extends Entity<'auth.invitation', 'invitation'> {
  table = 'auth.invitation' as const
  type = 'invitation' as const

  email: string
  token: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  usedAt: Date | null
  createdBy: number | null
  usedBy: number | null
  groups: string[]

  constructor(invitation: auth.invitation.JSONSelectable, groups?: string[]) {
    super(invitation.id)

    this.email = invitation.email
    this.token = invitation.token
    this.createdAt = new Date(invitation.created_at)
    this.updatedAt = new Date(invitation.updated_at)
    this.expiresAt = new Date(invitation.expires_at)
    this.usedAt = invitation.used_at ? new Date(invitation.used_at as string) : null
    this.createdBy = invitation.created_by_user_id
    this.usedBy = invitation.used_by_user_id
    this.groups = groups ?? []
  }

  get used(): boolean {
    return this.usedBy !== null
  }
}
