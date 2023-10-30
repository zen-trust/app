/**
 * A representation of a single resource.
 */
export interface ResourceObjectWithIncluded<
  D extends Attributes = Attributes,
  M extends Meta = DefaultMeta,
  I extends Included = Included,
> {
  type: string
  id: string
  attributes: D
  relationships?: Relationships
  links?: Links
  meta?: M
  included?: I
}

/**
 * A representation of a single resource without included resources
 * in order to avoid circular dependencies.
 */
export interface ResourceObject<D extends Attributes = Attributes, M extends Meta = DefaultMeta> {
  type: string
  id: string
  attributes: D
  relationships?: Relationships
  links?: Links
  meta?: M
}

/**
 * An array of Resource Objects.
 */
export type ResourceObjects<
  D extends Attributes = Attributes,
  M extends Meta = DefaultMeta,
> = ResourceObject<D, M>[]

/**
 * Either or a single Resource Object or an array of Resource Objects.
 */
export type ResourceObjectOrObjects<D extends Attributes = Attributes> =
  | ResourceObject<D>
  | ResourceObjects<D>

/**
 * A ResourceIdentifier identifies and individual resource.
 */
export type ResourceIdentifier<T extends ResourceObject = ResourceObject> = Pick<
  T,
  'type' | 'id' | 'meta'
>

/**
 * A representation of a new Resource Object that
 * originates at the client and is yet to be created
 * on the server. The main difference between a regular
 * Resource Object is that this may not have an `id` yet.
 */
export interface NewResourceObject<D extends Attributes = Attributes> {
  type: string
  id?: string
  attributes?: D
  relationships?: Relationships
  links?: Links
}

/**
 * Attributes describing a Resource Object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- must be any, so it can be extended
export type Attributes = Record<string, any>;

/**
 * A Resource object's Relationships.
 */
export type Relationships<D extends ResourceObject | ResourceObject[] = ResourceObject | ResourceObject[]> = Record<string, Relationship<D>>;

/**
 * Describes a single Relationship type between a
 * Resource Object and one or more other Resource Objects.
 */
export interface Relationship<
  D extends ResourceObject | ResourceObject[] = ResourceObject | ResourceObject[],
> {
  data?: D extends ResourceObject
    ? ResourceIdentifier<D>
    : D extends ResourceObject[]
    ? ResourceIdentifier<D[0]>[]
    : ResourceIdentifier | ResourceIdentifier[]
  links?: Links
  meta?: Meta
}

/**
 * A Response from a JSON API-compliant server.
 */
export interface ApiResponse<
  D extends Attributes = Attributes,
  M extends Meta = DefaultMeta,
  I extends Included = Included,
  L extends Links = Links,
> {
  data?: ResourceObjectOrObjects<D>
  included?: I
  links?: L
  errors?: ApiError[]
  meta?: M
}

/**
 * A Response for sure containing data.
 */
export interface ApiResponseWithData<
  D extends Attributes = Attributes,
  M extends Meta = DefaultMeta,
  I extends Included = Included,
  L extends Links = Links,
> extends ApiResponse<D, M> {
  data: ResourceObjectOrObjects<D>
  included?: I
  links?: L
  meta?: M
}

export interface ApiResponseWithSingleResourceObject<
  D extends Attributes = Attributes,
  M extends Meta = DefaultMeta,
  I extends Included = Included,
  L extends Links = Links,
> extends ApiResponse<D, M> {
  data: ResourceObject<D>
  included?: I
  links?: L
  meta?: M
}

export interface ApiResponseWithResourceObjectCollection<
  D extends Attributes = Attributes,
  M extends Meta = DefaultMeta,
  I extends Included = Included,
  L extends Links = Links,
> extends ApiResponse<D, M> {
  data: ResourceObjects<D>
  included?: I
  links?: L
  meta?: M
}

/**
 * A Response for sure containing Errors.
 */
export interface ApiResponseWithErrors extends ApiResponse {
  errors: ApiError[]
}

/**
 * A Request to be sent to a JSON API-compliant server.
 */
export interface Request<
  D extends NewResourceObject | NewResourceObject[] = NewResourceObject | NewResourceObject[],
> {
  data: D
  included?: ResourceObject[]
  links?: Links
  errors?: [ApiError]
  meta?: Meta
}

/**
 * An Error.
 */
export interface ApiError {
  id?: string
  links?: Links
  status?: string
  code?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
  meta?: Meta
}

/**
 * An index of Links.
 */
export type Links = Record<string, string | LinkObject>;

export type Included<D extends Attributes = Attributes> = ResourceObject<D>[]

/**
 * A Link.
 */
export interface LinkObject {
  href: string
  meta: Meta
}

/**
 * An index of Meta data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- must be any, so it can be extended
export type Meta = Record<string, any>;

export interface DefaultMeta {
  currentPage?: number
  from?: number
  lastPage?: number
  perPage?: number
  to?: number
  total?: number
}
