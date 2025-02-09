import {
  createJstackRouter,
  protectedProceure,
  publicProcedure,
} from '@/server/api/jstack'
import { createPostSchema, getPostSchema } from '@/validators/post'

export const postRouter = createJstackRouter({
  getAll: publicProcedure.query(async ({ ctx, c }) => {
    const posts = await ctx.db.post.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return c.superjson(posts)
  }),

  getOne: publicProcedure.input(getPostSchema).query(async ({ ctx, input, c }) => {
    const post = await ctx.db.post.findUnique({ where: input })
    return c.superjson(post)
  }),

  create: protectedProceure
    .input(createPostSchema)
    .mutation(async ({ c, ctx, input }) => {
      const post = await ctx.db.post.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      })
      return c.superjson({ post })
    }),

  delete: protectedProceure.input(getPostSchema).mutation(async ({ ctx, input, c }) => {
    const post = await ctx.db.post.delete({ where: input })
    return c.superjson(post)
  }),
})
