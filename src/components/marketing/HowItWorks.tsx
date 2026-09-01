import { BrowserFrame } from './BrowserFrame'
import { DemoGenerateWeek } from './DemoGenerateWeek'
import { DemoSaveRecipe } from './DemoSaveRecipe'
import { DemoGrocery } from './DemoGrocery'

const STEPS = [
  {
    n: '01',
    t: 'Save what you actually cook',
    d: 'Paste a link from any recipe site. WeeklyEats pulls the ingredients, steps and tags into your library.',
    demo: <DemoSaveRecipe />,
  },
  {
    n: '02',
    t: 'Fill the week in one tap',
    d: 'Generate picks from your own saved meals, respecting your tags — vegetarian, crockpot, no dairy. Swap anything you like.',
    demo: (
      <BrowserFrame label="weeklyeats.app/planner" flat>
        <DemoGenerateWeek compact />
      </BrowserFrame>
    ),
  },
  {
    n: '03',
    t: 'Shop once, cook all week',
    d: 'Every ingredient from the plan, combined and grouped by aisle. Check things off as you go.',
    demo: <DemoGrocery />,
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="bg-white border-t border-b" style={{ borderColor: '#EAE3D8' }}>
      <div className="max-w-[1120px] mx-auto px-8 py-[76px]">
        <h2 className="font-serif text-ink mb-2 text-[38px] -tracking-[0.8px]" style={{ fontWeight: 400 }}>
          Three steps, once a week
        </h2>
        <p className="font-sans text-base mb-11" style={{ color: '#8A8578' }}>
          Here&apos;s the whole product, in motion.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-4">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs font-semibold text-teal">{s.n}</span>
                <h3 className="font-serif text-ink text-[22px] m-0 -tracking-[0.3px]" style={{ fontWeight: 400 }}>
                  {s.t}
                </h3>
              </div>
              <p className="font-sans text-[14.5px] leading-[1.55] m-0" style={{ color: '#5B564C', textWrap: 'pretty' }}>
                {s.d}
              </p>
              <div
                className="rounded-xl overflow-hidden border mt-auto"
                style={{ background: 'var(--color-parchment)', borderColor: '#EFE9E0' }}
              >
                {s.demo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
