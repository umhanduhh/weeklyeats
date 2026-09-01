import { Wordmark } from './Wordmark'
import { MagicLinkForm } from './MagicLinkForm'

export function Closer() {
  return (
    <section style={{ background: 'var(--color-ink)' }}>
      <div className="max-w-[1120px] mx-auto px-8 py-20 flex flex-col gap-10 md:grid md:items-center md:gap-14" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
        <div>
          <h2
            className="font-serif text-white mb-4 text-[32px] leading-[1.1] -tracking-[0.8px] md:text-[46px] md:leading-[1.08] md:-tracking-[1.2px]"
            style={{ fontWeight: 400, textWrap: 'balance' }}
          >
            Plan this Sunday. Eat well all week.
          </h2>
          <p className="font-sans text-[16.5px] leading-[1.55] max-w-[420px] m-0" style={{ color: 'rgba(255,255,255,0.68)' }}>
            Enter your email and you&apos;ll be in your planner in a few seconds — nothing to install, nothing to set
            up first.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-7" style={{ borderTop: '3px solid var(--color-teal)' }}>
          <div className="font-serif text-xl text-ink mb-4">Sign in or sign up</div>
          <MagicLinkForm size="sm" />
        </div>
      </div>
      <div
        className="max-w-[1120px] mx-auto px-8 pb-10 flex items-center justify-between flex-wrap gap-4 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.12)', paddingTop: '26px' }}
      >
        <Wordmark size={18} dark />
        <span className="font-sans text-[12.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          © 2026 WeeklyEats
        </span>
      </div>
    </section>
  )
}
