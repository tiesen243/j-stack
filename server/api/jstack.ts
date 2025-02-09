/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 2)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the JStack server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import { HTTPException } from 'hono/http-exception'
import { jstack } from 'jstack'

import type { Session } from '../auth/session'
import { auth, validateSessionToken } from '@/server/auth'
import { db } from '@/server/db'

/**
 * 1. INITIALIZATION
 *
 * This is where the trpc api is initialized
 * */
export const j = jstack.init()

/**
 * Isomorphic Session getter for API requests
 * - Expo requests will have a session token in the Authorization header
 * - Next.js requests will have a session token in cookies
 */
const isomorphicGetSession = async (authToken?: string): Promise<Session> => {
  if (authToken) return validateSessionToken(authToken)
  return auth()
}

/**
 * 2. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a JStack context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://jstack.app/docs/backend/middleware
 */

const createJstackContext = j.middleware(async ({ c, next }) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '')
  const session = await isomorphicGetSession(authToken)

  const source = c.req.header('x-jstack-source') ?? 'unknown'
  console.log('>>> JStack Request from', source, 'by', session.user ?? 'anonymous')

  return await next({ db, session, token: authToken })
})

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your JStack API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://jstack.app/docs/backend/routers
 */
export const createJstackRouter = j.router

/**
 * Middleware for timing procedure execution and adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = j.middleware(async ({ c, next }) => {
  const start = Date.now()
  const result = await next()
  const end = Date.now()

  console.log(`[JStack] ${c.req.path} took ${end - start}ms to execute`)

  return result
})

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * JStack API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = j.procedure.use(createJstackContext).use(timingMiddleware)

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://jstack.app/docs/backend/procedures
 */
export const protectedProceure = j.procedure
  .use(createJstackContext)
  .use(timingMiddleware)
  .use(
    j.middleware(async ({ ctx, next }) => {
      if (!ctx.session.user)
        throw new HTTPException(401, {
          message: 'Unauthorized',
        })

      return await next({
        session: { ...ctx.session, user: ctx.session.user },
      })
    }),
  )
