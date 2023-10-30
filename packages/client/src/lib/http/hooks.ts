import type { AfterResponseHook, BeforeRequestHook, NormalizedOptions } from 'ky'
import { useProfileStore } from '@/stores/profile'
import { router } from '@/router'

export const authenticateRequest: BeforeRequestHook = function authenticateRequest(
  _request: Request,
  options: NormalizedOptions,
) {
  // const userStore = useProfileStore()
  //
  // if (token) {
  //   request.headers.set('Authorization', `Bearer ${token}`)
  // }
  //
  options.credentials = 'include'
}

export const handleUnauthorizedResponse: AfterResponseHook =
  async function handleUnauthorizedResponse(
    _request: Request,
    _options: NormalizedOptions,
    response: Response,
  ) {
    if (response.status === 401 || response.status === 403) {
      const userStore = useProfileStore()
      userStore.profile = undefined

      await router.push({
        path: '/auth/sign-in',
        params: {
          redirect: router.currentRoute.value.fullPath,
          message: 'You must be signed in to access this page.',
        },
      })
    }
  }
