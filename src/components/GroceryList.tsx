'use client'

import { useState, useTransition } from 'react'
import {
  generateGroceryList,
  toggleGroceryItem,
  updateGroceryItemStore,
  updateGroceryItemCategory,
  deleteGroceryItem,
  parseAndAddItems,
  type GroceryItem,
} from '@/app/actions/groceries'
import { GROCERY_CATEGORIES, getCategoryIcon } from '@/lib/groceries'

type Props = {
  planId: string
  listId: string | null
  weekLabel: string
  weekOffset: number
  initialItems: GroceryItem[] | null // null = no list generated yet
}

export function GroceryList({ planId, listId: initialListId, weekLabel, weekOffset, initialItems }: Props) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems ?? [])
  const [hasList, setHasList] = useState(initialItems !== null)
  const [listId, setListId] = useState<string | null>(initialListId)
  const [groupBy, setGroupBy] = useState<'category' | 'store'>('category')
  const [isPending, startTransition] = useTransition()
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [storeInput, setStoreInput] = useState('')
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')
  const [addingItems, setAddingItems] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const checkedCount = items.filter(i => i.checked).length
  const total = items.length

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleToggle(item: GroceryItem) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))
    startTransition(() => toggleGroceryItem(item.id, !item.checked))
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    startTransition(() => deleteGroceryItem(id))
  }

  function startEditStore(item: GroceryItem) {
    setEditingStoreId(item.id)
    setStoreInput(item.store ?? '')
  }

  function commitStore(id: string) {
    const val = storeInput.trim() || null
    setItems(prev => prev.map(i => i.id === id ? { ...i, store: val } : i))
    startTransition(() => updateGroceryItemStore(id, val))
    setEditingStoreId(null)
  }

  function handleCategory(item: GroceryItem, category: string) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, category } : i))
    startTransition(() => updateGroceryItemCategory(item.id, category))
  }

  function handleGenerate() {
    setGenerateError(null)
    startTransition(async () => {
      const result = await generateGroceryList(planId)
      if (!result || result.error) {
        setGenerateError(result?.error ?? 'Something went wrong. Try again.')
      } else {
        window.location.reload()
      }
    })
  }

  async function handleParseAndAdd() {
    if (!bulkText.trim() || !listId) return
    setIsParsing(true)
    setParseError(null)
    const result = await parseAndAddItems(listId, bulkText)
    setIsParsing(false)
    if (result.error) {
      setParseError(result.error)
    } else {
      setItems(prev => [...prev, ...(result.items ?? [])])
      setBulkText('')
      setAddingItems(false)
    }
  }

  // ── Grouping ─────────────────────────────────────────────────────────────────

  function getGroups(): Array<{ label: string; icon: string; items: GroceryItem[] }> {
    if (groupBy === 'category') {
      return GROCERY_CATEGORIES
        .map(cat => ({
          label: cat,
          icon: getCategoryIcon(cat),
          items: items.filter(i => i.category === cat || (!GROCERY_CATEGORIES.includes(i.category) && cat === 'Other')),
        }))
        .filter(g => g.items.length > 0)
    }

    // By store
    const map = new Map<string, GroceryItem[]>()
    for (const item of items) {
      const key = item.store ?? ''
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }

    const result: Array<{ label: string; icon: string; items: GroceryItem[] }> = []
    ;[...map.entries()]
      .filter(([k]) => k !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, itms]) => result.push({ label: key, icon: '🛒', items: itms }))
    const none = map.get('') ?? []
    if (none.length > 0) result.push({ label: 'No store assigned', icon: '🏪', items: none })
    return result
  }

  // ── Share ────────────────────────────────────────────────────────────────────

  async function handleShare() {
    const lines: string[] = [`🛒 Grocery List — ${weekLabel}`, '']
    for (const group of getGroups()) {
      lines.push(`${group.icon} ${group.label.toUpperCase()}`)
      for (const item of group.items) {
        lines.push(`${item.checked ? '✓' : '☐'} ${item.ingredient}`)
      }
      lines.push('')
    }
    const text = lines.join('\n').trim()

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: '🛒 Grocery List', text })
        return
      } catch {
        // user dismissed — fall through
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2500)
    } catch {
      // nothing we can do
    }
  }

  const groups = getGroups()

  // ── Empty / no list state ────────────────────────────────────────────────────

  if (!hasList || (items.length === 0 && !isPending)) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href={`/grocery?week=${weekOffset - 1}`} style={{ color: '#00A6A6', fontSize: '1.25rem', textDecoration: 'none' }}>‹</a>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: '#1A1A1A', margin: 0 }}>
                {weekLabel}
              </h2>
              <a href={`/dashboard?week=${weekOffset}`} style={{ fontSize: '0.8125rem', color: '#00A6A6', textDecoration: 'none' }}>
                ← Back to planner
              </a>
            </div>
            <a href={`/grocery?week=${weekOffset + 1}`} style={{ color: '#00A6A6', fontSize: '1.25rem', textDecoration: 'none' }}>›</a>
          </div>
        </div>

        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛒</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.125rem', color: '#1A1A1A', marginBottom: '8px' }}>
            No grocery list yet
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px' }}>
            Assign meals to your week in the planner, then build your shopping list — we'll parse and categorize every ingredient automatically.
          </p>
          {generateError && (
            <p style={{ fontSize: '0.875rem', color: '#EF4444', marginBottom: '16px' }}>{generateError}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="btn-accent"
            style={{ fontSize: '0.9375rem', padding: '10px 24px', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Building list…' : '✦ Build grocery list'}
          </button>
        </div>
      </div>
    )
  }

  // ── Full list ────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href={`/grocery?week=${weekOffset - 1}`} style={{ color: '#00A6A6', fontSize: '1.25rem', textDecoration: 'none' }}>‹</a>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: '#1A1A1A', margin: 0 }}>
              {weekLabel}
            </h2>
            <a href={`/dashboard?week=${weekOffset}`} style={{ fontSize: '0.8125rem', color: '#00A6A6', textDecoration: 'none' }}>
              ← Back to planner
            </a>
          </div>
          <a href={`/grocery?week=${weekOffset + 1}`} style={{ color: '#00A6A6', fontSize: '1.25rem', textDecoration: 'none' }}>›</a>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isPending}
          style={{
            background: 'none',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.875rem',
            color: '#64748B',
            cursor: 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Regenerating…' : '↺ Regenerate'}
        </button>
      </div>

      {generateError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#991B1B', fontSize: '0.875rem' }}>
          {generateError}
        </div>
      )}

      {/* Progress + group toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '120px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${total > 0 ? (checkedCount / total) * 100 : 0}%`,
              height: '100%',
              background: '#00A6A6',
              borderRadius: '3px',
              transition: 'width 300ms',
            }} />
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>{checkedCount} of {total}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {(['category', 'store'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setGroupBy(opt)}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1.5px solid',
                borderColor: groupBy === opt ? '#00A6A6' : '#E2E8F0',
                background: groupBy === opt ? '#E0F5F5' : '#fff',
                color: groupBy === opt ? '#007A7A' : '#64748B',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {opt === 'category' ? 'By category' : 'By store'}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {groups.map(group => (
          <div key={group.label} className="card" style={{ overflow: 'visible' }}>
            <div style={{ padding: '8px 16px 6px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>{group.icon}</span>
              <span className="label">{group.label}</span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
                {group.items.filter(i => i.checked).length}/{group.items.length}
              </span>
            </div>

            {group.items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 16px',
                  borderBottom: idx < group.items.length - 1 ? '1px solid #F8FAFB' : 'none',
                  opacity: item.checked ? 0.5 : 1,
                  transition: 'opacity 200ms',
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(item)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '5px',
                    border: item.checked ? '2px solid #00A6A6' : '2px solid #CBD5E1',
                    background: item.checked ? '#00A6A6' : '#fff',
                    flexShrink: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.75rem',
                    transition: 'all 150ms',
                  }}
                >
                  {item.checked ? '✓' : ''}
                </button>

                {/* Ingredient */}
                <span style={{
                  flex: 1,
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.9375rem',
                  color: '#1A1A1A',
                  textDecoration: item.checked ? 'line-through #94A3B8' : 'none',
                }}>
                  {item.ingredient}
                </span>

                {/* Category picker — shown in store view */}
                {groupBy === 'store' && (
                  <select
                    value={item.category}
                    onChange={e => handleCategory(item, e.target.value)}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '2px 6px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      background: '#fff',
                      color: '#64748B',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {GROCERY_CATEGORIES.map(c => (
                      <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>
                    ))}
                  </select>
                )}

                {/* Store tag — shown in category view */}
                {groupBy === 'category' && (
                  editingStoreId === item.id ? (
                    <input
                      autoFocus
                      value={storeInput}
                      onChange={e => setStoreInput(e.target.value)}
                      onBlur={() => commitStore(item.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitStore(item.id)
                        if (e.key === 'Escape') setEditingStoreId(null)
                      }}
                      placeholder="Store name…"
                      style={{
                        width: '110px',
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        border: '1.5px solid #00A6A6',
                        borderRadius: '20px',
                        outline: 'none',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => startEditStore(item)}
                      style={{
                        flexShrink: 0,
                        background: item.store ? '#E0F5F5' : 'none',
                        border: item.store ? '1px solid #00A6A6' : '1px dashed #CBD5E1',
                        borderRadius: '20px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        color: item.store ? '#007A7A' : '#94A3B8',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.store ?? '+ store'}
                    </button>
                  )
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Remove"
                  style={{
                    flexShrink: 0,
                    background: 'none',
                    border: 'none',
                    color: '#CBD5E1',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: '2px 4px',
                  }}
                >×</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add items */}
      <div style={{ marginTop: '12px' }}>
        {addingItems ? (
          <div className="card" style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '8px' }}>
              Jot down whatever you need — one item per line, comma-separated, however you like. We'll sort it out.
            </p>
            <textarea
              autoFocus
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setAddingItems(false); setBulkText('') }
              }}
              placeholder={'milk and eggs\nsourdough bread\n2 cans chickpeas, tahini\navocados'}
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #00A6A6',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                color: '#1A1A1A',
                boxSizing: 'border-box',
              }}
            />
            {parseError && (
              <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginTop: '6px' }}>{parseError}</p>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setAddingItems(false); setBulkText(''); setParseError(null) }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleParseAndAdd}
                disabled={!bulkText.trim() || isParsing}
                className="btn-accent"
                style={{ padding: '8px 18px', fontSize: '0.875rem', opacity: bulkText.trim() && !isParsing ? 1 : 0.6 }}
              >
                {isParsing ? 'Adding…' : '✦ Add items'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingItems(true)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'none',
              border: '1.5px dashed #E2E8F0',
              borderRadius: '10px',
              color: '#94A3B8',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'border-color 150ms, color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00A6A6'; e.currentTarget.style.color = '#00A6A6' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#94A3B8' }}
          >
            + Add items
          </button>
        )}
      </div>

      {/* Sticky share bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px env(safe-area-inset-bottom, 0px)',
        background: 'rgba(248, 250, 251, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 30,
      }}>
        <button
          onClick={handleShare}
          className="btn-accent"
          style={{ width: '100%', maxWidth: '560px', fontSize: '0.9375rem', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>📤</span>
          {shareStatus === 'copied' ? 'Copied to clipboard!' : 'Share grocery list'}
        </button>
      </div>
    </div>
  )
}
