import { Wordmark } from './Wordmark'
import { Tag } from './Tag'

const MEALS = [
  { title: 'Mushroom & leek risotto', tags: ['vegetarian'], src: 'nytimes.com' },
  { title: 'Sheet-pan miso chicken', tags: ['glutenFree'], src: 'bonappetit.com' },
  { title: 'Slow-cooker chickpea curry', tags: ['crockpot', 'vegetarian'], src: 'serious-eats.com' },
  { title: 'Lemony shrimp linguine', tags: ['noDairy'], src: 'smittenkitchen.com' },
  { title: 'Sunday roast chicken & potatoes', tags: ['freeze'], src: 'thekitchn.com' },
  { title: 'Tomato & white-bean soup', tags: ['soup', 'vegetarian'], src: null },
]

export function MealLibraryScreen({ width = 380 }: { width?: number }) {
  const s = width / 380
  return (
    <div style={{ padding: `${10 * s}px ${18 * s}px`, display: 'flex', flexDirection: 'column', gap: 10 * s }}>
      <div
        className="flex justify-between items-center"
        style={{ padding: `${4 * s}px 0 ${10 * s}px`, borderBottom: '1px solid #E2E8F0' }}
      >
        <Wordmark size={15 * s} />
        <div className="flex font-sans font-medium" style={{ gap: 14 * s, fontSize: 11 * s, color: '#64748B' }}>
          <span>Planner</span>
          <span style={{ color: 'var(--color-teal)', fontWeight: 700 }}>Meals</span>
          <span>Grocery</span>
        </div>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 4 * s }}>
        <h2 className="font-serif text-ink m-0" style={{ fontSize: 22 * s, fontWeight: 400 }}>
          Your meals
        </h2>
        <span className="font-sans" style={{ fontSize: 10 * s, color: '#64748B' }}>
          {MEALS.length} saved
        </span>
      </div>
      <div
        className="flex items-center bg-white"
        style={{
          border: `${1.5 * s}px solid #cbd5e1`,
          borderRadius: 8 * s,
          padding: `${8 * s}px ${12 * s}px`,
          fontSize: 11 * s,
          color: '#94a3b8',
          gap: 8 * s,
        }}
      >
        <span style={{ fontSize: 12 * s }}>⌕</span>
        <span>Search meals or tags…</span>
      </div>
      <div className="flex flex-nowrap overflow-hidden" style={{ gap: 6 * s }}>
        {['vegetarian', 'crockpot', 'glutenFree', 'noDairy'].map((t) => (
          <Tag key={t} kind={t} size={8 * s} />
        ))}
      </div>
      <div className="flex flex-col" style={{ gap: 8 * s, marginTop: 2 * s }}>
        {MEALS.map((m, i) => (
          <div
            key={i}
            className="bg-white flex flex-col"
            style={{
              borderRadius: 10 * s,
              borderTop: `${2 * s}px solid var(--color-teal)`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
              padding: `${9 * s}px ${12 * s}px`,
              gap: 4 * s,
            }}
          >
            <div className="flex items-center flex-wrap" style={{ gap: 6 * s }}>
              <span style={{ color: 'var(--color-teal)', fontSize: 8 * s }}>▶</span>
              <span className="font-serif text-ink" style={{ fontSize: 12 * s }}>
                {m.title}
              </span>
              {m.tags.map((t) => (
                <Tag key={t} kind={t} size={7 * s} />
              ))}
            </div>
            {m.src && (
              <span className="font-sans" style={{ fontSize: 8 * s, color: 'var(--color-teal)' }}>
                {m.src}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
