import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { DatabaseModule } from '../database/database.module.js'
import { EncryptionSessionModule } from '../encryption-session/encryption-session.module.js'
import { TokenModule } from '../token/token.module'
import { UserModule } from '../user/user.module.js'
import { RootCaService } from './root-ca.service.js'
import { RootCaController } from './root-ca.controller.js'

@Module({
  imports: [
    CacheModule.register(),

    TokenModule,
    UserModule,

    DatabaseModule,
    EncryptionSessionModule,
  ],
  controllers: [RootCaController],
  providers: [RootCaService],
})
export class RootCaModule {}
