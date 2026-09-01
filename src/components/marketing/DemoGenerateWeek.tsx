'use client'

import { useLoop, useReducedMotion, useInView } from './useLoop'
import { DayPill } from './DayPill'
import { Tag } from './Tag'
import { Sparkle } from './Sparkle'

const DEMO_WEEK = [
  { day: 'Mon', title: 'Tomato & white-bean soup', tag: 'vegetarian' },
  { day: 'Tue', title: 'Carnitas tacos, lime slaw', tag: 'glutenFree' },
  { day: 'Wed', title: 'Mushroom & leek risotto', tag: 'vegetarian' },
  { day: 'Thu', title: 'Sheet-pan miso chicken', tag: null },
  { day: 'Fri', title: 'Margherita pizza night', tag: null },
  { day: 'Sat', title: 'Harissa salmon, broccoli', tag: 'noDairy' },
  { day: 'Sun', title: 'Roast chicken & potatoes', tag: 'freeze' },
] as const

export function DemoGenerateWeek({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const step = useLoop(8, 380, 2600, reduced || !inView)
  const displayStep = reduced ? 8 : step
  const generating = displayStep > 0 && displayStep <= 7
  const rowH = compact ? 30 : 40

  return (
    <div ref={ref} className={`bg-white ${compact ? 'px-4 pt-3.5 pb-4' : 'px-6 pt-5 pb-6'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className={`font-serif text-ink ${compact ? 'text-base' : 'text-[21px]'}`}>This week</div>
          <div className="font-sans text-[11px] text-[#8A8578] mt-0.5">Mar 17 – 23</div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-white font-sans text-xs font-semibold px-3.5 py-2 rounded-full transition-all duration-200 ${
            displayStep === 0 ? 'scale-[1.04]' : 'scale-100'
          }`}
          style={{ background: generating ? 'var(--color-teal-dark)' : 'var(--color-teal)' }}
        >
          <Sparkle size={12} className={`text-white ${generating ? 'opacity-60' : 'opacity-100'}`} />
          {generating ? 'Filling your week…' : 'Generate week'}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {DEMO_WEEK.map((m, i) => {
          const filled = displayStep > i
          return (
            <div
              key={m.day}
              className="flex items-center gap-3 px-3 rounded-[9px] transition-all duration-300"
              style={{
                height: rowH,
                background: filled ? '#fff' : '#FBF9F5',
                border: `1px solid ${filled ? '#EFE9E0' : '#F3EFE8'}`,
                borderLeft: `3px solid ${filled ? 'var(--color-teal)' : '#EDE7DE'}`,
              }}
            >
              <DayPill day={m.day} size={compact ? 9 : 10} dim={!filled} />
              {filled ? (
                <div className="we-fade-in flex items-center gap-2 min-w-0">
                  <span
                    className={`font-serif text-ink whitespace-nowrap overflow-hidden text-ellipsis ${
                      compact ? 'text-[13px]' : 'text-[15px]'
                    }`}
                  >
                    {m.title}
                  </span>
                  {m.tag && !compact && <Tag kind={m.tag} size={9} />}
                </div>
              ) : (
                <span className="h-2 rounded-full bg-[#EFEAE2]" style={{ width: `${45 + ((i * 13) % 30)}%` }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
