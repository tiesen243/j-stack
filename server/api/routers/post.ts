import { createJstackRouter, publicProcedure } from '@/server/api/jstack'

export const postRouter = createJstackRouter({
  greeting: publicProcedure.query(({ c }) => {
    return c.superjson({
      message: 'Hello',
    })
  }),

  all: publicProcedure.query(async ({ c, ctx }) => {
    const posts = await ctx.db.post.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return c.superjson({ posts })
  }),
})
