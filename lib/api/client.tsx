'use client'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createClient } from 'jstack'

import type { AppRouter } from '@/server/api/root'
import { getBaseUrl } from '@/lib/utils'
import { createQueryClient } from './query-client'

export const api = createClient<AppRouter>({
  baseUrl: `${getBaseUrl()}/api`,
  headers: {
    'x-jstack-source': 'nextjs-react',
  },
})

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === 'undefined') return createQueryClient()
  else return (clientQueryClientSingleton ??= createQueryClient())
}

export const ReactQueryProvider: React.FC<Readonly<{ children: React.ReactNode }>> = ({
  children,
}) => {
  const client = getQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
