import { randomBytes } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { UserService } from '../user/user.service.js'

@Injectable()
export class OnboardingService {
  private nonce: string | undefined = randomBytes(16).toString('hex')

  public constructor(@Inject(UserService) private readonly userService: UserService) {}

  public async isSetupComplete() {
    return (await this.userService.total()) > 0
  }

  public getNonce() {
    if (!this.nonce) {
      throw new Error('Nonce has already been invalidated')
    }

    return this.nonce
  }

  public invalidateNonce() {
    this.nonce = undefined
  }

  public async createAccount(email: string, name: string) {
    return this.userService.create({
      name,
      email,
    })
  }

  public pullNonce(nonce: string) {
    let expectedNonce: string

    try {
      expectedNonce = this.getNonce()
    } catch (error) {
      throw new Error(
        'This nonce has already been used on another device,' +
          'or the setup process has been aborted. To generate a new nonce, ' +
          'restart the server, and try again.',
      )
    }

    if (nonce !== expectedNonce) {
      throw new Error(
        'The provided nonce is invalid. Check whether you have entered the ' +
          'correct nonce, or restart the server to generate a new one.',
      )
    }

    this.invalidateNonce()
  }
}
