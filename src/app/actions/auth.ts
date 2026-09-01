'use server'

import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function sendMagicLink(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`)
}

export type MagicLinkState = { status: 'idle' | 'sent' | 'error'; error?: string }

/**
 * Same request as sendMagicLink, but returns state instead of redirecting —
 * used by the homepage's MagicLinkForm, which shows its success panel inline
 * (via useActionState) rather than navigating to /login.
 */
export async function sendMagicLinkInline(
  _prevState: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { status: 'error', error: error.message }
  }

  return { status: 'sent' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
