'use client'

import { useLoop, useReducedMotion, useInView } from './useLoop'
import { Sparkle } from './Sparkle'
import { Tag } from './Tag'
import { CheckMark } from './CheckMark'

const DEMO_URL = 'smittenkitchen.com/lemony-shrimp-linguine'

export function DemoSaveRecipe() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const step = useLoop(DEMO_URL.length + 6, 90, 2400, reduced || !inView)
  const displayStep = reduced ? DEMO_URL.length + 6 : step
  const typed = DEMO_URL.slice(0, Math.min(displayStep, DEMO_URL.length))
  const phase = displayStep < DEMO_URL.length ? 'typing' : displayStep < DEMO_URL.length + 3 ? 'reading' : 'saved'

  return (
    <div ref={ref} className="p-[18px] flex flex-col gap-3 min-h-[176px]">
      <div className="flex items-center gap-2 rounded-[9px] border-[1.5px] border-[#E5DED4] bg-white px-3 py-2.5 font-mono text-[11.5px] text-[#5B564C]">
        <span className="text-teal">🔗</span>
        <span className="whitespace-nowrap overflow-hidden">{typed}</span>
        {phase === 'typing' && <span className="we-blink w-[1.5px] h-[13px] bg-teal" />}
      </div>
      {phase === 'reading' && (
        <div className="we-fade-in-fast flex items-center gap-2 font-sans text-xs" style={{ color: 'var(--color-teal-dark)' }}>
          <Sparkle size={13} /> Reading the recipe…
        </div>
      )}
      {phase === 'saved' && (
        <div
          className="we-rise bg-white rounded-[10px] px-3.5 py-3 flex flex-col gap-2"
          style={{ borderTop: '2px solid var(--color-teal)', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <span className="font-serif text-base text-ink">Lemony shrimp linguine</span>
          <div className="flex gap-1.5 flex-wrap items-center">
            <Tag kind="noDairy" size={9} />
            <Tag kind="freeze" size={9} />
            <span className="font-sans text-[10px] text-teal">8 ingredients · 5 steps</span>
          </div>
          <div className="flex items-center gap-1.5 font-sans text-[11px]" style={{ color: 'var(--color-teal-dark)' }}>
            <CheckMark size={13} /> Saved to your meals
          </div>
        </div>
      )}
    </div>
  )
}
