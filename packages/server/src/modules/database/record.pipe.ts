import type {PipeTransform, Type} from '@nestjs/common'
import {forwardRef, HttpException, Inject, mixin, Param} from '@nestjs/common'
import {NotExactlyOneError} from 'zapatos/db'
import type {SelectableForTable, Table, WhereableForTable} from 'zapatos/schema'
import type {Entity} from '../../entity.js'
import type {RecordRepositoryContract} from './record-repository.contract.js'

/**
 * Convenience wrapper to apply the record pipe to a parameter.
 */
export const Record = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we can't know the entity type here
  R extends RecordRepositoryContract<E, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we can't know the entity type here
  E extends Entity<any>,
>(
  property: string,
  service: Type<R>,
  options?: RecordPipeOptions<E['table'], Parameters<R['findOneOrFail']>[2]>,
) => Param(property, createRecordPipe(service, options))

interface RecordPipeOptions<T extends Table, O> {
  where?: WhereableForTable<T>
  options?: O
  notFoundMessage?: string
}

export function createRecordPipe<
  R extends RecordRepositoryContract<E, P>,
  E extends Entity<T>,
  T extends Table = E['table'],
  P extends keyof SelectableForTable<T> = keyof SelectableForTable<T>,
>(Service: Type<R>, options?: RecordPipeOptions<T, Parameters<R['findOneOrFail']>[2]>) {
  class RecordPipe implements PipeTransform {
    constructor(
      @Inject(forwardRef(() => Service))
      public readonly service: R,
    ) {}

    public async transform(
      value: SelectableForTable<T>[P],
      // metadata: ArgumentMetadata,
    ) {
      try {
        return await this.service.findOneOrFail(value, options?.where, options?.options)
      } catch (error) {
        if (error instanceof NotExactlyOneError) {
          const message = options?.notFoundMessage ?? 'No such record.'

          throw new HttpException(message, 404)
        }

        throw error
      }
    }
  }

  return mixin(RecordPipe)
}
