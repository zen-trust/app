import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module.js'
import { AuthenticatorService } from './authenticator.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [AuthenticatorService],
  exports: [AuthenticatorService],
})
export class AuthenticatorModule {}
