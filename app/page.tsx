import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { createQueryClient } from '@/lib/api/query-client'
import { api } from '@/lib/api/server'
import { AuthShowcase } from './_components/auth-showcase'
import { CreatePostForm, PostCardSkeleton, PostList } from './_components/post'
import { ThemeBtn } from './_components/theme-btn'

export default function Home() {
  const queryClient = createQueryClient()
  void queryClient.prefetchQuery({
    queryKey: ['post', 'all'],
    queryFn: async () => {
      const res = await api.post.getAll.$get()
      return await res.json()
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container flex min-h-dvh max-w-screen-lg flex-col items-center justify-center overflow-x-hidden">
        <h1 className="mb-4 scroll-m-20 text-center text-4xl font-extrabold tracking-tight lg:text-5xl">
          Create{' '}
          <span className="text-foreground dark:text-[hsl(221,89%,72%)]">Yuki</span> Turbo
        </h1>

        <ThemeBtn />

        <AuthShowcase />

        <CreatePostForm />

        <div className="mt-4 w-full max-w-2xl md:max-h-80 md:overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            <PostList />
          </Suspense>
        </div>
      </main>
    </HydrationBoundary>
  )
}
