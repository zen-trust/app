import { stdout } from 'node:process'
import { Inject, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TokenModule } from '../token/token.module.js'
import { UserModule } from '../user/user.module.js'
import { OnboardingController } from './onboarding.controller.js'
import { OnboardingService } from './onboarding.service.js'

@Module({
  imports: [ConfigModule, UserModule, TokenModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {
  public constructor(
    @Inject(OnboardingService) private readonly onboardingService: OnboardingService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  public async onModuleInit(): Promise<void> {
    const complete = await this.onboardingService.isSetupComplete()
    const nonce = this.onboardingService.getNonce()
    const publicUrl = this.resolveServerUrl()
    publicUrl.pathname = '/setup'
    publicUrl.searchParams.set('nonce', nonce)

    if (complete) {
      return
    }

    const boxWidth = publicUrl.toString().length + 4
    stdout.write(
      `\n\n` +
        ` ┏${'━'.repeat(boxWidth)}┓\n` +
        ` ┃${' '.repeat(boxWidth)}┃\n` +
        ` ┃${' '.repeat((boxWidth - 28) / 2)}Starting Fides in Setup Mode${' '.repeat(
          (boxWidth - 28) / 2,
        )}┃\n` +
        ` ┃${' '.repeat(boxWidth)}┃\n` +
        ` ┣${'━'.repeat(boxWidth)}┫\n${[
          '',
          ' Please complete the setup process by visiting the following URL',
          ' in your web browser:',
          ` ${publicUrl.toString()}`,
          '',
          ' The setup process requires the following nonce:',
          ' ╭──────────────────────────────────╮',
          ` │ ${nonce} │`,
          ' ╰──────────────────────────────────╯',
          '',
          ' Important! If this instance has been set up before, this means',
          ' there are issues with the database.',
          ' Please check the logs for more information.',
        ]
          .map((line) => `${` ┃ ${line}`.padEnd(boxWidth)}  ┃\n`)
          .join('')} ┃${' '.repeat(boxWidth)}┃\n` +
        ` ┗${'━'.repeat(boxWidth)}┛\n` +
        `\n\n`,
    )
  }

  private resolveServerUrl() {
    const host = this.configService.get<string>('LISTEN_HOST', 'localhost')
    const port = this.configService.get<number>('LISTEN_PORT', 3000)
    const publicUrl = this.configService.get<string>('PUBLIC_URL', '')

    return new URL(publicUrl || `http://${host}:${port}`)
  }
}
