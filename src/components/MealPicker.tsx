'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { getTagClass, getTagLabel } from '@/lib/tags'

export type MealOption = {
  id: string
  title: string
  tags: string[] | null
  source_url: string | null
}

type Props = {
  myMeals: MealOption[]
  communityMeals: MealOption[]
  slotLabel: string
  onSelect: (mealId: string | null, note: string | null) => void
  onClose: () => void
}

const PRESETS = [
  { note: 'Eating Out', icon: '🍽' },
  { note: 'Skip',       icon: '—' },
]

export function MealPicker({ myMeals, communityMeals, slotLabel, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'mine' | 'all'>('mine')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
    // Trap scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const pool = source === 'mine' ? myMeals : [...myMeals, ...communityMeals]

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pool
      .filter(m => !q || m.title.toLowerCase().includes(q))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [pool, query])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(26,26,26,0.4)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '560px',
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          borderTop: '3px solid #00A6A6',
          // 85dvh on browsers that report it (iOS 15.4+, Android) — adjusts when
          // the soft keyboard opens so the input stays visible. Older browsers
          // fall through to 80vh.
          height: 'min(85dvh, 85vh)',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + header */}
        <div style={{ padding: '12px 20px 12px' }}>
          {/* Drag-handle pill — purely decorative on web; signals "this is a
              sheet you can dismiss" the way iOS does. */}
          <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.125rem', color: '#1A1A1A', margin: 0 }}>
              {slotLabel}
            </p>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#94A3B8',
                cursor: 'pointer',
                lineHeight: 1,
                width: '44px',
                height: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                margin: '-8px -8px -8px 0',
              }}
            >×</button>
          </div>

          {/* Search */}
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search meals…"
            className="input"
            style={{ marginBottom: '10px' }}
          />

          {/* Source toggle */}
          <div className="flex gap-2 flex-wrap">
            {(['mine', 'all'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSource(s)}
                style={{
                  padding: '8px 14px',
                  minHeight: '36px',
                  borderRadius: '20px',
                  border: '1.5px solid',
                  borderColor: source === s ? '#00A6A6' : '#E2E8F0',
                  background: source === s ? '#E0F5F5' : '#fff',
                  color: source === s ? '#007A7A' : '#64748B',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {s === 'mine' ? 'My Meals' : 'My Meals + Community'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable list. paddingBottom clears the iOS home indicator on
            devices that report a safe-area inset. */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '0 20px',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            WebkitOverflowScrolling: 'touch',
          }}
        >

          {/* Preset options */}
          {!query && (
            <div style={{ marginBottom: '12px' }}>
              <p className="label" style={{ marginBottom: '8px' }}>Quick options</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {PRESETS.map(({ note, icon }) => (
                  <button
                    key={note}
                    onClick={() => onSelect(null, note)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1.5px solid #E2E8F0',
                      background: '#F8FAFB',
                      color: '#1A1A1A',
                      fontSize: '0.9375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{icon}</span> {note}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meal results */}
          {results.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '0.9375rem', textAlign: 'center', paddingTop: '24px' }}>
              No meals found
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {!query && <p className="label" style={{ marginBottom: '4px' }}>Meals</p>}
              {results.map(meal => (
                <button
                  key={meal.id}
                  onClick={() => onSelect(meal.id, null)}
                  // Hover affordance via CSS (.meal-picker-row) instead of
                  // onMouseEnter — touch devices don't fire mouseenter, so the
                  // inline approach was invisible on phone.
                  className="meal-picker-row"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    minHeight: '52px',
                    borderRadius: '10px',
                    border: '1px solid #F1F5F9',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                >
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.9375rem', color: '#1A1A1A' }}>
                    {meal.title}
                  </span>
                  {meal.tags && meal.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {meal.tags.map(tag => (
                        <span key={tag} className={getTagClass(tag)} style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>
                          {getTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
