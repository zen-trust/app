import { forwardRef, Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { TokenModule } from '../token/token.module.js'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'
import { GroupModule } from '../group/group.module.js'

@Module({
  imports: [DatabaseModule, TokenModule, forwardRef(() => GroupModule)],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
