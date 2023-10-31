import type {
  ApiResponseWithResourceObjectCollection,
  ApiResponseWithSingleResourceObject,
  Attributes,
  Included,
  Relationships,
  ResourceObject,
} from '@zen-trust/json-api'
import type ky from 'ky'
import { HTTPError, type Options as RequestOptions } from 'ky'

export function buildContext(client: typeof ky) {
  const pending = new PendingRequestStore()

  function request(requestInit: Request, options?: JsonableRequestOptions): Promise<Response>
  function request(url: string | URL, options?: JsonableRequestOptions): Promise<Response>
  async function request(url: string | URL | Request, options?: JsonableRequestOptions) {
    // eslint-disable-next-line no-param-reassign -- we're just taking care of undefined
    options = { ...options }
    const optionsWithSafeBody: RequestOptions = {
      ...options,
      body:
        typeof options.body !== 'string' &&
        !(options.body instanceof FormData) &&
        !(options.body instanceof URLSearchParams) &&
        !(options.body instanceof ReadableStream)
          ? JSON.stringify(options.body)
          : (options.body as BodyInit | undefined),
    }
    const requestOptions = !(url instanceof Request)
      ? ({
          ...optionsWithSafeBody,
          headers: new Headers(options.headers as HeadersInit),
        } satisfies RequestOptions & {
          headers: Headers
        })
      : url

    requestOptions.headers.set('Accept', 'application/json')

    if (requestOptions.body && !requestOptions.headers.has('Content-Type')) {
      requestOptions.headers.set('Content-Type', 'application/json')
    }

    const input = !(url instanceof Request) ? url.toString().replace(/^\//, '') : url

    let pendingResponse = pending.get(input, optionsWithSafeBody)

    if (pendingResponse) {
      return pendingResponse
    }

    let response: Response

    try {
      pendingResponse = client(input, {
        method: requestOptions.method,
        ...requestOptions,
      })

      if (requestOptions.method === 'GET') {
        pending.set(input, optionsWithSafeBody, pendingResponse)
      }

      // Wait for the request to finish
      response = await pendingResponse
    } catch (error) {
      if (!isHttpError(error)) {
        throw new ConnectionException(error as Error)
      }

      let message: string
      const body = await error.response.clone().text()

      try {
        const json = JSON.parse(body) as {
          message: string
          error: string
          code: number
        }
        message = json.message
      } catch {
        message = body
      }

      throw new HttpException(message, error.response, error)
    } finally {
      if (requestOptions.method === 'GET') {
        pending.delete(input, optionsWithSafeBody)
      }
    }

    return response
  }

  function get(url: string | URL, options?: JsonableRequestOptions): Promise<Response> {
    return request(url, { ...options, method: 'GET' })
  }

  function del(url: string | URL, options?: JsonableRequestOptions): Promise<Response> {
    return request(url, { ...options, method: 'DELETE' })
  }

  function post(
    url: string | URL,
    body?: SerializableBody,
    options?: JsonableRequestOptions,
  ): Promise<Response> {
    return request(url, { ...options, method: 'POST', body })
  }

  function put(
    url: string | URL,
    body?: SerializableBody,
    options?: JsonableRequestOptions,
  ): Promise<Response> {
    return request(url, { ...options, method: 'PUT', body })
  }

  function patch(
    url: string | URL,
    body?: SerializableBody,
    options?: JsonableRequestOptions,
  ): Promise<Response> {
    return request(url, { ...options, method: 'PATCH', body })
  }

  async function single<T extends Attributes>(resource: string, options?: RequestOptions) {
    const response = await get(resource, options)
    const body = (await response.json()) as ApiResponseWithSingleResourceObject<T>

    return {
      id: body.data.id,
      ...body.data.attributes,
      ...hydrateRelationships(body.data.relationships, body.included),
    }
  }

  async function all<T extends Attributes>(resource: string, options?: RequestOptions) {
    const response = await get(resource, options)
    const body = (await response.json()) as ApiResponseWithResourceObjectCollection<T>

    return body.data.map(({ attributes, id, relationships }) => ({
      id,
      ...attributes,
      ...hydrateRelationships(relationships, body.included),
    }))
  }

  async function update<T extends Attributes>(
    uri: string,
    { type, id, attributes }: UpdateResourceOptions<T>,
  ) {
    const response = await patch(uri, {
      data: { type, id, attributes },
    })
    const body = (await response.json()) as ApiResponseWithSingleResourceObject<T>

    return {
      id: body.data.id,
      ...body.data.attributes,
      ...hydrateRelationships(body.data.relationships, body.included),
    }
  }

  async function replace<T extends Attributes>(
    uri: string,
    { type, id, attributes }: UpdateResourceOptions<T>,
  ) {
    const response = await put(uri, {
      data: { type, id, attributes },
    })
    const body = (await response.json()) as ApiResponseWithSingleResourceObject<T>

    return {
      id: body.data.id,
      ...body.data.attributes,
      ...hydrateRelationships(body.data.relationships, body.included),
    }
  }

  async function create<T extends Attributes>(
    uri: string,
    { type, attributes }: CreateResourceOptions<T>,
  ) {
    const response = await post(uri, {
      data: { type, attributes },
    })
    const body = (await response.json()) as ApiResponseWithSingleResourceObject<T>

    return {
      id: body.data.id,
      ...body.data.attributes,
      ...hydrateRelationships(body.data.relationships, body.included),
    }
  }

  async function createRelationship<T extends Attributes>(
    uri: string,
    { type, id }: CreateRelationshipOptions<T>,
  ) {
    await put(uri, {
      data: { type, id },
    })
  }

  async function remove(resource: string) {
    await del(resource)
  }

  return {
    single,
    all,
    update,
    replace,
    create,
    createRelationship,
    remove,

    http: {
      request,
      get,
      delete: del,
      post,
      put,
      patch,
    },
  }
}

export interface UpdateResourceOptions<A extends Attributes> {
  id: string
  type: string
  attributes: Partial<A>
}

export interface CreateResourceOptions<A extends Attributes> {
  type: string
  attributes: Partial<A>
}

export interface CreateRelationshipOptions<A extends Attributes> {
  type: A['type']
  id: A['id']
}

function hydrateRelationships<
  A extends Attributes = Attributes,
  D extends ResourceObject<A> | ResourceObject<A>[] = ResourceObject<A> | ResourceObject<A>[],
>(
  relationships: Relationships<D> | undefined,
  included: Included<A> | undefined,
): Record<string, A | A[]> {
  if (!included || !relationships) {
    return {}
  }

  return Object.entries(relationships).reduce<Record<string, A | A[]>>(
    (hydratedRelationships, [key, { data }]) => {
      if (data === undefined) {
        return hydratedRelationships
      }

      if (Array.isArray(data)) {
        return {
          ...hydratedRelationships,
          [key]: data
            .map((item) => included.find(({ id, type }) => type === item.type && id === item.id))
            .filter((item): item is ResourceObject<A> => item !== undefined)
            .map(({ attributes, id }) => ({ id, ...attributes })),
        }
      }

      const includedItem = included.find(({ id, type }) => type === data.type && id === data.id)

      if (!includedItem) {
        return hydratedRelationships
      }

      return {
        ...hydratedRelationships,
        [key]: {
          id: includedItem.id,
          ...includedItem.attributes,
        },
      }
    },
    {},
  )
}

export type ApiContext = ReturnType<typeof buildContext>

type SerializableBody =
  | object
  | bigint
  | string
  | number
  | boolean
  | null
  | FormData
  | URLSearchParams
  | ReadableStream
  | Blob
  | undefined

export interface JsonableRequestOptions extends Omit<RequestOptions, 'body'> {
  body?: SerializableBody
}

export class HttpException extends Error {
  public constructor(
    message: string,
    public readonly response: Response,
    public readonly originalError?: HTTPError,
    public readonly statusCode = response.status,
  ) {
    super(message)
  }
}

class ConnectionException extends Error {
  public constructor(error: Error) {
    super(`Could not connect to the server: ${error.message}`)
  }
}

class PendingRequestStore {
  private store: Map<string, Promise<Response>>

  constructor() {
    this.store = new Map<string, Promise<Response>>()
  }

  public set(
    url: string | URL | Request,
    options: RequestOptions,
    request: Promise<Response>,
  ): void {
    this.store.set(this.key(url, options), request)
  }

  public has(url: string | URL | Request, options: RequestOptions): boolean {
    return this.store.has(this.key(url, options))
  }

  public get(url: string | URL | Request, options: RequestOptions): Promise<Response> | undefined {
    return this.store.get(this.key(url, options))
  }

  public delete(url: string | URL | Request, options: RequestOptions) {
    this.store.delete(this.key(url, options))
  }

  private key(url: string | URL | Request, options: RequestOptions): string {
    return (
      (url instanceof Request ? url.url : url).toString() +
      JSON.stringify(options.searchParams || '')
    )
  }
}

function isHttpError(candidate: unknown): candidate is HTTPError {
  return candidate instanceof HTTPError
}
