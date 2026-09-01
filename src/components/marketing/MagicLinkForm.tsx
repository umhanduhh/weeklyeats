'use client'

import { useActionState } from 'react'
import { sendMagicLinkInline, type MagicLinkState } from '@/app/actions/auth'
import { CheckMark } from './CheckMark'

const initialState: MagicLinkState = { status: 'idle' }

export function MagicLinkForm({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const [state, formAction, pending] = useActionState(sendMagicLinkInline, initialState)
  const big = size === 'lg'

  if (state.status === 'sent') {
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border px-5 py-4 max-w-[460px] font-sans text-sm"
        style={{ background: 'var(--color-teal-light)', borderColor: 'var(--color-teal)', color: 'var(--color-teal-dark)' }}
      >
        <CheckMark size={18} />
        Check your inbox — your sign-in link is on its way.
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 max-w-[460px] w-full">
      <div className="flex gap-2 flex-wrap">
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className={`flex-1 min-w-[200px] font-sans text-ink rounded-[10px] border-[1.5px] border-[#E0D9CE] bg-white outline-none placeholder:text-[#B5AEA2] ${
            big ? 'text-[15px] px-4 py-3.5' : 'text-sm px-3.5 py-3'
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`bg-teal text-white font-sans font-semibold rounded-[10px] whitespace-nowrap transition-[filter] hover:brightness-[1.06] disabled:opacity-70 ${
            big ? 'text-[15px] px-6 py-3.5' : 'text-sm px-5 py-3'
          }`}
        >
          {pending ? 'Sending…' : 'Send magic link'}
        </button>
      </div>
      {state.status === 'error' && (
        <span className="font-sans text-xs text-red-600">{state.error}</span>
      )}
      <span className="font-sans text-xs text-[#8A8578]">No password to remember. One tap and you&apos;re in.</span>
    </form>
  )
}
