import Link from 'next/link'
import { logout } from '@/app/actions/auth'

type Props = {
  email: string
  active?: 'planner' | 'meals' | 'grocery'
}

export function AppHeader({ email, active }: Props) {
  return (
    <header className="bg-white border-b px-6 py-0 flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
      <div className="flex items-center gap-8">
        <Link href="/dashboard" style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 400, color: '#1A1A1A', textDecoration: 'none' }}>
          WeeklyEats
        </Link>
        <nav className="flex">
          <Link
            href="/dashboard"
            className="px-1 py-4 mr-6 text-sm font-medium border-b-2 transition-colors"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: active === 'planner' ? '#00A6A6' : '#64748B',
              borderBottomColor: active === 'planner' ? '#00A6A6' : 'transparent',
              textDecoration: 'none',
            }}
          >
            Planner
          </Link>
          <Link
            href="/meals"
            className="px-1 py-4 mr-6 border-b-2 transition-colors"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: active === 'meals' ? '#00A6A6' : '#64748B',
              borderBottomColor: active === 'meals' ? '#00A6A6' : 'transparent',
              textDecoration: 'none',
            }}
          >
            Meals
          </Link>
          <Link
            href="/grocery"
            className="px-1 py-4 border-b-2 transition-colors"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: active === 'grocery' ? '#00A6A6' : '#64748B',
              borderBottomColor: active === 'grocery' ? '#00A6A6' : 'transparent',
              textDecoration: 'none',
            }}
          >
            Grocery
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <span style={{ fontSize: '0.875rem', color: '#94A3B8' }}>{email}</span>
        <form action={logout}>
          <button type="submit" className="btn-ghost" style={{ padding: '6px 14px', fontSize: '0.875rem' }}>
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
