import { Wordmark } from './Wordmark'
import { Tag } from './Tag'

const INGREDIENTS = [
  'Arborio rice — 1½ cups',
  'Cremini mushrooms — 10 oz',
  'Leeks — 2 medium',
  'Vegetable stock — 5 cups, warm',
  'White wine — ½ cup',
  'Parmesan — ½ cup, grated',
  'Butter — 3 tbsp',
  'Lemon, zested',
]

const STEPS = [
  'Sweat sliced leeks in butter over low heat until soft, 8 min.',
  'Add mushrooms; cook until they release their water and brown.',
  'Stir in rice, toast 1 minute, then deglaze with wine.',
  'Add warm stock one ladle at a time, stirring, until rice is creamy.',
  'Finish with parmesan, butter, lemon zest. Season and serve.',
]

export function RecipeDetailScreen({ width = 380 }: { width?: number }) {
  const s = width / 380
  return (
    <div style={{ padding: `${10 * s}px ${18 * s}px`, display: 'flex', flexDirection: 'column', gap: 8 * s }}>
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
      <div className="font-sans" style={{ fontSize: 10 * s, color: 'var(--color-teal)', marginTop: 4 * s }}>
        ‹ All meals
      </div>
      <h2 className="font-serif text-ink" style={{ fontSize: 22 * s, fontWeight: 400, margin: `${4 * s}px 0 ${6 * s}px`, lineHeight: 1.1 }}>
        Mushroom & leek risotto
      </h2>
      <div className="flex flex-wrap items-center" style={{ gap: 6 * s }}>
        <Tag kind="vegetarian" size={8 * s} />
        <Tag kind="glutenFree" size={8 * s} />
        <span className="font-sans" style={{ fontSize: 9 * s, color: 'var(--color-teal)' }}>
          nytimes.com
        </span>
      </div>
      <div
        className="bg-white flex flex-col"
        style={{
          borderRadius: 10 * s,
          borderTop: `${2 * s}px solid var(--color-teal)`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
          padding: `${10 * s}px ${12 * s}px`,
          gap: 12 * s,
          marginTop: 4 * s,
        }}
      >
        <div>
          <div
            className="font-sans font-semibold uppercase"
            style={{ fontSize: 9 * s, color: '#475569', letterSpacing: '0.06em', marginBottom: 6 * s }}
          >
            Ingredients
          </div>
          <div className="flex flex-col" style={{ gap: 3 * s }}>
            {INGREDIENTS.map((line, i) => (
              <div key={i} className="flex items-baseline font-sans text-ink" style={{ gap: 6 * s, fontSize: 10 * s }}>
                <span style={{ color: 'var(--color-teal)' }}>·</span>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div
            className="font-sans font-semibold uppercase"
            style={{ fontSize: 9 * s, color: '#475569', letterSpacing: '0.06em', marginBottom: 6 * s }}
          >
            Instructions
          </div>
          <div className="flex flex-col" style={{ gap: 6 * s }}>
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start font-sans text-ink" style={{ gap: 8 * s, fontSize: 10 * s, lineHeight: 1.35 }}>
                <span
                  className="flex items-center justify-center flex-shrink-0 font-semibold"
                  style={{
                    background: 'var(--color-teal-light)',
                    color: 'var(--color-teal-dark)',
                    fontSize: 8 * s,
                    borderRadius: '50%',
                    width: 16 * s,
                    height: 16 * s,
                    marginTop: 1 * s,
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        className="font-sans font-semibold"
        style={{
          background: 'var(--color-amber)',
          color: 'var(--color-ink)',
          border: 'none',
          fontSize: 11 * s,
          padding: `${10 * s}px ${14 * s}px`,
          borderRadius: 8 * s,
          marginTop: 4 * s,
        }}
      >
        ✦ Add to this week
      </button>
    </div>
  )
}
