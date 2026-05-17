'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getTagClass, getTagLabel } from '@/lib/tags'
import { MealCard, type Meal } from '@/components/MealCard'
import { EditMealLink } from '@/components/EditMealLink'
import { copyMealToCollection } from '@/app/actions/meals'

type Props = {
  meals: Meal[]
  mode: 'mine' | 'community'
  /** Used in community mode to render "Yours" vs the + copy button. */
  currentUserId: string
}

/**
 * Tag-filter shell around a list of MealCards.
 *
 * Behavior:
 *   - All tags present in `meals` are shown as togglable pills at the top,
 *     sorted by frequency (most-used first).
 *   - Multi-select with AND semantics: a meal must carry every selected tag
 *     to remain in the list.
 *   - Client-side only — no URL state, no server roundtrip.
 *
 * The action rendered on each card depends on `mode`:
 *   - 'mine'      → EditMealLink + the Calculate Macros button
 *   - 'community' → the copy-to-collection form, or a "Yours" label
 */
export function MealsList({ meals, mode, currentUserId }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Frequency-sorted tag list derived from the meals we were given. Recomputed
  // when the parent re-fetches and hands us a new array (rare — server fetches
  // happen on page nav).
  const tagFreq = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of meals) {
      for (const t of m.tags ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [meals])

  const filtered = useMemo(() => {
    if (selected.size === 0) return meals
    return meals.filter(m => {
      const ts = new Set(m.tags ?? [])
      // AND: every selected tag must be present.
      for (const need of selected) {
        if (!ts.has(need)) return false
      }
      return true
    })
  }, [meals, selected])

  function toggle(tag: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: '#94A3B8' }}>
        {mode === 'mine' ? (
          <>
            <p style={{ fontSize: '1rem' }}>No meals yet.</p>
            <Link href="/meals/new" className="btn-primary inline-flex mt-4" style={{ fontSize: '0.875rem', padding: '8px 20px' }}>
              Add your first meal
            </Link>
          </>
        ) : (
          <p style={{ fontSize: '1rem' }}>No public meals from the community yet.</p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-4">
      {/* Tag filter pills */}
      {tagFreq.length > 0 && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ background: '#fff', border: '1px solid #E2E8F0' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="label" style={{ margin: 0 }}>Filter by tags</p>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                style={{
                  fontSize: '0.8125rem',
                  color: '#00A6A6',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  // Negative margin trick: padded out to a tappable size on touch,
                  // but visually the text still aligns with the label on the left.
                  padding: '8px 4px',
                  margin: '-8px -4px',
                }}
              >
                Clear ({selected.size})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tagFreq.map(([tag, count]) => {
              const isOn = selected.has(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={getTagClass(tag)}
                  style={{
                    cursor: 'pointer',
                    border: isOn ? '2px solid #1A1A1A' : '2px solid transparent',
                    opacity: selected.size > 0 && !isOn ? 0.55 : 1,
                    fontWeight: isOn ? 600 : 500,
                    // Roomier pills: comfortable to tap on phone, still compact
                    // on desktop. Inner padding shrinks by 1px when selected so
                    // the 2px border doesn't push neighbors around.
                    padding: isOn ? '7px 12px' : '8px 13px',
                    fontSize: '0.8125rem',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  aria-pressed={isOn}
                >
                  {isOn ? '✓ ' : ''}{getTagLabel(tag)}
                  <span style={{ opacity: 0.65, marginLeft: '4px' }}>({count})</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Result count when filtering */}
      {selected.size > 0 && (
        <p className="mb-2" style={{ fontSize: '0.8125rem', color: '#64748B' }}>
          Showing <strong>{filtered.length}</strong> of {meals.length}
        </p>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10" style={{ color: '#94A3B8', fontSize: '0.9375rem' }}>
            No meals match all selected tags.
          </div>
        ) : (
          filtered.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              canCalculateMacros={mode === 'mine'}
              action={
                mode === 'mine' ? (
                  <EditMealLink mealId={meal.id} />
                ) : meal.user_id !== currentUserId ? (
                  <form action={copyMealToCollection}>
                    <input type="hidden" name="meal_id" value={meal.id} />
                    <button
                      type="submit"
                      title="Add to my collection"
                      aria-label="Add to my collection"
                      // .meal-action-btn: 44px on mobile, 32px on desktop —
                      // same sizing as the EditMealLink icon button.
                      className="meal-action-btn"
                      style={{
                        borderRadius: '50%',
                        background: '#E0F5F5',
                        color: '#00A6A6',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      +
                    </button>
                  </form>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', padding: '6px 0' }}>Yours</span>
                )
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
