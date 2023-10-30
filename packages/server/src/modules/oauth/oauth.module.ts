import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TokenModule } from '../token/token.module.js'
import { UserModule } from '../user/user.module.js'
import { ClientModule } from './client/client.module.js'
import { OauthController } from './oauth.controller.js'
import { OauthService } from './oauth.service.js'
import { RefreshTokenModule } from './refresh-token/refresh-token.module.js'
import { AccessTokenModule } from './access-token/access-token.module.js'

@Module({
  imports: [
    ConfigModule,
    TokenModule,
    UserModule,
    ClientModule,
    AccessTokenModule,
    RefreshTokenModule,
  ],
  controllers: [OauthController],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
