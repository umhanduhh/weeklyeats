'use client'

import { useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { createMeal, updateMeal } from '@/app/actions/meals'
import { parseRecipeFromUrl, parseRecipeFromImage } from '@/app/actions/import'
import { TagSelector } from '@/components/TagSelector'
import { DeleteMealButton } from '@/components/DeleteMealButton'

function CreateButtons() {
  const { pending } = useFormStatus()
  return (
    <div className="flex gap-3 pt-1">
      <button name="after" value="list" type="submit" disabled={pending} className="btn-primary flex-1">
        {pending ? 'Saving…' : 'Save meal'}
      </button>
      <button name="after" value="new" type="submit" disabled={pending} className="btn-secondary flex-1">
        Save &amp; add another
      </button>
    </div>
  )
}

function UpdateButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  )
}

type Props = {
  mode?: 'create' | 'edit'
  mealId?: string
  initialTitle?: string
  initialSourceUrl?: string
  initialIngredients?: string
  initialInstructions?: string
  initialNotes?: string
  initialTags?: string[]
  initialIsPublic?: boolean
}

export function MealForm({
  mode = 'create',
  mealId,
  initialTitle = '',
  initialSourceUrl = '',
  initialIngredients = '',
  initialInstructions = '',
  initialNotes = '',
  initialTags = [],
  initialIsPublic = false,
}: Props = {}) {
  const [title, setTitle] = useState(initialTitle)
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl)
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [instructions, setInstructions] = useState(initialInstructions)
  const [notes, setNotes] = useState(initialNotes)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [importError, setImportError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isPhotoPending, startPhotoTransition] = useTransition()
  const isEdit = mode === 'edit'

  function isValidUrl(s: string) {
    try { new URL(s); return true } catch { return false }
  }

  // Returns the file ready to upload as a Blob. Small originals go through as-is
  // (sharp originals OCR best); larger ones get downscaled via canvas with
  // EXIF orientation honored so phone photos aren't sideways.
  async function prepareImage(file: File): Promise<Blob> {
    const SMALL_ENOUGH = 5 * 1024 * 1024
    if (file.size <= SMALL_ENOUGH && /^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      return file
    }
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const MAX_EDGE = 1920
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare image for upload.')
    ctx.drawImage(bitmap, 0, 0, w, h)
    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    )
    if (!blob) throw new Error('Could not encode image.')
    return blob
  }

  function handlePhotoImport() {
    if (!photoFile) return
    setPhotoError('')
    startPhotoTransition(async () => {
      try {
        const blob = await prepareImage(photoFile)
        // Server actions encode plain string args via Flight, which choked on
        // multi-MB base64 payloads. FormData streams the file as a raw blob and
        // bypasses Flight encoding entirely.
        const fd = new FormData()
        fd.append('image', blob, 'recipe.jpg')
        const result = await parseRecipeFromImage(fd)
        if ('error' in result) {
          setPhotoError(result.error)
        } else {
          if (result.title) setTitle(result.title)
          setIngredients(result.ingredients)
          setInstructions(result.instructions)
        }
      } catch (e) {
        setPhotoError(e instanceof Error ? e.message : 'Something went wrong reading that image. Try a different photo.')
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
      <form action={isEdit ? updateMeal : createMeal} className="space-y-5">

        {isEdit && mealId && (
          <input type="hidden" name="meal_id" value={mealId} />
        )}

        {/* URL + photo importers only make sense when starting fresh */}
        {!isEdit && (
          <>
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

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t" style={{ borderColor: '#F1F5F9' }} />
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>or fill in manually</span>
              <div className="flex-1 border-t" style={{ borderColor: '#F1F5F9' }} />
            </div>
          </>
        )}

        {/* In edit mode we still want source_url to round-trip */}
        {isEdit && (
          <div>
            <label htmlFor="source_url" className="label block mb-2">Recipe URL</label>
            <input
              id="source_url"
              name="source_url"
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </div>
        )}

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
          <TagSelector defaultTags={initialTags} />
        </div>

        {/* Ingredients */}
        <div>
          <label htmlFor="ingredients" className="label block mb-2">Ingredients</label>
          <p className="mb-2" style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
            {isEdit
              ? 'One per line. We won’t reformat — what you write is what gets saved.'
              : 'One per line, or just dump everything in — we’ll format it.'}
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
            {isEdit
              ? 'One step per line. We won’t reformat.'
              : 'Free-form is fine — we’ll clean it up into steps.'}
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

        {/* Notes — free-form, never reformatted */}
        <div>
          <label htmlFor="notes" className="label block mb-2">Notes</label>
          <p className="mb-2" style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
            For your own reference — substitutions, tweaks, family reactions. Not formatted, not shared.
          </p>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Used half the chili last time, plenty spicy. Kids ate it."
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
            <input
              type="checkbox"
              name="is_public"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Actions */}
        {isEdit ? <UpdateButton /> : <CreateButtons />}

        {isEdit && mealId && (
          <DeleteMealButton mealId={mealId} isPublic={isPublic} />
        )}

      </form>
    </div>
  )
}
