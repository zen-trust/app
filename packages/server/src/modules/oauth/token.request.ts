import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator'
import { type GrantType, grantType } from './oauth.constants.js'

function isTokenExchange(request: TokenRequest): request is ExchangeTokenRequest {
  return request.grant_type === grantType.TOKEN_EXCHANGE
}

export class TokenRequest {
  @IsString()
  @IsEnum(Object.values(grantType))
  public grant_type!: GrantType

  @IsString()
  @IsOptional()
  public code?: string

  @IsString()
  @IsOptional()
  public refresh_token?: string

  @IsString()
  @IsOptional()
  public scope?: string

  @IsString()
  @IsOptional()
  public audience?: string

  @IsString()
  @IsOptional()
  public resource?: string

  @ValidateIf((request: TokenRequest) => isTokenExchange(request))
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public subject_token?: string

  @ValidateIf((request: TokenRequest) => isTokenExchange(request))
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public subject_token_type?: string

  @ValidateIf((request: TokenRequest) => isTokenExchange(request))
  @IsString()
  @IsOptional()
  @IsOptional()
  public actor_token?: string

  @ValidateIf((request: TokenRequest) => Boolean(isTokenExchange(request) && request.actor_token))
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public actor_token_type?: string
}

export interface ExchangeTokenRequest {
  grant_type: typeof grantType.TOKEN_EXCHANGE
  scope?: string
  resource?: string
  audience?: string
  subject_token: string
  subject_token_type: string
  actor_token?: string
  actor_token_type?: string
}
