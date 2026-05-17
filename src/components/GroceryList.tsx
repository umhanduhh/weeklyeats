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
  const [groupBy, setGroupBy] = useState<'category' | 'store' | 'meal'>('category')
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

    if (groupBy === 'meal') {
      // One bucket per meal — an item shared across two meals shows under both.
      // (Toggling 'checked' is still one truth: same row, same checked state,
      // appears checked in every bucket it lives in.) Items with no meal
      // attribution — freeform parseAndAddItems — land in "Added by hand".
      const byMeal = new Map<string, GroceryItem[]>()
      const orphans: GroceryItem[] = []
      for (const item of items) {
        const titles = item.meals ?? []
        if (titles.length === 0) {
          orphans.push(item)
          continue
        }
        for (const title of titles) {
          if (!byMeal.has(title)) byMeal.set(title, [])
          byMeal.get(title)!.push(item)
        }
      }

      const result: Array<{ label: string; icon: string; items: GroceryItem[] }> = []
      ;[...byMeal.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([title, itms]) => result.push({ label: title, icon: '🍽', items: itms }))
      if (orphans.length > 0) {
        result.push({ label: 'Added by hand', icon: '✎', items: orphans })
      }
      return result
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
    // 96px bottom padding clears both the sticky share bar (~56px) and the
    // global mobile tab bar (--mobile-nav-h + --safe-bottom, handled in body).
    // We add page-local breathing room here too so the last item isn't visually
    // pinned against the share bar.
    <div style={{ paddingBottom: '96px' }}>

      {/* Header — flex-wrap so on narrow viewports the Regenerate button drops
          beneath the week navigator instead of pushing it off-screen. */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href={`/grocery?week=${weekOffset - 1}`}
            aria-label="Previous week"
            style={{
              color: '#00A6A6',
              fontSize: '1.5rem',
              textDecoration: 'none',
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
            <a href={`/dashboard?week=${weekOffset}`} style={{ fontSize: '0.8125rem', color: '#00A6A6', textDecoration: 'none' }}>
              ← Back to planner
            </a>
          </div>
          <a
            href={`/grocery?week=${weekOffset + 1}`}
            aria-label="Next week"
            style={{
              color: '#00A6A6',
              fontSize: '1.5rem',
              textDecoration: 'none',
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >›</a>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isPending}
          style={{
            background: 'none',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            padding: '10px 14px',
            minHeight: '44px',
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

      {/* Progress + group toggle.
          Mobile: progress bar fills remaining space; toggle wraps below if needed.
          Desktop: same row, progress on left, toggle on right. */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            // flex-1 so the bar grows on mobile instead of being a stub.
            className="flex-1 max-w-[160px]"
            style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}
          >
            <div style={{
              width: `${total > 0 ? (checkedCount / total) * 100 : 0}%`,
              height: '100%',
              background: '#00A6A6',
              borderRadius: '4px',
              transition: 'width 300ms',
            }} />
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#64748B', whiteSpace: 'nowrap' }}>{checkedCount} of {total}</span>
        </div>

        {/* Group-by pill toggle. The squash-merge of PR #17 (mobile sizing on
            the existing By category / By store pills) and PR #18 (third "By
            meal" option) into main left a tangled JSX tree here — two opening
            <div>s, two `.map(opt =>` lines, never balanced. This restores the
            intended merged shape: one wrapper, three options, mobile-friendly
            padding. */}
        <div className="flex gap-2 flex-wrap">
          {(['category', 'store', 'meal'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setGroupBy(opt)}
              aria-pressed={groupBy === opt}
              style={{
                padding: '8px 14px',
                minHeight: '36px',
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
              {opt === 'category' ? 'By category' : opt === 'store' ? 'By store' : 'By meal'}
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
                  // More generous row padding on mobile so checkbox / delete
                  // hit zones don't bleed into adjacent rows.
                  padding: '12px 16px',
                  borderBottom: idx < group.items.length - 1 ? '1px solid #F8FAFB' : 'none',
                  opacity: item.checked ? 0.5 : 1,
                  transition: 'opacity 200ms',
                }}
              >
                {/* Checkbox — visually 22px, but the surrounding hit area is
                    44x44 via padding so it's reliably tappable on touch.  */}
                <button
                  onClick={() => handleToggle(item)}
                  aria-label={item.checked ? 'Mark as not picked up' : 'Mark as picked up'}
                  aria-pressed={item.checked}
                  style={{
                    width: '44px',
                    height: '44px',
                    margin: '-11px 0',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: item.checked ? '2px solid #00A6A6' : '2px solid #CBD5E1',
                      background: item.checked ? '#00A6A6' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      transition: 'all 150ms',
                    }}
                  >
                    {item.checked ? '✓' : ''}
                  </span>
                </button>

                {/* Ingredient — min-w-0 lets text truncate instead of pushing
                    the store/delete columns off the right edge. */}
                <span
                  className="flex-1 min-w-0"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.9375rem',
                    color: '#1A1A1A',
                    textDecoration: item.checked ? 'line-through #94A3B8' : 'none',
                    overflowWrap: 'break-word',
                  }}
                >
                  {item.ingredient}
                </span>

                {/* Category picker — shown in store view. Bigger hit padding
                    on mobile; the native <select> control already gives an iOS
                    sheet on tap. */}
                {groupBy === 'store' && (
                  <select
                    value={item.category}
                    onChange={e => handleCategory(item, e.target.value)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '8px 8px',
                      minHeight: '36px',
                      maxWidth: '120px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
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

                {/* Store tag — shown when NOT grouping by store. The store axis
                    is hidden in store view because the section header already
                    is the store; everywhere else (category, meal) it's the
                    most useful side-info to keep on each row. */}
                {groupBy !== 'store' && (
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
                      placeholder="Store…"
                      style={{
                        // Was fixed 110px which overflowed narrow rows.
                        // Now flexes to a reasonable cap that still fits 375px.
                        width: 'min(140px, 40vw)',
                        padding: '8px 10px',
                        fontSize: '16px',
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
                        padding: '6px 12px',
                        minHeight: '32px',
                        fontSize: '0.75rem',
                        color: item.store ? '#007A7A' : '#94A3B8',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.store ?? '+ store'}
                    </button>
                  )
                )}

                {/* Delete — was a tiny 12px × visual with 2px padding (~16px
                    hit zone). Now a 36px square so it's actually tappable. */}
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Remove"
                  aria-label="Remove item"
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
            // Was hover-tinted via onMouseEnter/Leave — touch has no hover, so
            // the affordance vanished on phone. Use :hover/:focus-visible CSS
            // instead, applied as a className so styling is touch-friendly.
            className="add-items-btn"
            style={{
              width: '100%',
              padding: '14px',
              background: 'none',
              border: '1.5px dashed #E2E8F0',
              borderRadius: '10px',
              color: '#94A3B8',
              fontSize: '0.9375rem',
              cursor: 'pointer',
              minHeight: '52px',
            }}
          >
            + Add items
          </button>
        )}
      </div>

      {/* Sticky share bar — sits ABOVE the global mobile tab bar (and at the
          true floor on desktop, since --mobile-nav-h collapses to 0 there). */}
      <div
        className="fixed left-0 right-0 above-mobile-nav z-30 flex justify-center"
        style={{
          bottom: 0,
          padding: '12px 16px',
          background: 'rgba(248, 250, 251, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid #E2E8F0',
        }}
      >
        <button
          onClick={handleShare}
          className="btn-accent"
          style={{ width: '100%', maxWidth: '560px', fontSize: '0.9375rem', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span aria-hidden>📤</span>
          {shareStatus === 'copied' ? 'Copied to clipboard!' : 'Share grocery list'}
        </button>
      </div>
    </div>
  )
}
