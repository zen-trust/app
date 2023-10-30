import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module.js'
import { AccessTokenService } from './access-token.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [AccessTokenService],
  exports: [AccessTokenService],
})
export class AccessTokenModule {}
