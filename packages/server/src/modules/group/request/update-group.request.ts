import { z } from 'nestjs-zod/z'
import { jsonApiUpdateRequest } from '../../json-api/json-api.dto.js'
import { Group } from '../group.entity.js'

export class UpdateGroupRequest extends jsonApiUpdateRequest(
  z.object({
    name: z.string().max(250).optional(),
    description: z.string().optional(),
    tags: z.array(z.string().max(63)).optional(),
  }),
  Group.type,
) {}
