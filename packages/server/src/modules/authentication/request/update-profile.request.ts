import { z } from 'nestjs-zod/z'
import { jsonApiUpdateRequest } from '../../json-api/json-api.dto.js'
import { User } from '../../user/user.entity.js'

export class UpdateProfileRequest extends jsonApiUpdateRequest(
  z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().min(3).optional(),
  }),
  User.type,
) {}
