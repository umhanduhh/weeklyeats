import { Wordmark } from './Wordmark'

export function MarketingHeader() {
  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-[8px]"
      style={{ background: 'rgba(245,240,232,0.9)', borderColor: '#EAE3D8' }}
    >
      <div className="max-w-[1120px] mx-auto px-8 py-4 flex items-center justify-between">
        <Wordmark size={22} />
        <div className="flex items-center gap-5">
          <a href="#how" className="hidden md:inline font-sans text-sm" style={{ color: '#5B564C' }}>
            How it works
          </a>
          <a href="#inside" className="hidden md:inline font-sans text-sm" style={{ color: '#5B564C' }}>
            Inside the app
          </a>
          <a
            href="#start"
            className="font-sans text-sm font-semibold text-white no-underline rounded-full px-[18px] py-[9px]"
            style={{ background: 'var(--color-ink)' }}
          >
            Sign in
          </a>
        </div>
      </div>
    </header>
  )
}
