import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module.js'
import { RefreshTokenService } from './refresh-token.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
