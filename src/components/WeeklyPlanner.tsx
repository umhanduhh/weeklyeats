'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MealPicker, type MealOption } from '@/components/MealPicker'
import { assignMealToSlot, setSlotNote, clearSlot, generateWeek, setSlotConstraints } from '@/app/actions/planner'
import { getTagClass, getTagLabel, PRESET_TAGS } from '@/lib/tags'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Meal = { id: string; title: string; tags: string[] | null; source_url: string | null }

type Slot = {
  id: string
  day_of_week: number
  meal_type: string
  meal_id: string | null
  note: string | null
  constraint_tags: string[]
  meals: Meal | null
}

type Props = {
  planId: string
  initialSlots: Slot[]
  weekStartDate: string
  weekOffset: number
  myMeals: MealOption[]
  communityMeals: MealOption[]
}

function formatWeekRange(weekStartDate: string) {
  const start = new Date(weekStartDate + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

function isCurrentWeek(weekStartDate: string) {
  const now = new Date()
  const day = now.getDay()
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + daysToMonday)
  return monday.toISOString().split('T')[0] === weekStartDate
}

// Inline constraint picker — multi-select
function ConstraintPicker({ slot, onSet }: { slot: Slot; onSet: (tags: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = slot.constraint_tags ?? []
  const hasConstraints = current.length > 0

  function toggle(value: string) {
    const next = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value]
    onSet(next)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        // Was 2x10 padding at 11px font — basically untappable on phone. Bumped
        // to a real pill shape; whitespace-nowrap is kept so a long set of
        // constraint labels can scroll horizontally rather than wrap.
        style={{
          background: hasConstraints ? '#E0F5F5' : 'none',
          border: hasConstraints ? '1px solid #00A6A6' : '1px dashed #CBD5E1',
          borderRadius: '20px',
          padding: '6px 12px',
          minHeight: '32px',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: hasConstraints ? '#007A7A' : '#94A3B8',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 150ms',
        }}
      >
        {hasConstraints
          ? `✦ ${current.map(getTagLabel).join(', ')}`
          : '+ constraint'}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          padding: '8px',
          zIndex: 40,
          minWidth: '180px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <p style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px 6px' }}>
            Constraints
          </p>
          {PRESET_TAGS.map(({ value, label, className }) => {
            const selected = current.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggle(value)}
                style={{
                  textAlign: 'left',
                  background: selected ? '#E0F5F5' : 'none',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 8px',
                  minHeight: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span className={className} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>{label}</span>
                {selected && <span style={{ color: '#00A6A6', fontSize: '0.8125rem', marginLeft: 'auto' }}>✓</span>}
              </button>
            )
          })}
          {hasConstraints && (
            <>
              <div style={{ borderTop: '1px solid #F1F5F9', margin: '4px 0' }} />
              <button
                onClick={() => { onSet([]); setOpen(false) }}
                style={{
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 8px',
                  minHeight: '40px',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  color: '#94A3B8',
                }}
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function WeeklyPlanner({ planId, initialSlots, weekStartDate, weekOffset, myMeals, communityMeals }: Props) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)
  const [isPending, startTransition] = useTransition()

  function getSlot(day: number, type: string) {
    return slots.find(s => s.day_of_week === day && s.meal_type === type) ?? null
  }

  function patchSlot(id: string, patch: Partial<Slot>) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  function handleSelect(mealId: string | null, note: string | null) {
    if (!activeSlot) return
    const slotId = activeSlot.id
    setActiveSlot(null)

    if (note) {
      patchSlot(slotId, { note, meal_id: null, meals: null })
      startTransition(() => setSlotNote(slotId, note))
    } else if (mealId) {
      const meal = [...myMeals, ...communityMeals].find(m => m.id === mealId) ?? null
      patchSlot(slotId, { meal_id: mealId, note: null, meals: meal })
      startTransition(() => assignMealToSlot(slotId, mealId))
    }
  }

  function handleClear(slotId: string) {
    patchSlot(slotId, { meal_id: null, note: null, meals: null })
    startTransition(() => clearSlot(slotId))
  }

  function handleConstraint(slotId: string, tags: string[]) {
    patchSlot(slotId, { constraint_tags: tags })
    startTransition(() => setSlotConstraints(slotId, tags))
  }

  function handleGenerate() {
    startTransition(async () => {
      await generateWeek(planId)
      window.location.reload()
    })
  }

  const weekLabel = isCurrentWeek(weekStartDate) ? 'This week' : formatWeekRange(weekStartDate)

  return (
    <div>
      {/* Header row — wraps on mobile so the action buttons drop to their own
          line under the week navigator instead of overflowing. */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href={`/dashboard?week=${weekOffset - 1}`}
            aria-label="Previous week"
            style={{
              color: '#00A6A6',
              fontSize: '1.5rem',
              textDecoration: 'none',
              lineHeight: 1,
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >‹</a>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: '#1A1A1A', margin: 0 }}>
              {weekLabel}
            </h2>
            {!isCurrentWeek(weekStartDate) && (
              <a href="/dashboard" style={{ fontSize: '0.8125rem', color: '#00A6A6', textDecoration: 'none' }}>
                ← Back to current week
              </a>
            )}
          </div>
          <a
            href={`/dashboard?week=${weekOffset + 1}`}
            aria-label="Next week"
            style={{
              color: '#00A6A6',
              fontSize: '1.5rem',
              textDecoration: 'none',
              lineHeight: 1,
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >›</a>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <a
            href={`/grocery?week=${weekOffset}`}
            className="btn-ghost flex-1 md:flex-initial"
            style={{ fontSize: '0.875rem', textDecoration: 'none' }}
          >
            🛒 Grocery list
          </a>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="btn-accent flex-1 md:flex-initial"
            style={{ fontSize: '0.9375rem', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Generating…' : '✦ Generate week'}
          </button>
        </div>
      </div>

      {/* Day cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {DAYS.map((dayLabel, dayIndex) => {
          const dinnerSlot = getSlot(dayIndex, 'dinner')
          const otherSlot = getSlot(dayIndex, 'other')

          const slotDate = new Date(weekStartDate + 'T00:00:00')
          slotDate.setDate(slotDate.getDate() + dayIndex)
          const isToday = slotDate.toDateString() === new Date().toDateString()

          return (
            <div key={dayIndex} className="card" style={{ overflow: 'visible' }}>
              {/* Day header */}
              <div style={{
                padding: '10px 16px 8px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span className="day-pill" style={{ opacity: isToday ? 1 : 0.6 }}>
                  {dayLabel}
                </span>
                {isToday && (
                  <span style={{ fontSize: '0.75rem', color: '#00A6A6', fontWeight: 500 }}>Today</span>
                )}
              </div>

              {/* Slots */}
              <div style={{ padding: '8px 0' }}>
                {[dinnerSlot, otherSlot].map(slot => {
                  if (!slot) return null
                  const isDinner = slot.meal_type === 'dinner'
                  const typeLabel = isDinner ? 'Dinner' : 'Other'

                  return (
                    <div
                      key={slot.id}
                      // flex-wrap: allow the constraint pill to drop to a second
                      // line on narrow screens instead of pushing the × clear
                      // button off-canvas. minHeight stays consistent for
                      // empty/filled visual balance.
                      style={{
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                        minHeight: '48px',
                      }}
                    >
                      <span className="label" style={{ width: '44px', flexShrink: 0 }}>{typeLabel}</span>

                      {/* Slot content */}
                      {slot.note ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.9375rem', color: '#64748B', fontStyle: 'italic' }}>
                            {slot.note}
                          </span>
                        </div>
                      ) : slot.meals ? (
                        // Title links to the recipe view. ?from=planner so the
                        // back link there says "← Planner" instead of "← Meals".
                        // Tags stay outside the link so a stray tap on a tag
                        // doesn't navigate — they're just decoration here.
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Link
                            href={`/meals/${slot.meals.id}?from=planner`}
                            className="meal-title-link"
                            style={{
                              fontFamily: 'Georgia, serif',
                              fontSize: '0.9375rem',
                              color: '#1A1A1A',
                              textDecoration: 'none',
                              // Generous padding for thumb reach without
                              // disrupting the surrounding row layout.
                              padding: '6px 4px',
                              margin: '-6px -4px',
                              borderRadius: '6px',
                            }}
                          >
                            {slot.meals.title}
                          </Link>
                          {slot.meals.tags?.map(tag => (
                            <span key={tag} className={getTagClass(tag)} style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>
                              {getTagLabel(tag)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveSlot(slot)}
                          // .add-items-btn (defined in globals.css) handles the
                          // teal-on-hover affordance via CSS so it doesn't rely
                          // on onMouseEnter — touch devices never hover.
                          className="add-items-btn"
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            background: 'none',
                            border: '1.5px dashed #E2E8F0',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            color: '#94A3B8',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            minHeight: '44px',
                          }}
                        >
                          + Add {typeLabel.toLowerCase()}
                        </button>
                      )}

                      {/* × clear button — always visible when slot has content.
                          Was 2px padding (≈14px hit zone). Now a 36px square. */}
                      {(slot.note || slot.meals) && (
                        <button
                          onClick={() => handleClear(slot.id)}
                          title="Clear"
                          aria-label="Clear slot"
                          style={{
                            flexShrink: 0,
                            background: 'none',
                            border: 'none',
                            color: '#CBD5E1',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            lineHeight: 1,
                            width: '36px',
                            height: '36px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >×</button>
                      )}

                      {/* Constraint picker — dinner slots only */}
                      {isDinner && (
                        <ConstraintPicker
                          slot={slot}
                          onSet={tags => handleConstraint(slot.id, tags)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Meal picker modal */}
      {activeSlot && (
        <MealPicker
          myMeals={myMeals}
          communityMeals={communityMeals}
          slotLabel={`${DAYS[activeSlot.day_of_week]} · ${activeSlot.meal_type === 'dinner' ? 'Dinner' : 'Other'}`}
          onSelect={handleSelect}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  )
}
