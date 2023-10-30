import type {
  ApiResponse,
  ApiResponseWithData,
  Meta,
  Relationships,
  ResourceObject,
  ResourceObjects,
} from '@zen-trust/json-api'
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Injectable, mixin, UseInterceptors } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { ClassTransformOptions } from 'class-transformer'
import { instanceToPlain } from 'class-transformer'
import type { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { Table } from 'zapatos/schema'
import { Entity } from '../../entity.js'

type NestedEntityProperties<
  T extends Entity<V>,
  V extends Table = T['table'],
  U extends Table = Table,
> = {
  [K in keyof T]: T[K] extends Entity<U> | Entity<U>[] ? K : never
}[keyof T]

export interface JsonApiInterceptorOptions<T extends Entity<V>, V extends Table = T['table']> {
  links?: Record<string, string> | ((entities: T | T[]) => Record<string, string>)
  transform?: ClassTransformOptions
  includes?: NestedEntityProperties<T, V>[]
}

export const JsonApiResponse = <T extends Entity<V>, V extends Table = T['table']>(
  options?: JsonApiInterceptorOptions<T>,
) => UseInterceptors(jsonApiResponse(options))

export function jsonApiResponse<T extends Entity<V>, V extends Table = T['table']>(
  interceptorOptions?: JsonApiInterceptorOptions<T>,
) {
  @Injectable()
  class JsonApiResponseInterceptor implements NestInterceptor<T | T[], ApiResponse<T>> {
    public readonly defaultOptions: Partial<JsonApiInterceptorOptions<T>> = {}

    public constructor(public readonly reflector: Reflector) {}

    public intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
      const options = {
        ...this.defaultOptions,
        ...interceptorOptions,
      }

      return next
        .handle()
        .pipe(
          map((data: T | T[]) =>
            Array.isArray(data)
              ? this.collectionResponse(data, options)
              : this.singleResponse(data, options),
          ),
        )
    }

    public singleResponse(
      entity: T,
      options: JsonApiInterceptorOptions<T, V>,
    ): ApiResponseWithData<T> {
      if (!(entity instanceof Entity)) {
        throw new Error('JSON:API responses can only be generated for entities.')
      }

      const includeKeys = options.includes ?? []
      const included = includeKeys.flatMap((key) => {
        const resource = entity[key] as Entity<Table> | Entity<Table>[]

        return (Array.isArray(resource) ? resource : [resource]).map((item) => ({
          type: item.type,
          id: `urn:zen-trust:${item.type}:${item.id}`,
          attributes: instanceToPlain(item, options.transform) as T,
          links: {
            ...item.getLinks(),
            self: item.getSelfLink(),
          },
        }))
      })
      const relationships = includeKeys.reduce<Relationships>((acc, key) => {
        const resource = entity[key] as Entity<Table> | Entity<Table>[]

        return {
          ...acc,
          [key]: {
            data: (Array.isArray(resource) ? resource : [resource]).map((item) => ({
              type: item.type,
              id: `urn:zen-trust:${item.type}:${item.id}`,
            })),
          },
        }
      }, {})

      return {
        data: {
          type: entity.type,
          id: `urn:zen-trust:${entity.type}:${entity.id}`,
          attributes: instanceToPlain(entity, options.transform) as T,
          relationships: includeKeys.length > 0 ? relationships : undefined,
        },
        included: included.length > 0 ? included : undefined,
        links: {
          ...(typeof options.links === 'function' ? options.links(entity) : options.links),
          ...entity.getLinks(),
          self: entity.getSelfLink(),
        },
      }
    }

    public collectionResponse(
      entities: T[],
      options: JsonApiInterceptorOptions<T>,
    ): ApiResponseWithData<T, Meta> {
      const data: ResourceObjects<T, Meta> = entities.map((entity): ResourceObject<T, Meta> => {
        if (!(entity instanceof Entity)) {
          throw new Error('JSON:API responses can only be generated for entities.')
        }

        return {
          type: entity.type,
          id: `urn:zen-trust:${entity.type}:${entity.id}`,
          attributes: instanceToPlain(entity, options.transform) as T,
          links: {
            ...entity.getLinks(),
            self: entity.getSelfLink(),
          },
        }
      })

      return {
        data,
        links: typeof options.links === 'function' ? options.links(entities) : options.links,
      }
    }
  }

  return mixin(JsonApiResponseInterceptor)
}
