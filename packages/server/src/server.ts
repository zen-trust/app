import process, { env } from 'node:process'
import { fastifyCookie } from '@fastify/cookie'
import secureSession from '@fastify/secure-session'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import Fastify from 'fastify'
import { AppModule } from './modules/app.module.js'

export type * from './index.js'

async function bootstrap() {
  const server = await Fastify({ logger: true })

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // @ts-expect-error -- This is a known Fastify issue
    new FastifyAdapter(server),
  )

    // @ts-expect-error -- This is a known Fastify issue
  await app.register(fastifyCookie, {
    secret: env.SECRET_KEY,
    parseOptions: {
      httpOnly: true,
      path: '/',
    },
  })

    // @ts-expect-error -- This is a known Fastify issue
  await app.register(secureSession, {
    key: Buffer.from(env.SESSION_SECRET || '', 'base64'),
    cookieName: 'zen-trust-session',
    cookie: {
      // secure: 'auto',
      path: '/',
      // signed: true,
      httpOnly: true,
    },
  })

  app.useGlobalPipes(new ValidationPipe())

  await app.listen(Number(env.LISTEN_PORT || 3_000), env.LISTEN_HOST || '0.0.0.0')

  return app
}

bootstrap()
  .then((app) => {
    const shutdown = (signal: string) => {
      app
        .close()
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          console.error(`${signal} received, shutting down...`)
          process.exit(0)
        })
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGQUIT', shutdown)
    process.on('SIGUSR2', shutdown)
  })
  .catch(console.error)
