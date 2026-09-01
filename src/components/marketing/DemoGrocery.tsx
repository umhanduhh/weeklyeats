'use client'

import { useLoop, useReducedMotion, useInView } from './useLoop'

const DEMO_ITEMS = [
  { t: 'Lemons (3)', aisle: 'Produce' },
  { t: 'Cremini mushrooms', aisle: 'Produce' },
  { t: 'Cilantro, 1 bunch', aisle: 'Produce' },
  { t: 'Salmon fillets, 1½ lb', aisle: 'Protein' },
  { t: 'Chicken thighs, 2 lb', aisle: 'Protein' },
  { t: 'Arborio rice', aisle: 'Pantry' },
]

export function DemoGrocery() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const step = useLoop(DEMO_ITEMS.length, 520, 2200, reduced || !inView)
  const displayStep = reduced ? DEMO_ITEMS.length : step

  return (
    <div ref={ref} className="p-[18px] flex flex-col gap-2.5 min-h-[176px]">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-[5px] bg-[#EFEAE2] rounded-full overflow-hidden">
          <div
            className="h-full bg-teal transition-[width] duration-[400ms] ease-out"
            style={{ width: `${(displayStep / DEMO_ITEMS.length) * 100}%` }}
          />
        </div>
        <span className="font-sans text-[11px] text-[#8A8578]">
          {displayStep}/{DEMO_ITEMS.length}
        </span>
      </div>
      <div className="flex flex-col gap-[3px]">
        {DEMO_ITEMS.map((it, i) => {
          const done = displayStep > i
          const newAisle = i === 0 || DEMO_ITEMS[i - 1].aisle !== it.aisle
          return (
            <div key={it.t}>
              {newAisle && (
                <div
                  className="font-sans text-[9px] font-semibold text-[#8A8578] uppercase tracking-[0.08em] mb-0.5"
                  style={{ marginTop: i ? 8 : 2 }}
                >
                  {it.aisle}
                </div>
              )}
              <div className="flex items-center gap-2.5 py-[3px]">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold transition-colors duration-200"
                  style={{ border: '1.8px solid var(--color-teal)', background: done ? 'var(--color-teal)' : '#fff' }}
                >
                  {done ? '✓' : ''}
                </span>
                <span
                  className="font-sans text-[12.5px] text-ink transition-opacity duration-300"
                  style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.4 : 1 }}
                >
                  {it.t}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
