import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@Controller('oauth/client')
@ApiTags('oauth')
export class ClientController {}
