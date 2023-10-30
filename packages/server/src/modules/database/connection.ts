import * as db from 'zapatos/db'
import type {
  ColumnForTable,
  InsertableForTable,
  Table,
  UpdatableForTable,
  WhereableForTable,
} from 'zapatos/schema'
import { DatabaseError } from 'pg'
import type { EntityType } from '../../entity.js'
import { DuplicateException } from './duplicate.exception.js'

type SelectOptionsForTable<
  T extends Table,
  V extends Table,
  C extends ColumnsOption<T>,
  L extends LateralOption<C, E>,
  E extends ExtrasOption<T>,
  A extends string,
> = db.SelectOptionsForTable<T, C, L, E, A> & {
  include?: EntityType<V>[]
}

export class Connection<Q extends db.Queryable = db.Queryable> {
  public constructor(public readonly queryable: Q) {}

  get db() {
    return db
  }

  get sql() {
    return db.sql
  }

  get param() {
    return db.param
  }

  public selectOne<
    T extends Table,
    C extends ColumnsOption<T>,
    L extends LateralOption<C, E>,
    E extends ExtrasOption<T>,
    A extends string,
  >(
    table: T,
    where: WhereableForTable<T> | db.SQLFragment | db.AllType,
    options?: db.SelectOptionsForTable<T, C, L, E, A>,
    queryable: db.Queryable = this.queryable,
  ) {
    const query = db.selectOne(table, where, options)

    return query.run(queryable)
  }

  public selectExactlyOne<
    T extends Table,
    V extends Table,
    C extends ColumnsOption<T>,
    L extends LateralOption<C, E>,
    E extends ExtrasOption<T>,
    A extends string,
  >(
    table: T,
    where: WhereableForTable<T> | db.SQLFragment | db.AllType,
    options?: SelectOptionsForTable<T, V, C, L, E, A>,
    queryable: db.Queryable = this.queryable,
  ) {
    const includes = this.buildIncludes(options?.include ?? [])
    let lateral: L | undefined = options?.lateral

    for (const [key, value] of Object.entries(includes)) {
      if (typeof lateral === 'undefined') {
        lateral = {} as L
      }

      if (Array.isArray(lateral)) {
        lateral.push(value)
      } else {
        ;(lateral as db.SQLFragmentMap)[key] = value
      }
    }

    const query = db.selectExactlyOne(table, where, {
      ...options,
      lateral,
    })

    return query.run(queryable)
  }

  public select<
    T extends Table,
    C extends ColumnsOption<T>,
    L extends LateralOption<C, E>,
    E extends ExtrasOption<T>,
    A extends string = never,
    M extends db.SelectResultMode = db.SelectResultMode.Many,
  >(
    table: T,
    where: WhereableForTable<T> | db.SQLFragment | db.AllType,
    options?: db.SelectOptionsForTable<T, C, L, E, A>,
    mode?: M,
    aggregate?: string,
    queryable: db.Queryable = this.queryable,
  ) {
    const query = db.select(table, where, options, mode, aggregate)

    return query.run(queryable)
  }

  public async insert<T extends Table>(
    table: T,
    values: InsertableForTable<T> | InsertableForTable<T>[],
    options?: db.ReturningOptionsForTable<
      T,
      ColumnForTable<T>[],
      db.SQLFragmentOrColumnMap<T> | undefined
    >,
    queryable: db.Queryable = this.queryable,
  ) {
    // @ts-expect-error -- TODO: Figure out why the signature for values doesn't match
    const query = db.insert(table, values, options)

    try {
      return await query.run(queryable)
    } catch (error) {
      if (!(error instanceof DatabaseError)) {
        throw error
      }

      if (error.code === '23505') {
        throw new DuplicateException('Duplicate key', error)
      }

      throw error
    }
  }

  public update<T extends Table, C extends ColumnsOption<T>, E extends ExtrasOption<T>>(
    table: T,
    values: UpdatableForTable<T>,
    where: WhereableForTable<T> | db.SQLFragment,
    options?: db.ReturningOptionsForTable<T, C, E>,
    queryable: db.Queryable = this.queryable,
  ) {
    const query = db.update(table, values, where, options)

    return query.run(queryable)
  }

  public delete<T extends Table>(
    table: T,
    where: WhereableForTable<T> | db.SQLFragment,
    queryable: db.Queryable = this.queryable,
  ) {
    const query = db.deletes(table, where)

    return query.run(queryable)
  }

  public count<T extends Table>(
    table: T,
    where: WhereableForTable<T> | db.SQLFragment | db.AllType = db.all,
    options: Parameters<db.NumericAggregateSignatures>[2] = {},
  ): Promise<number> {
    return db.count(table, where, options).run(this.queryable)
  }

  public execute(sql: db.SQLFragment) {
    return sql.run(this.queryable)
  }

  buildIncludes<
    T extends Table,
    V extends Table,
    C extends ColumnsOption<T>,
    E extends ExtrasOption<T>,
  >(includes: EntityType<V>[]): LateralOption<C, E> & db.SQLFragmentMap {
    return includes.reduce<db.SQLFragmentMap>(
      (acc, entity) => ({
        ...acc,
        ...this.buildJoinForInclude(entity),
      }),
      {},
    )
  }

  private buildJoinForInclude<
    T extends Table,
    V extends Table,
    C extends ColumnsOption<V>,
    E extends ExtrasOption<V>,
  >(
    entity: EntityType<T>,
    keyColumn: ColumnForTable<T> = 'id' as ColumnForTable<T>,
    relatedColumn: ColumnForTable<V> = `${entity.table}_id` as ColumnForTable<V>,
  ): LateralOption<C, E> {
    return {
      [entity.type]: this.db.select(entity.table, {
        [keyColumn]: this.db.parent(relatedColumn),
      } satisfies WhereableForTable<T>),
    }
  }
}

type ExtrasOption<T extends Table> = db.SQLFragmentOrColumnMap<T> | undefined
type ColumnsOption<T extends Table> = readonly ColumnForTable<T>[] | undefined
type LimitedLateralOption = db.SQLFragmentMap | undefined
type FullLateralOption = LimitedLateralOption | db.SQLFragment
type LateralOption<
  C extends ColumnsOption<Table>,
  E extends ExtrasOption<Table>,
> = undefined extends C
  ? undefined extends E
    ? FullLateralOption
    : LimitedLateralOption
  : LimitedLateralOption
