import { randomBytes } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import type { auth } from 'zapatos/schema'
import { uuidv7 } from 'uuidv7'
import { MailerService } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'
import type { RecordRepositoryContract } from '../database/record-repository.contract.js'
import { DatabaseService } from '../database/database.service.js'
import type { User } from '../user/user.entity.js'
import { urnToId } from '../../utilities.js'
import { UserService } from '../user/user.service.js'
import { Invitation } from './invitation.entity.js'

@Injectable()
export class InvitationService implements RecordRepositoryContract<Invitation, 'id'> {
  public constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService,
    @Inject(MailerService) private readonly mailerService: MailerService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  public async all(where?: auth.invitation.Whereable) {
    const results = await this.databaseService.select('auth.invitation', {
      ...where,
    })

    return results.map((result) => new Invitation(result))
  }

  public async findOneOrFail(id: string, where?: auth.invitation.Whereable) {
    const result = await this.databaseService.selectExactlyOne('auth.invitation', {
      ...where,
      id,
    })

    return new Invitation(result)
  }

  public async create(email: string, user: User, groups?: string[]): Promise<Invitation> {
    const id = uuidv7()
    const token = Buffer.from(randomBytes(16)).toString('base64url')
    const expiresAt = new Date(Date.now() + 1_000 * 60 * 60 * 24 * 7)
    const groupIds = (groups ?? []).map((urn) => urnToId(urn))

    const result = await this.databaseService.serializableTransaction(async (tx) => {
      const invitation = await tx.insert('auth.invitation', {
        id,
        email,
        token,
        expires_at: expiresAt,
        created_by_user_id: Number(user.id),
      })

      await tx.insert(
        'auth.invitation_group',
        groupIds.map((group) => ({
          group_id: group,
          invitation_id: invitation.id,
        })),
      )

      return invitation
    })
    const invitation = new Invitation(result)

    await this.sendInvitationMessage(invitation)

    return invitation
  }

  public async remove(invitation: Invitation) {
    await this.databaseService.delete('auth.invitation', {
      id: invitation.id,
    })
  }

  public update(invitation: Invitation, input: Partial<auth.invitation.JSONSelectable>) {
    return this.databaseService.update('auth.invitation', input, {
      id: invitation.id,
    })
  }

  public async redeem({ id }: Invitation, userData: Partial<auth.user.Insertable>): Promise<User> {
    const results = await this.databaseService.serializableTransaction(async (tx) => {
      const user = await this.userService.create({
        email_verified_at: new Date(),
        ...userData,
      } as auth.user.Insertable)

      await tx.execute(
        tx.sql`INSERT INTO ${'auth.group_user'} (${'user_id'}, ${'group_id'})
                       SELECT ${tx.param(user.id)}, ${'group_id'}
                       FROM ${'auth.invitation_group'}
                       WHERE ${'invitation_id'} = ${tx.param(id)}`,
      )

      const result = await tx.update(
        'auth.invitation',
        {
          used_by_user_id: Number(user.id),
          used_at: new Date(),
        },
        { id },
      )
      const invitation = new Invitation(result[0])

      return { user, invitation }
    })

    return results.user
  }

  private sendInvitationMessage(invitation: Invitation) {
    const baseUrl = this.configService.get<string>('PUBLIC_URL', '')
    const invitationLink = new URL(
      `/auth/invitation/${invitation.id}/${invitation.token}/accept`,
      baseUrl,
    )

    return this.mailerService.sendMail({
      to: invitation.email,
      subject: 'Join Fides for Secure SSH Access',
      text: `Hi there,
      
      You're invited to join Fides, the ultimate solution for secure SSH access 
      to our servers. Click below to create your account and get started:
      ${invitationLink.toString()}

      If you received this email in error, please disregard it.`,
    })
  }
}
