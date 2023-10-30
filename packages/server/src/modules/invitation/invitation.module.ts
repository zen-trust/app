import { forwardRef, Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
// eslint-disable-next-line import/no-cycle -- solved by forward refs
import { AuthenticationModule } from '../authentication/authentication.module.js'
import { InvitationController } from './invitation.controller.js'
import { InvitationService } from './invitation.service.js'

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthenticationModule)],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
