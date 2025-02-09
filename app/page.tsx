'use client'

import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api/client'

export default function Home() {
  const { data } = useQuery({
    queryKey: ['post'],
    queryFn: async () => {
      const res = await api.post.all.$get()
      return await res.json()
    },
  })

  console.log(data)

  return <div></div>
}
