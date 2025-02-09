import { cookies } from 'next/headers'
import { createClient } from 'jstack'

import type { AppRouter } from '@/server/api/root'
import { getBaseUrl } from '../utils'

export const api = createClient<AppRouter>({
  baseUrl: `${getBaseUrl()}/api`,
  headers: async () => {
    const token = (await cookies()).get('auth_token')?.value ?? ''

    return {
      'x-jstack-source': 'rsc',
      Authorization: `Bearer ${token}`,
    }
  },
})
