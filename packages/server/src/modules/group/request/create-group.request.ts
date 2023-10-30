import { z } from 'nestjs-zod/z'
import { jsonApiCreateRequest } from '../../json-api/json-api.dto.js'
import { Group } from '../group.entity.js'

export class CreateGroupRequest extends jsonApiCreateRequest(
  z.object({
    name: z.string().max(250),
    description: z.string().optional(),
    tags: z.array(z.string().max(63)).optional(),
  }),
  Group.type,
) {}
