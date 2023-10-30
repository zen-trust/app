import type { SelectableForTable, Table, WhereableForTable } from 'zapatos/schema'
import type { Entity } from '../../entity.js'

export interface RecordRepositoryContract<
  Model extends Entity<T, V>,
  Primary extends keyof SelectableForTable<T>,
  T extends Table = Model['table'],
  V extends string = Model['type'],
> {
  all: (where?: WhereableForTable<T>) => Promise<Model[]>

  findOneOrFail: (
    identifier: SelectableForTable<T>[Primary],
    where?: WhereableForTable<T>,
    options?: never,
  ) => Promise<Model>
}
