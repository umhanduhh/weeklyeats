'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

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

export async function parseRecipeFromImage(
  base64: string,
  mediaType: ImageMediaType,
): Promise<ImportResult> {
  const authError = await requireUser()
  if (authError) return authError
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Extract the recipe from this image. It may be a cookbook page, a screenshot, or a handwritten recipe card. Return ONLY valid JSON, no explanation or code fences.

If a recipe is found, return:
{
  "title": "Recipe name",
  "ingredients": ["1 lb ground beef", "2 cloves garlic", ...],
  "instructions": ["Brown the beef over medium heat.", "Add garlic and cook 1 min.", ...]
}

If no recipe is found, return:
{ "error": "No recipe found in this image" }

Rules:
- Each ingredient is its own array entry with quantity + unit + name
- Each instruction is one clear step starting with a verb
- For handwritten text, transcribe as accurately as possible
- Clean up any formatting artifacts`,
          },
        ],
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
    return { error: 'Could not parse the recipe from the image. Try filling in the fields manually.' }
  }
}
