import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Discord, generateState, OAuth2RequestError } from 'arctic'

import { env } from '@/env'
import { getBaseUrl } from '@/lib/utils'
import { createSession, validateSessionToken } from '@/server/auth/session'
import { db } from '@/server/db'

type ReqType = 'getSession' | 'discord'

const discord = new Discord(
  env.DISCORD_ID,
  env.DISCORD_SECRET,
  `${getBaseUrl()}/api/auth/discord/callback`,
)

const handler = async (
  req: NextRequest,
  { params }: { params: Promise<{ auth: [ReqType, string] }> },
) => {
  const nextUrl = req.nextUrl
  const nextCookies = await cookies()

  const [reqType, isCallback] = (await params).auth

  if (reqType === 'getSession') {
    const token =
      req.cookies.get('auth_token')?.value ?? req.headers.get('Authorization') ?? ''
    const session = await validateSessionToken(token)
    return NextResponse.json({ session })
  }

  if (!isCallback) {
    const state = generateState()
    const scopes = ['identify', 'email']
    const url = discord.createAuthorizationURL(state, null, scopes)
    nextCookies.set('oauth_state', state)
    return NextResponse.redirect(new URL(url, nextUrl))
  }

  try {
    const code = nextUrl.searchParams.get('code') ?? ''
    const state = nextUrl.searchParams.get('state') ?? ''
    const storedState = nextCookies.get('oauth_state')?.value ?? ''

    if (!code || state !== storedState) throw new Error('Invalid code or state')

    const validateCode = await discord.validateAuthorizationCode(code, null)

    const res = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${validateCode.accessToken()}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch user data from ${reqType}`)

    const discordUser = (await res.json()) as {
      id: string
      email: string
      username: string
      avatar: string
    }

    const user = await createUser({
      id: discordUser.id,
      provider: 'discord',
      email: discordUser.email,
      name: discordUser.username,
      image: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
    })

    const { token, expiresAt } = await createSession(user.id)
    nextCookies.set('auth_token', token, {
      httpOnly: true,
      path: '/',
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    })
    ;(await cookies()).delete('oauth_state')

    return NextResponse.redirect(new URL('/', nextUrl))
  } catch (e) {
    if (e instanceof OAuth2RequestError)
      return NextResponse.json({ error: e.message }, { status: Number(e.code) })
    else if (e instanceof Error)
      return NextResponse.json({ message: e.message }, { status: 500 })
    else return NextResponse.json({ message: 'Unknown error' }, { status: 500 })
  }
}

const createUser = async (params: {
  id: string
  provider: string
  email: string
  name: string
  image: string
}) => {
  const { id, provider, email, name, image } = params

  const existingAccount = await db.account.findUnique({
    where: { provider_providerId: { provider, providerId: id } },
  })

  if (existingAccount) {
    const user = await db.user.findUnique({ where: { id: existingAccount.userId } })
    if (!user) throw new Error(`Failed to sign in with ${provider}`)
    return user
  }

  const accountData = {
    provider,
    providerId: id,
    providerName: name,
  }
  return await db.user.upsert({
    where: { email },
    update: { accounts: { create: accountData } },
    create: {
      email,
      name,
      image,
      accounts: { create: accountData },
    },
  })
}

export { handler as GET }
