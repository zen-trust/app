import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CacheModule } from '@nestjs/cache-manager'
import { UserModule } from '../user/user.module.js'
import { DatabaseModule } from '../database/database.module.js'
import { TokenModule } from '../token/token.module.js'
// eslint-disable-next-line import/no-cycle -- solved by forward refs
import { InvitationModule } from '../invitation/invitation.module.js'
import { AuthenticationService } from './authentication.service.js'
import { AuthenticationController } from './authentication.controller.js'
import { AuthenticatorModule } from './authenticator/authenticator.module.js'
import { ProfileController } from './profile.controller.js'

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    ConfigModule,
    CacheModule.register(),
    TokenModule,
    AuthenticatorModule,
    forwardRef(() => InvitationModule),
  ],
  controllers: [AuthenticationController, ProfileController],
  providers: [AuthenticationService],
  exports: [AuthenticationService, TokenModule, UserModule],
})
export class AuthenticationModule {}
