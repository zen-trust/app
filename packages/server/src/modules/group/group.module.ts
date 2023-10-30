import { forwardRef, Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { UserModule } from '../user/user.module.js'
import { TokenModule } from '../token/token.module.js'
import { GroupController } from './group.controller.js'
import { GroupService } from './group.service.js'

@Module({
  imports: [DatabaseModule, TokenModule, forwardRef(() => UserModule)],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
