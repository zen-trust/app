import { z } from 'nestjs-zod/z'
import { jsonApiCreateRequest } from '../../json-api/json-api.dto.js'
import { User } from '../../user/user.entity.js'

export class CreateProfileRequest extends jsonApiCreateRequest(
  z.object({
    name: z.string().min(2),
    email: z.string().email().min(3),
  }),
  User.type,
) {}
