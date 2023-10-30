// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- the types are not exported as a namespace
import type {
  AuthenticationExtensionsClientOutputs,
  AuthenticatorAttachment,
  AuthenticatorAttestationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types'
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator'

export class VerifyAttestationRequest implements RegistrationResponseJSON {
  @IsString()
  public id!: string

  @IsString()
  public rawId!: string

  @IsString()
  @IsEnum(['public-key'])
  public type!: 'public-key'

  @IsObject()
  public response!: AuthenticatorAttestationResponseJSON

  @IsString()
  @IsOptional()
  @IsEnum(['cross-platform', 'platform'])
  authenticatorAttachment?: AuthenticatorAttachment

  @IsObject()
  clientExtensionResults!: AuthenticationExtensionsClientOutputs
}
