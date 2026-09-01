'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ImportResult =
  | { title: string; ingredients: string; instructions: string }
  | { error: string }

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

async function requireUser(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to use this feature.' }
  return null
}

// Claude's recipe responses come back in inconsistent shapes — sometimes flat
// string arrays, sometimes section objects, sometimes a single string. Flatten
// any reasonable shape into newline-joined text the form can render.
function flattenToLines(v: unknown): string {
  const lines: string[] = []
  function walk(value: unknown, depth: number) {
    if (depth > 3) return
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) lines.push(trimmed)
      return
    }
    if (Array.isArray(value)) { value.forEach(item => walk(item, depth + 1)); return }
    if (value && typeof value === 'object') {
      const o = value as Record<string, unknown>
      if (typeof o.text === 'string') { walk(o.text, depth + 1); return }
      if (typeof o.step === 'string') { walk(o.step, depth + 1); return }
      if (typeof o.ingredient === 'string') { walk(o.ingredient, depth + 1); return }
      if (Array.isArray(o.items)) { walk(o.items, depth + 1); return }
      if (Array.isArray(o.ingredients)) { walk(o.ingredients, depth + 1); return }
      if (Array.isArray(o.steps)) { walk(o.steps, depth + 1); return }
    }
  }
  walk(v, 0)
  return lines.join('\n')
}

function parseRecipeJson(jsonText: string, label: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { error: `Could not parse the recipe ${label}. Try filling in the fields manually.` }
  }

  if (parsed && typeof parsed === 'object' && 'error' in parsed && typeof (parsed as { error: unknown }).error === 'string') {
    return { error: (parsed as { error: string }).error }
  }

  const p = (parsed ?? {}) as Record<string, unknown>
  const title = typeof p.title === 'string' ? p.title : ''
  const ingredients = flattenToLines(p.ingredients)
  const instructions = flattenToLines(p.instructions)

  if (!ingredients && !instructions) {
    return { error: `Could not read a recipe ${label}. Try filling in the fields manually.` }
  }
  return { title, ingredients, instructions }
}

export async function parseRecipeFromUrl(url: string): Promise<ImportResult> {
  const authError = await requireUser()
  if (authError) return authError
  // Fetch the page HTML
  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeeklyEats/1.0)' },
    })
    if (!res.ok) return { error: `Could not fetch page (${res.status})` }
    html = await res.text()
  } catch {
    return { error: 'Could not reach that URL. Check the address and try again.' }
  }

  // Strip scripts, styles, and HTML tags to get readable text
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000) // stay within token limits

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Extract the recipe from this webpage text. Return ONLY valid JSON, no explanation or code fences.

If a recipe is found, return:
{
  "title": "Recipe name",
  "ingredients": ["1 lb ground beef", "2 cloves garlic", ...],
  "instructions": ["Brown the beef over medium heat.", "Add garlic and cook 1 min.", ...]
}

If no recipe is found, return:
{ "error": "No recipe found on this page" }

Rules:
- Each ingredient is its own array entry with quantity + unit + name
- Each instruction is one clear step starting with a verb
- Clean up any formatting artifacts from the webpage

Webpage text:
${text}`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonText = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  return parseRecipeJson(jsonText, 'from this URL')
}

const MAX_IMAGES = 5

export async function parseRecipeFromImage(formData: FormData): Promise<ImportResult> {
  const authError = await requireUser()
  if (authError) return authError

  // Take the files from FormData rather than base64 string args. Server Actions
  // encode plain string arguments through React's Flight protocol, which chokes
  // on multi-MB strings ("Maximum array nesting exceeded"). FormData/File is
  // streamed as a raw blob and bypasses Flight encoding entirely.
  const files = formData.getAll('image').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) {
    return { error: 'No images were uploaded.' }
  }
  if (files.length > MAX_IMAGES) {
    return { error: `Please upload at most ${MAX_IMAGES} photos at a time.` }
  }

  const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  const images: { mediaType: ImageMediaType; base64: string }[] = []
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return { error: 'Unsupported image format. Use JPG, PNG, GIF, or WEBP.' }
    }
    const buffer = await file.arrayBuffer()
    images.push({ mediaType: file.type as ImageMediaType, base64: Buffer.from(buffer).toString('base64') })
  }
  console.log(`[parseRecipeFromImage] received ${files.length} image(s), sizes=${files.map(f => f.size).join(',')}`)

  const multiplePages = images.length > 1
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `You transcribe recipes from images. You do not invent or guess content. If the image is unreadable, blurry, doesn't contain a recipe, or you cannot clearly read the ingredients/instructions, you must return {"error": "..."}. NEVER fill in plausible-looking placeholder content. Only transcribe text you can actually see. When multiple images are provided, treat them as multiple pages or parts of ONE recipe (e.g. a screenshot that didn't fit on one page) and combine them into a single result. If the images clearly show more than one distinct recipe, return {"error": "It looks like these photos show more than one recipe. Please import one recipe at a time."}`,
    messages: [
      {
        role: 'user',
        content: [
          ...images.map(img => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
          })),
          {
            type: 'text' as const,
            text: `${multiplePages
              ? `Transcribe the recipe shown across these ${images.length} images. They are multiple pages/parts of the SAME recipe — combine them into one result.`
              : 'Transcribe the recipe in this image.'
            } Cookbook page, screenshot, or handwritten card are all fine.

