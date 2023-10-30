import { Inject, Injectable } from '@nestjs/common'
import type { JwtSignOptions } from '@nestjs/jwt'
import { JwtService } from '@nestjs/jwt'
import type * as jwt from 'jsonwebtoken'
import { User } from '../user/user.entity.js'

@Injectable()
export class TokenService {
  public constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  public issueToken(options: IssueAccessTokenOptions): Promise<string> {
    const payload: AccessTokenPayload = { scope: options.scope }

    return this.jwtService.signAsync(payload, {
      ...this.resolveSignOptions(options, payload),
      subject: options.subject instanceof User ? options.subject.id : options.subject,
    })
  }

  public issueAuthenticationToken(options: IssueAuthenticationTokenOptions): Promise<string> {
    const payload: AuthenticationTokenPayload = { aut: options.authenticator }

    return this.jwtService.signAsync(payload, {
      ...options,
      ...payload,
      subject: options.subject instanceof User ? options.subject.id : options.subject,
    })
  }

  public validateToken(token: string): Promise<AccessToken & AccessTokenPayload> {
    return this.jwtService.verifyAsync(token)
  }

  private resolveSignOptions(
    options: IssueAccessTokenOptions,
    payload: AccessTokenPayload,
  ): JwtSignOptions {
    return Object.fromEntries(
      Object.entries(options).filter(([key]) => !Object.keys(payload).includes(key)),
    )
  }
}

interface IssueAuthenticationTokenOptions
  extends Omit<
    jwt.SignOptions,
    'keyid' | 'algorithm' | 'allowInsecureKeySizes' | 'allowInvalidAsymmetricKeyTypes' | 'subject'
  > {
  subject: string | User
  authenticator: string
}

interface IssueAccessTokenOptions
  extends Omit<
    jwt.SignOptions,
    'keyid' | 'algorithm' | 'allowInsecureKeySizes' | 'allowInvalidAsymmetricKeyTypes' | 'subject'
  > {
  subject: string | User
  scope: string
}

export interface AccessToken {
  sub: string
  aud?: string
  exp: number
  iat: number
}

export interface AccessTokenPayload {
  scope: string
}

export interface AuthenticationTokenPayload {
  aut: string
}
