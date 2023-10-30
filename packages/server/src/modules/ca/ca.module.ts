import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '../database/database.module.js'
import { EncryptionSessionModule } from '../encryption-session/encryption-session.module.js'
import { TokenModule } from '../token/token.module'
import { UserModule } from '../user/user.module.js'
import { CaService } from './ca.service.js'
import { CaController } from './ca.controller.js'

@Module({
  imports: [ConfigModule, TokenModule, UserModule, DatabaseModule, EncryptionSessionModule],
  controllers: [CaController],
  providers: [CaService],
  exports: [CaService],
})
export class CaModule {}
