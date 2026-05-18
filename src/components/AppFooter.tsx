/**
 * Site-wide footer rendered once in layout.tsx (so every route gets it for
 * free, including /login). Sits in the document body's normal flow after
 * the page's `min-h-screen` wrapper — so on a viewport-height page the user
 * scrolls a bit to find it, which is what footers are supposed to do.
 *
 * Visually subtle on purpose: it's an attribution, not a CTA.
 */
export function AppFooter() {
  return (
    <footer
      className="text-center"
      style={{
        // Comfortable breathing room above; safe-area inset on the bottom
        // so it clears the iOS home indicator on routes where the mobile
        // tab bar isn't rendered (e.g. /login).
        padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px))',
        fontSize: '0.75rem',
        color: '#94A3B8',
        // Matches body bg (#F8FAFB) so there's no visible seam between page
        // content and footer on the routes that share that background.
        background: '#F8FAFB',
      }}
    >
      cooked up by{' '}
      <a
        href="https://amandaa.me"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#00A6A6',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        amandaa.me
      </a>
    </footer>
  )
}
