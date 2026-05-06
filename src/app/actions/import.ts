'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type ImportResult =
  | { title: string; ingredients: string; instructions: string }
  | { error: string }

export async function parseRecipeFromUrl(url: string): Promise<ImportResult> {
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

  try {
    const parsed = JSON.parse(jsonText)
    if (parsed.error) return { error: parsed.error }
    return {
      title: parsed.title ?? '',
      ingredients: (parsed.ingredients as string[]).join('\n'),
      instructions: (parsed.instructions as string[]).join('\n'),
    }
  } catch {
    return { error: 'Could not parse the recipe. Try filling in the fields manually.' }
  }
}

// ─── Bulk import: fetch, parse, and save in one shot ─────────────────────────

export type BulkImportResult =
  | { title: string }
  | { error: string }

export async function importMealFromUrl(url: string): Promise<BulkImportResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch page
  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeeklyEats/1.0)' },
    })
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

  // Parse + structure with Claude in one call
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
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { error: 'Could not parse recipe from page' }
  }

  if (parsed.error || !parsed.title) return { error: parsed.error ?? 'No recipe found' }

  const { error: dbError } = await supabase.from('meals').insert({
    user_id: user.id,
    title: parsed.title,
    source_url: url,
    ingredients: parsed.ingredients ?? [],
    instructions: (parsed.instructions ?? []).join('\n'),
    tags: null,
    is_public: false,
  })

  if (dbError) return { error: dbError.message }
  return { title: parsed.title }
}
