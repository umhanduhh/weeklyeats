import Link from 'next/link'
import { logout } from '@/app/actions/auth'

type Props = {
  email: string
  active?: 'planner' | 'meals' | 'grocery'
}

type TabKey = NonNullable<Props['active']>

const TABS: Array<{ key: TabKey; href: string; label: string; icon: string }> = [
  { key: 'planner', href: '/dashboard', label: 'Planner', icon: '📅' },
  { key: 'meals',   href: '/meals',     label: 'Meals',   icon: '🍽' },
  { key: 'grocery', href: '/grocery',   label: 'Grocery', icon: '🛒' },
]

/**
 * App chrome. Renders two layouts from one component:
 *
 *  - <md  → top bar with brand + sign-out, plus a fixed bottom tab bar.
 *           Hits the "feels like a native app" expectation: thumb-reachable
 *           nav at the bottom, lightweight identity row at the top.
 *  - ≥md  → classic top bar with brand, inline nav, email + sign-out.
 *
 * Page body padding-bottom is set globally in globals.css via --mobile-nav-h
 * so content never hides behind the tab bar.
 */
export function AppHeader({ email, active }: Props) {
  return (
    <>
      {/* ── Top bar (always visible, but content differs by breakpoint) ─── */}
      <header
        className="bg-white border-b sticky top-0 z-30"
        style={{
          borderColor: '#E2E8F0',
          paddingTop: 'var(--safe-top)',
        }}
      >
        {/* Mobile: brand + sign-out only. Nav lives at the bottom. */}
        <div className="flex md:hidden items-center justify-between px-4 py-2.5">
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.125rem',
              color: '#1A1A1A',
              textDecoration: 'none',
            }}
          >
            WeeklyEats
          </Link>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '0.8125rem',
                padding: '8px',
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '44px',
              }}
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Desktop: full top nav with inline tabs + email + sign-out. */}
        <div className="hidden md:flex items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 400,
                color: '#1A1A1A',
                textDecoration: 'none',
              }}
            >
              WeeklyEats
            </Link>
            <nav className="flex">
              {TABS.map(tab => {
                const isActive = active === tab.key
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className="px-1 py-4 mr-6 border-b-2 transition-colors"
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: isActive ? '#00A6A6' : '#64748B',
                      borderBottomColor: isActive ? '#00A6A6' : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span style={{ fontSize: '0.875rem', color: '#94A3B8' }}>{email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="btn-ghost"
                style={{ padding: '6px 14px', fontSize: '0.875rem', minHeight: 0 }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Bottom tab bar (mobile only) ──────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 md:hidden z-30 flex bg-white border-t"
        style={{
          borderColor: '#E2E8F0',
          // Safe-area inset keeps the row's labels above the home indicator.
          paddingBottom: 'var(--safe-bottom)',
          // backdrop-blur makes the tab bar feel like an iOS tab bar even when
          // page content scrolls behind it. Falls back to plain white.
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        aria-label="Primary"
      >
        {TABS.map(tab => {
          const isActive = active === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{
                // Total tab-bar height (--mobile-nav-h: 64px) minus a touch of
                // breathing room above the label. Stays a comfortable 44px+ tap zone.
                height: 'var(--mobile-nav-h)',
                color: isActive ? '#00A6A6' : '#64748B',
                textDecoration: 'none',
                fontSize: '0.6875rem',
                fontWeight: isActive ? 600 : 500,
                position: 'relative',
              }}
            >
              {/* Active indicator — small teal dot above the icon, native-feeling */}
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 4,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#00A6A6',
                  }}
                />
              )}
              <span aria-hidden style={{ fontSize: '1.25rem', lineHeight: 1 }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
