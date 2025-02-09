'use server'

import { cache } from 'react'
import { cookies } from 'next/headers'

import { invalidateSessionToken, validateSessionToken } from '@/server/auth/session'

export const auth = cache(async () => {
  const authToken = (await cookies()).get('auth_token')?.value ?? ''
  if (!authToken) return { expires: new Date(Date.now()) }
  return validateSessionToken(authToken)
})

export const signOut = async () => {
  const authToken = (await cookies()).get('auth_token')?.value ?? ''
  if (!authToken) return
  return invalidateSessionToken(authToken)
}
