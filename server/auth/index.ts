import { cache } from 'react'
import { cookies } from 'next/headers'

import { validateSessionToken } from '@/server/auth/session'

export const auth = cache(async () => {
  const authToken = (await cookies()).get('auth_token')?.value ?? ''
  if (!authToken) return { expires: new Date(Date.now()) }
  return validateSessionToken(authToken)
})

export { validateSessionToken, invalidateSessionToken } from '@/server/auth/session'
