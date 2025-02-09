'use client'

import { useSuspenseQuery } from '@tanstack/react-query'

import { api } from '@/lib/api/client'

export const PostList: React.FC = () => {
  const { data } = useSuspenseQuery({
    queryKey: ['post', 'all'],
    queryFn: async () => {
      const res = await api.post.getAll.$get()
      return await res.json()
    },
  })

  return <div>{JSON.stringify(data, null, 2)}</div>
}
