import type { CanActivate, ExecutionContext, Type } from '@nestjs/common'
import { Inject, Injectable, mixin, UseGuards } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'

interface GateGuardOptions {
  throwOnFirstError?: boolean
}

export const Gate = (guards: Type<CanActivate>[]) => UseGuards(GateGuard(guards))

export function GateGuard(guards: Type<CanActivate>[], options?: GateGuardOptions) {
  @Injectable()
  class Guard implements CanActivate {
    public guards: CanActivate[] = []

    constructor(@Inject(ModuleRef) private readonly modRef: ModuleRef) {}

    async canActivate(context: ExecutionContext) {
      // TODO: This could be a performance issue, as it will create a new
      //       instance of each guard for each request. Investigate if this
      //       becomes a problem.
      this.guards = await this.createGuardInstances()

      for (const guard of this.guards) {
        // eslint-disable-next-line no-await-in-loop -- We need to wait for the guard to finish
        const result = await guard.canActivate(context)

        if (result === true) {
          return true
        }

        if (options?.throwOnFirstError) {
          return false
        }
      }

      return false
    }

    private createGuardInstances() {
      return Promise.all(guards.map((guard) => this.modRef.create(guard)))
    }
  }

  return mixin(Guard) as Type<CanActivate>
}
