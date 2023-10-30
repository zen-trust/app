import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { EncryptionSessionController } from './encryption-session.controller.js'
import { EncryptionSessionService } from './encryption-session.service.js'

@Module({
  imports: [CacheModule.register()],
  controllers: [EncryptionSessionController],
  providers: [EncryptionSessionService],
  exports: [EncryptionSessionService],
})
export class EncryptionSessionModule {}
