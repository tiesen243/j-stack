import { createJstackRouter, j } from '@/server/api/jstack'
import { postRouter } from '@/server/api/routers/post'

const config = createJstackRouter()
  .basePath('/api')
  .use(j.defaults.cors)
  .onError(j.defaults.errorHandler)

export const appRouter = j.mergeRouters(config, {
  post: postRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