Return ONLY valid JSON. No explanation, no code fences.

If you can clearly read the recipe, return:
{
  "title": "Exact title from the image",
  "ingredients": ["1 lb ground beef", "2 cloves garlic", ...],
  "instructions": ["Brown the beef over medium heat.", "Add garlic and cook 1 min.", ...]
}

If you cannot clearly read it, the image(s) aren't a recipe, or any field would have to be guessed, return:
{ "error": "Could not read a recipe from this image" }

Strict rules:
- Transcribe what you actually see. Do NOT fill in typical or expected ingredients that aren't visible in the image(s).
- Each ingredient: quantity + unit + name on its own line, exactly as written in the image (just clean up formatting).
- Each instruction: one step per array entry, starting with a verb.
- For handwritten text, transcribe as best you can — but if you can't read a section, return the error rather than guessing.
- If the image(s) only show part of a recipe (e.g. ingredients but no instructions), still return the error.${multiplePages ? '\n- If the images show more than one distinct recipe rather than multiple pages of the same one, return the "more than one recipe" error above.' : ''}`,
          },
        ],
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonText = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  console.log(`[parseRecipeFromImage] claude raw response (first 500 chars): ${raw.slice(0, 500)}`)
  return parseRecipeJson(jsonText, images.length > 1 ? 'from these images' : 'from this image')
}

// ─── Bulk import: fetch, parse, and save in one shot ─────────────────────────

export type BulkImportResult = { title: string } | { error: string }

export async function importMealFromUrl(url: string, isPublic = false): Promise<BulkImportResult> {
  const authError = await requireUser()
  if (authError) return authError

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  let html: string
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeeklyEats/1.0)' } })
    if (!res.ok) return { error: `Could not fetch page (${res.status})` }
    html = await res.text()
  } catch {
    return { error: 'Could not reach that URL' }
  }

  const pageText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim().slice(0, 20000)

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Extract and structure the recipe from this webpage. Return ONLY valid JSON, no code fences.

If a recipe is found:
{
  "title": "Recipe name",
  "ingredients": [{"text": "1 lb ground beef"}, {"text": "2 cloves garlic"}],
  "instructions": ["Brown the beef over medium heat.", "Add garlic and cook 1 min."]
}

If no recipe found: { "error": "No recipe found" }

Rules:
- Each ingredient is its own object with a "text" key, including quantity + unit + name
- Each instruction is one clear step starting with a verb
- Clean up any webpage formatting artifacts

Webpage text:
${pageText}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonText = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  let parsed: { title?: string; ingredients?: { text: string }[]; instructions?: string[]; error?: string }
  try { parsed = JSON.parse(jsonText) } catch { return { error: 'Could not parse recipe from page' } }

  if (parsed.error || !parsed.title) return { error: parsed.error ?? 'No recipe found' }

  const { error: dbError } = await supabase.from('meals').insert({
    user_id: user.id,
    title: parsed.title,
    source_url: url,
    ingredients: parsed.ingredients ?? [],
    instructions: (parsed.instructions ?? []).join('\n'),
    tags: null,
    is_public: isPublic,
  })

  if (dbError) return { error: dbError.message }
  revalidatePath('/meals')
  return { title: parsed.title }
}
