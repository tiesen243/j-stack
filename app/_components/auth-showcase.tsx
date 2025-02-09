import Form from 'next/form'

import { Button } from '@/components/ui/button'
import { auth, signOut } from '@/server/auth'

export async function AuthShowcase() {
  const session = await auth()

  if (!session.user) {
    return (
      <Form action="/api/auth/discord" className="mb-4 flex flex-col gap-4">
        <Button size="lg">Sign in with Discord</Button>
      </Form>
    )
  }

  return (
    <div className="mb-4 flex flex-col items-center justify-center gap-4">
      <p className="text-xl leading-7">Logged in as {session.user.name}</p>

      <Form action={signOut}>
        <Button>Sign out</Button>
      </Form>
    </div>
  )
}
