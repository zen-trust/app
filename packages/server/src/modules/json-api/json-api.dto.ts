import { z } from 'nestjs-zod/z'
import { createZodDto } from 'nestjs-zod'

function jsonApiRequest<
  A extends z.ZodTypeAny,
  T extends z.ZodLiteral<string>,
  I extends z.ZodString,
>(attributes: A, resource?: T, id?: I) {
  const type = resource ?? z.string()
  const schema = z.object({
    data: z.object(id ? { type, attributes, id } : { type, attributes }),
  })

  return createZodDto(schema)
}

export function jsonApiCreateRequest<A extends z.ZodTypeAny, T extends z.ZodLiteral<string>>(
  attributes: A,
  resource?: T | string,
) {
  return jsonApiRequest(attributes, typeof resource === 'string' ? z.literal(resource) : resource)
}

export function jsonApiUpdateRequest<A extends z.ZodTypeAny, T extends z.ZodLiteral<string>>(
  attributes: A,
  resource?: T | string,
) {
  return jsonApiRequest(
    attributes,
    typeof resource === 'string' ? z.literal(resource) : resource,
    z.string(),
  )
}
