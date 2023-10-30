import type { TransformationType } from 'class-transformer/types/enums'
import type { Table } from 'zapatos/schema'
import type { ClassTransformOptions } from 'class-transformer'
import { Exclude } from 'class-transformer'
import type { Attributes, Links } from '@zen-trust/json-api'
import type { Type } from '@nestjs/common'
import { toKebabCase } from './utilities.js'

export interface TransformationContext<V extends Table, T extends Entity<Table> = Entity<Table>> {
  value: V
  key: string
  obj: T
  type: TransformationType
  options: ClassTransformOptions
}

export type EntityType<T extends Table, V extends string = string> = Type<Entity<T, V>> & {
  table: T
  type: V
  uri: string
}

export abstract class Entity<T extends Table, V extends string = string> implements Attributes {
  @Exclude()
  public abstract readonly table: T

  public abstract readonly type: V

  @Exclude()
  public readonly id: string

  protected constructor(id: string) {
    this.id = id
  }

  public static get table() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- This is safe because the type is a string literal
    return this.prototype.table
  }

  public static get type() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- This is safe because the type is a string literal
    return this.prototype.type
  }

  public static get uri() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- This is safe because the type is a string literal
    return `/${toKebabCase(this.type)}`
  }

  public getLinks(): Links {
    return {}
  }

  public getSelfLink() {
    return `/${toKebabCase(this.type)}/${this.id}`
  }
}
