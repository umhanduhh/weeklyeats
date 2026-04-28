'use client'

import { useState } from 'react'
import { getTagClass, getTagLabel } from '@/lib/tags'

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

type Ingredient = { text: string } | { name?: string; quantity?: string; unit?: string; text?: string }

export type Meal = {
  id: string
  user_id?: string
  title: string
  source_url: string | null
  tags: string[] | null
  ingredients: Ingredient[] | null
  instructions: string | null
  notes?: string | null
}

type Props = {
  meal: Meal
  action?: React.ReactNode
}

function formatIngredients(ingredients: Ingredient[]): string[] {
  return ingredients.map(i => {
    if ('text' in i && i.text) return i.text
    if ('name' in i) {
      const parts = [i.quantity, i.unit, i.name].filter(Boolean)
      return parts.join(' ')
    }
    return ''
  }).filter(Boolean)
}

function formatInstructions(instructions: string): string[] {
  return instructions
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
}

export function MealCard({ meal, action }: Props) {
  const [open, setOpen] = useState(false)

  const hasContent = (meal.ingredients && meal.ingredients.length > 0) || meal.instructions || meal.notes

  return (
    <div className="card overflow-hidden">
      {/* Header row — always visible */}
      <div
        className="px-4 py-3 flex items-start gap-3"
        onClick={() => hasContent && setOpen(o => !o)}
        style={{ cursor: hasContent ? 'pointer' : 'default' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {hasContent && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: '#00A6A6',
                  transition: 'transform 200ms',
                  transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                  lineHeight: 1,
                  marginRight: '2px',
                }}
              >
                ▶
              </span>
            )}
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: '#1A1A1A', fontWeight: 400 }}>
              {meal.title}
            </span>
            {meal.tags?.map(tag => (
              <span key={tag} className={getTagClass(tag)}>
                {getTagLabel(tag)}
              </span>
            ))}
          </div>
          {meal.source_url && (
            <a
              href={meal.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="hover:underline mt-0.5 inline-block"
              style={{ fontSize: '0.75rem', color: '#00A6A6' }}
            >
              {getDomain(meal.source_url)}
            </a>
          )}
        </div>
        {action && <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>{action}</div>}
      </div>

      {/* Accordion body */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 250ms ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            className="px-4 pb-5 pt-1"
            style={{ borderTop: '1px solid #F1F5F9', marginTop: '0' }}
          >
            <div className="flex flex-col gap-5 pt-4" style={{ gap: '20px' }}>

              {/* Ingredients */}
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div>
                  <p className="label mb-3">Ingredients</p>
                  <ul className="space-y-1.5">
                    {formatIngredients(meal.ingredients).map((item, i) => (
                      <li key={i} className="flex items-start gap-2" style={{ fontSize: '0.9375rem', color: '#1A1A1A' }}>
                        <span style={{ color: '#00A6A6', marginTop: '2px', flexShrink: 0 }}>·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions */}
              {meal.instructions && (
                <div>
                  <p className="label mb-3">Instructions</p>
                  <ol className="space-y-3">
                    {formatInstructions(meal.instructions).map((step, i) => (
                      <li key={i} className="flex items-start gap-3" style={{ fontSize: '0.9375rem', color: '#1A1A1A' }}>
                        <span
                          style={{
                            background: '#E0F5F5',
                            color: '#007A7A',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '1px',
                          }}
                        >
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Notes — verbatim, no formatting */}
              {meal.notes && (
                <div>
                  <p className="label mb-3">Notes</p>
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      color: '#1A1A1A',
                      whiteSpace: 'pre-wrap',
                      background: '#FDF6CC',
                      padding: '12px 14px',
                      borderRadius: '8px',
                    }}
                  >
                    {meal.notes}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
