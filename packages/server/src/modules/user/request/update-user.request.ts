import { z } from 'nestjs-zod/z'
import { jsonApiUpdateRequest } from '../../json-api/json-api.dto.js'
import { User } from '../user.entity.js'

export class UpdateUserRequest extends jsonApiUpdateRequest(
  z.object({
    name: z.string().optional(),
    email: z.string().optional(),
  }),
  User.type,
) {}
