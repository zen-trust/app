import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Session,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import { Session as SessionData } from '@fastify/secure-session'
import { jsonApiResponse } from '../json-api/json-api.interceptor.js'
import { OnboardingGuard } from './onboarding.guard.js'
import { OnboardingService } from './onboarding.service.js'

class CreateAccountBody {
  @IsString()
  public name!: string

  @IsString()
  @IsEmail({
    allow_ip_domain: true,
    allow_utf8_local_part: true,
  })
  public email!: string
}

@Controller('onboarding')
@ApiTags('onboarding')
export class OnboardingController {
  public constructor(
    @Inject(OnboardingService) private readonly onboardingService: OnboardingService,
  ) {}

  @ApiOkResponse({
    description: 'Checks whether the setup process has been completed.',
  })
  @Get('status')
  public async getStatus() {
    return {
      complete: await this.onboardingService.isSetupComplete(),
    }
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Setup process is sealed.',
  })
  @Post('seal')
  public issueToken(@Session() session: SessionData, @Body('nonce') nonce: string) {
    try {
      this.onboardingService.pullNonce(nonce)
    } catch (error) {
      throw new ForbiddenException((error as Error).message)
    }

    session.set('authenticated', true)
    session.set('onboarding.sealed', true)
    session.set('onboarding.nonce', nonce)
  }

  @ApiOkResponse({
    description: 'Created a new account for the initial user.',
  })
  @Post('account')
  @UseGuards(OnboardingGuard)
  @UseInterceptors(jsonApiResponse({}))
  public async createAccount(
    @Session() session: SessionData,
    @Body() { name, email }: CreateAccountBody,
  ) {
    try {
      const user = await this.onboardingService.createAccount(email, name)
      session.set('user.id', user.id)

      return user
    } catch (error) {
      throw new BadRequestException(
        'The user account could not be created. Check the server logs for more information.',
      )
    }
  }
}
