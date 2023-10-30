import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule } from '@nestjs/config'
import { MailerModule } from '@nestjs-modules/mailer'
import type MailMessage from 'nodemailer/lib/mailer/mail-message.js'
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod'
import { APP_PIPE } from '@nestjs/core'
import { JsonApiModule } from './json-api/json-api.module.js'
import { RootCaModule } from './root-ca/root-ca.module.js'
import { EncryptionSessionModule } from './encryption-session/encryption-session.module.js'
import { DatabaseModule } from './database/database.module.js'
import { CaModule } from './ca/ca.module.js'
import { UserModule } from './user/user.module.js'
import { AuthenticationModule } from './authentication/authentication.module.js'
import { OnboardingModule } from './onboarding/onboarding.module.js'
import { OauthModule } from './oauth/oauth.module.js'
import { TokenModule } from './token/token.module.js'
import { GroupModule } from './group/group.module.js'
import { InvitationModule } from './invitation/invitation.module.js'

patchNestJsSwagger()

@Module({
  imports: [
    // NestJS dependencies
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register(),
    MailerModule.forRoot({
      transport: {
        name: 'dev',
        version: '1.0.0',
        send(mail: MailMessage, callback: (err: Error | null, info: unknown) => void) {
          console.log('Sending mail', mail.data)
          callback(null, {})
        },
      },
    }),

    // Application dependencies
    EncryptionSessionModule,
    DatabaseModule,
    TokenModule,
    JsonApiModule,

    AuthenticationModule,
    OnboardingModule,
    OauthModule,

    // HTTP API Modules
    RootCaModule,
    CaModule,
    UserModule,
    InvitationModule,
    GroupModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
