import { Wordmark } from './Wordmark'

const AISLES = [
  {
    name: 'Produce',
    items: [
      { t: 'Lemons (3)', d: true },
      { t: 'Yellow onion (2)', d: false },
      { t: 'Garlic (1 head)', d: true },
      { t: 'Cilantro, 1 bunch', d: false },
      { t: 'Limes (4)', d: false },
      { t: 'Cremini mushrooms', d: false },
    ],
  },
  {
    name: 'Protein',
    items: [
      { t: 'Salmon fillets, 1½ lb', d: false },
      { t: 'Chicken thighs, 2 lb', d: true },
      { t: 'Pork shoulder, 3 lb', d: false },
    ],
  },
  {
    name: 'Pantry',
    items: [
      { t: 'Arborio rice', d: false },
      { t: 'Orzo, 1 box', d: false },
      { t: 'Cannellini beans (2)', d: false },
    ],
  },
]

export function GroceryScreen({ width = 380 }: { width?: number }) {
  const s = width / 380
  const total = AISLES.reduce((n, a) => n + a.items.length, 0)
  const done = AISLES.reduce((n, a) => n + a.items.filter((i) => i.d).length, 0)
  return (
    <div style={{ padding: `${10 * s}px ${18 * s}px`, display: 'flex', flexDirection: 'column', gap: 8 * s }}>
      <div
        className="flex justify-between items-center"
        style={{ padding: `${4 * s}px 0 ${10 * s}px`, borderBottom: '1px solid #E2E8F0' }}
      >
        <Wordmark size={15 * s} />
        <div className="flex font-sans font-medium" style={{ gap: 14 * s, fontSize: 11 * s, color: '#64748B' }}>
          <span>Planner</span>
          <span>Meals</span>
          <span style={{ color: 'var(--color-teal)', fontWeight: 700 }}>Grocery</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-ink m-0" style={{ fontSize: 22 * s, fontWeight: 400 }}>
          Grocery list
        </h2>
        <span className="font-sans" style={{ fontSize: 10 * s, color: '#64748B' }}>
          Mar 17 – 23
        </span>
      </div>
      <div className="flex items-center font-sans" style={{ gap: 8 * s, fontSize: 10 * s, color: '#64748B' }}>
        <div className="flex-1 overflow-hidden" style={{ height: 4 * s, background: '#E2E8F0', borderRadius: 999 }}>
          <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: 'var(--color-teal)' }} />
        </div>
        <span>
          {done}/{total}
        </span>
      </div>
      <div className="flex flex-col" style={{ gap: 10 * s, marginTop: 4 * s }}>
        {AISLES.map((a) => (
          <div
            key={a.name}
            className="bg-white"
            style={{
              borderRadius: 10 * s,
              borderTop: `${2 * s}px solid var(--color-teal)`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
              padding: `${10 * s}px ${12 * s}px`,
            }}
          >
            <div
              className="flex items-center justify-between font-sans font-semibold uppercase"
              style={{
                fontSize: 9 * s,
                color: '#475569',
                letterSpacing: '0.06em',
                paddingBottom: 6 * s,
                marginBottom: 6 * s,
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <span>{a.name}</span>
              <span>{a.items.length}</span>
            </div>
            <div className="flex flex-col" style={{ gap: 4 * s }}>
              {a.items.map((it, i) => (
                <div key={i} className="flex items-center" style={{ gap: 9 * s }}>
                  <span
                    className="flex-shrink-0 flex items-center justify-center text-white font-bold"
                    style={{
                      width: 13 * s,
                      height: 13 * s,
                      borderRadius: '50%',
                      border: `${1.8 * s}px solid var(--color-teal)`,
                      background: it.d ? 'var(--color-teal)' : '#fff',
                      fontSize: 8 * s,
                    }}
                  >
                    {it.d ? '✓' : ''}
                  </span>
                  <span
                    className="font-sans text-ink"
                    style={{ fontSize: 11 * s, textDecoration: it.d ? 'line-through' : 'none', opacity: it.d ? 0.45 : 1 }}
                  >
                    {it.t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
