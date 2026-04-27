'use client'

import { useState, useTransition } from 'react'
import { createMeal } from '@/app/actions/meals'
import { parseRecipeFromUrl, parseRecipeFromImage } from '@/app/actions/import'
import { TagSelector } from '@/components/TagSelector'

export function MealForm() {
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const [importError, setImportError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isPhotoPending, startPhotoTransition] = useTransition()

  function isValidUrl(s: string) {
    try { new URL(s); return true } catch { return false }
  }

  function handlePhotoImport() {
    if (!photoFile) return
    setPhotoError('')
    startPhotoTransition(async () => {
      const buffer = await photoFile.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      const mediaType = photoFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      const result = await parseRecipeFromImage(base64, mediaType)
      if ('error' in result) {
        setPhotoError(result.error)
      } else {
        if (result.title) setTitle(result.title)
        setIngredients(result.ingredients)
        setInstructions(result.instructions)
      }
    })
  }

  function handleImport() {
    if (!isValidUrl(sourceUrl)) return
    setImportError('')
    startTransition(async () => {
      const result = await parseRecipeFromUrl(sourceUrl)
      if ('error' in result) {
        setImportError(result.error)
      } else {
        if (result.title) setTitle(result.title)
        setIngredients(result.ingredients)
        setInstructions(result.instructions)
      }
    })
  }

  return (
    <div className="card p-6 space-y-5">
      <form action={createMeal} className="space-y-5">

        {/* Source URL — first so import can populate the rest */}
        <div>
          <label htmlFor="source_url" className="label block mb-2">Recipe URL</label>
          <div className="flex gap-2">
            <input
              id="source_url"
              name="source_url"
              type="url"
              value={sourceUrl}
              onChange={e => { setSourceUrl(e.target.value); setImportError('') }}
              placeholder="https://..."
              className="input"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!isValidUrl(sourceUrl) || isPending}
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {isPending ? 'Importing…' : 'Import'}
            </button>
          </div>
          {importError && (
            <p className="mt-2 text-sm" style={{ color: '#991B1B' }}>{importError}</p>
          )}
          {isPending && (
            <p className="mt-2 text-sm" style={{ color: '#00A6A6' }}>
              Fetching recipe — this takes a few seconds…
            </p>
          )}
        </div>

        {/* Photo import */}
        <div>
          <label className="label block mb-2">Import from photo</label>
          <div className="flex gap-2">
            <label
              className="input flex items-center gap-2 cursor-pointer"
              style={{ flex: 1, overflow: 'hidden' }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={e => { setPhotoFile(e.target.files?.[0] ?? null); setPhotoError('') }}
              />
              <span style={{ color: photoFile ? '#1A1A1A' : '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {photoFile ? photoFile.name : 'Choose image…'}
              </span>
            </label>
            <button
              type="button"
              onClick={handlePhotoImport}
              disabled={!photoFile || isPhotoPending}
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {isPhotoPending ? 'Reading…' : 'Import'}
            </button>
          </div>
          {photoError && (
            <p className="mt-2 text-sm" style={{ color: '#991B1B' }}>{photoError}</p>
          )}
          {isPhotoPending && (
            <p className="mt-2 text-sm" style={{ color: '#00A6A6' }}>Reading recipe from photo…</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t" style={{ borderColor: '#F1F5F9' }} />
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>or fill in manually</span>
          <div className="flex-1 border-t" style={{ borderColor: '#F1F5F9' }} />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="label block mb-2">Meal name *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Chicken Tikka Masala"
            className="input"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="label block mb-2">Tags</label>
          <TagSelector />
        </div>

        {/* Ingredients */}
        <div>
          <label htmlFor="ingredients" className="label block mb-2">Ingredients</label>
          <p className="mb-2" style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
            One per line, or just dump everything in — we&apos;ll format it.
          </p>
          <textarea
            id="ingredients"
            name="ingredients"
            rows={6}
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
            placeholder={"2 chicken breasts\n1 can coconut milk\n3 cloves garlic…"}
            className="input"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="label block mb-2">Instructions</label>
          <p className="mb-2" style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
            Free-form is fine — we&apos;ll clean it up into steps.
          </p>
          <textarea
            id="instructions"
            name="instructions"
            rows={8}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Marinate chicken for 30 min. Heat oil in pan…"
            className="input"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: '#F1F5F9' }}>
          <div>
            <p className="label">Share with community</p>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
              Lets other users discover and copy this meal
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" name="is_public" className="toggle-checkbox" />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button name="after" value="list" type="submit" className="btn-primary flex-1">
            Save meal
          </button>
          <button name="after" value="new" type="submit" className="btn-secondary flex-1">
            Save &amp; add another
          </button>
        </div>

      </form>
    </div>
  )
}
