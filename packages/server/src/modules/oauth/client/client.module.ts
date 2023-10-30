import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module.js'
import { ClientController } from './client.controller.js'
import { ClientService } from './client.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
