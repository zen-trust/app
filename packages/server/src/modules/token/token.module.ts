import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TokenService } from './token.service.js'

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        signOptions: {
          expiresIn: '60m',
        },
        secretOrKeyProvider: (requestType /*tokenOrPayload, verifyOrSignOrOptions*/) => {
          switch (requestType) {
            //case JwtSecretRequestType.SIGN:
            // TODO: Retrieve private key for signing dynamically
            // return <string>configService.get<string>("JWT_SECRET");

            //case JwtSecretRequestType.VERIFY:
            // TODO: Retrieve public key for verification dynamically
            // return <string>configService.get<string>("JWT_SECRET");

            default:
              return configService.get<string>('JWT_SECRET') ?? ''
          }
        },
      }),
    }),
  ],
  providers: [TokenService],
  exports: [JwtModule, TokenService],
})
export class TokenModule {}
