import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { FastifyReply, FastifyRequest } from 'fastify'
import { grantType } from './oauth.constants.js'
import { oauthGuard } from './oauth.guard.js'
import type { AccessTokenResponse } from './oauth.service.js'
import { OauthService } from './oauth.service.js'
import type { ExchangeTokenRequest } from './token.request.js'
import { TokenRequest } from './token.request.js'

@Controller('oauth')
@ApiTags('oauth')
export class OauthController {
  public constructor(@Inject(OauthService) private readonly oauthService: OauthService) {}

  @ApiOkResponse()
  @Get('authorize')
  public authorize(@Req() request: FastifyRequest, @Res() response: FastifyReply) {
    return this.oauthService.authorize(request, response)
  }

  @ApiOkResponse()
  @Post('token')
  public token(@Req() request: FastifyRequest, @Res() response: FastifyReply) {
    return this.oauthService.token(request, response)
  }

  @ApiOkResponse()
  @Get('test')
  @UseGuards(oauthGuard({ scopes: ['profile'] }))
  public test() {
    return 'success!'
  }

  @ApiOkResponse()
  @Post('token_old')
  public async tokenOld(@Body() body: TokenRequest): Promise<AccessTokenResponse> {
    switch (body.grant_type) {
      case grantType.CLIENT_CREDENTIALS:
        return this.oauthService.issueToken('foo', 'bar')

      case grantType.AUTHORIZATION_CODE:
        throw new ForbiddenException('Unsupported subject token type')

      case grantType.REFRESH_TOKEN:
        throw new ForbiddenException('Unsupported subject token type')

      case grantType.TOKEN_EXCHANGE:
        return this.exchangeToken(body as ExchangeTokenRequest)

      default:
        throw new ForbiddenException('Unsupported grant type')
    }
  }

  private exchangeToken(body: ExchangeTokenRequest): Promise<AccessTokenResponse> {
    if (body.subject_token_type !== 'urn:ietf:params:oauth:token-type:jwt') {
      throw new ForbiddenException('Unsupported subject token type')
    }

    if (body.actor_token) {
      throw new ForbiddenException('Actor tokens are not supported yet')
    }

    return this.oauthService.exchangeToken(
      body.subject_token,
      body.subject_token_type,
      body.resource,
      body.audience,
      body.scope,
      body.actor_token,
      body.actor_token_type,
    )
  }
}
