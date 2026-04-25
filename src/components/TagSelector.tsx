'use client'

import { useState, KeyboardEvent } from 'react'
import { PRESET_TAGS, getTagClass } from '@/lib/tags'

type Props = {
  defaultTags?: string[]
}

export function TagSelector({ defaultTags = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultTags)
  const [customInput, setCustomInput] = useState('')

  function toggle(value: string) {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    )
  }

  function addCustom() {
    const trimmed = customInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (trimmed && !selected.includes(trimmed)) {
      setSelected(prev => [...prev, trimmed])
    }
    setCustomInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addCustom()
    }
    if (e.key === 'Backspace' && customInput === '') {
      const customTags = selected.filter(t => !PRESET_TAGS.find(p => p.value === t))
      if (customTags.length > 0) {
        setSelected(prev => prev.filter(t => t !== customTags[customTags.length - 1]))
      }
    }
  }

  const customTags = selected.filter(t => !PRESET_TAGS.find(p => p.value === t))

  return (
    <div className="space-y-3">
      {/* Hidden inputs for form submission */}
      {selected.map(tag => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}

      {/* Preset tags */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map(({ value, label, className }) => {
          const isSelected = selected.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={className}
              style={{
                cursor: 'pointer',
                opacity: isSelected ? 1 : 0.45,
                outline: isSelected ? '2px solid #00A6A6' : 'none',
                outlineOffset: '2px',
                transition: 'opacity 150ms, outline 150ms',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Custom tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom tag…"
          className="input"
          style={{ maxWidth: '220px' }}
        />
        <button type="button" onClick={addCustom} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.875rem' }}>
          Add
        </button>
      </div>

      {/* Custom tags display */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={getTagClass(tag)}
              style={{ cursor: 'pointer' }}
              title="Click to remove"
            >
              {tag} ×
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
