import { sendMagicLink } from '@/app/actions/auth'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; email?: string }>
}) {
  const { error, sent, email } = await searchParams

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 400, color: '#1A1A1A' }}>
            WeeklyEats
          </h1>
          <div className="card p-6">
            <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#007A7A' }}>Check your email</p>
            <p className="mt-2" style={{ fontSize: '0.9375rem', color: '#1A1A1A' }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 400, color: '#1A1A1A' }}>
            WeeklyEats
          </h1>
          <p className="mt-2" style={{ fontSize: '0.9375rem', color: '#475569' }}>
            Enter your email to sign in or sign up
          </p>
        </div>

        {error && (
          <div className="rounded-lg p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA', fontSize: '0.9375rem', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <div className="card p-6">
          <form action={sendMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="label block mb-2">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Send magic link
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
