import { Sparkle } from './Sparkle'
import { MagicLinkForm } from './MagicLinkForm'
import { BrowserFrame } from './BrowserFrame'
import { DemoGenerateWeek } from './DemoGenerateWeek'

export function Hero() {
  return (
    <section className="max-w-[1120px] mx-auto px-8 pt-[72px] pb-10">
      <div className="flex flex-col gap-10 md:grid md:items-center md:gap-14" style={{ gridTemplateColumns: 'minmax(340px, 1fr) minmax(420px, 1.1fr)' }}>
        <div>
          <span
            className="inline-flex items-center gap-[7px] font-sans font-semibold rounded-full px-[13px] py-[6px]"
            style={{ background: 'var(--color-amber-light)', color: '#7A5A00', fontSize: '12.5px' }}
          >
            <Sparkle size={12} className="text-orange" /> Your week, planned in a minute
          </span>
          <h1
            className="font-serif text-ink my-[22px] text-[40px] leading-[1.08] -tracking-[1px] md:text-[62px] md:leading-[1.03] md:-tracking-[1.5px]"
            style={{ fontWeight: 400, textWrap: 'balance' }}
          >
            Dinner decided
            <br />
            before Sunday ends.
          </h1>
          <p className="font-sans text-lg leading-[1.55] mb-[30px] max-w-[460px]" style={{ color: '#5B564C', textWrap: 'pretty' }}>
            WeeklyEats keeps every recipe you love in one place, fills your seven days from it, and turns the plan
            into a grocery list sorted by aisle.
          </p>
          <div id="start">
            <MagicLinkForm />
          </div>
        </div>
        <BrowserFrame>
          <DemoGenerateWeek />
        </BrowserFrame>
      </div>
    </section>
  )
}
