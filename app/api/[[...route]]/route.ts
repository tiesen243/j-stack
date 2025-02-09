import { handle } from 'hono/vercel'

import { appRouter } from '@/server/api/root'

const handler = handle(appRouter.handler)

export { handler as GET, handler as POST }
