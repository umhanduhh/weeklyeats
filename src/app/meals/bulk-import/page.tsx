'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { importMealFromUrl } from '@/app/actions/import'
import Link from 'next/link'

type Status = 'pending' | 'importing' | 'done' | 'error'

type UrlItem = {
  url: string
  status: Status
  title?: string
  error?: string
}

const CONCURRENCY = 3

export default function BulkImportPage() {
  const [raw, setRaw] = useState('')
  const [items, setItems] = useState<UrlItem[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  function parseUrls() {
    return raw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('http'))
  }

  function patch(url: string, update: Partial<UrlItem>) {
    setItems(prev => prev.map(i => i.url === url ? { ...i, ...update } : i))
  }

  async function handleImport() {
    const urls = parseUrls()
    if (!urls.length) return

    const initial: UrlItem[] = urls.map(url => ({ url, status: 'pending' }))
    setItems(initial)
    setRunning(true)
    setDone(false)

    const queue = [...urls]
    let active = 0

    await new Promise<void>(resolve => {
      function next() {
        while (active < CONCURRENCY && queue.length > 0) {
          const url = queue.shift()!
          active++
          patch(url, { status: 'importing' })
          importMealFromUrl(url).then(result => {
            if ('error' in result) {
              patch(url, { status: 'error', error: result.error })
            } else {
              patch(url, { status: 'done', title: result.title })
            }
            active--
            if (queue.length > 0) {
              next()
            } else if (active === 0) {
              resolve()
            }
          })
        }
      }
      next()
    })

    setRunning(false)
    setDone(true)
  }

  const urlCount = parseUrls().length
  const successCount = items.filter(i => i.status === 'done').length
  const errorCount = items.filter(i => i.status === 'error').length

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      <AppHeader email="" active="meals" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div style={{ marginBottom: '24px' }}>
          <Link href="/meals" style={{ fontSize: '0.8125rem', color: '#00A6A6', textDecoration: 'none' }}>
            ← Back to meals
          </Link>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: '#1A1A1A', margin: '8px 0 4px' }}>
            Bulk import recipes
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Paste recipe URLs below, one per line. We'll import them all automatically.
          </p>
        </div>

        {!running && !done && (
          <div className="card" style={{ padding: '20px' }}>
            <textarea
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder={'https://www.allrecipes.com/recipe/...\nhttps://minimalistbaker.com/...\nhttps://budgetbytes.com/...'}
              rows={10}
              style={{
                width: '100%',
                padding: '12px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                color: '#1A1A1A',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#00A6A6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                {urlCount > 0 ? `${urlCount} URL${urlCount !== 1 ? 's' : ''} detected` : 'Paste URLs above'}
              </span>
              <button
                onClick={handleImport}
                disabled={urlCount === 0}
                className="btn-accent"
                style={{ padding: '10px 24px', fontSize: '0.9375rem', opacity: urlCount > 0 ? 1 : 0.5 }}
              >
                ✦ Import {urlCount > 0 ? urlCount : ''} recipes
              </button>
            </div>
          </div>
        )}

        {(running || done) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {done && (
              <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9375rem', color: '#1A1A1A' }}>
                  {successCount} imported{errorCount > 0 ? `, ${errorCount} failed` : ' successfully'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setDone(false); setItems([]); setRaw('') }}
                    style={{ background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', fontSize: '0.875rem', color: '#64748B', cursor: 'pointer' }}
                  >
                    Import more
                  </button>
                  <Link href="/meals" className="btn-accent" style={{ padding: '6px 14px', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    View meals →
                  </Link>
                </div>
              </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
              {items.map((item, i) => (
                <div
                  key={item.url}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}
                >
                  <span style={{ flexShrink: 0, width: '20px', textAlign: 'center' }}>
                    {item.status === 'pending'   && <span style={{ color: '#CBD5E1' }}>○</span>}
                    {item.status === 'importing' && <span style={{ color: '#00A6A6' }}>⟳</span>}
                    {item.status === 'done'      && <span style={{ color: '#22C55E' }}>✓</span>}
                    {item.status === 'error'     && <span style={{ color: '#EF4444' }}>✗</span>}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.status === 'done' && (
                      <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9375rem', color: '#1A1A1A', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </p>
                    )}
                    {item.status === 'error' && (
                      <p style={{ fontSize: '0.8125rem', color: '#EF4444', margin: '0 0 2px' }}>{item.error}</p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.url}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
