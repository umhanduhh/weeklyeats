'use server'

import { redirect } from 'next/navigation'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { PRESET_TAGS } from '@/lib/tags'

type FormattedRecipe = {
  ingredients: { text: string }[]
  instructions: string[]
}

async function formatRecipe(ingredientsRaw: string, instructionsRaw: string): Promise<FormattedRecipe> {
  // If both fields are empty, skip the API call
  if (!ingredientsRaw && !instructionsRaw) {
    return { ingredients: [], instructions: [] }
  }

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Parse this recipe into clean, structured JSON. Return ONLY valid JSON, no explanation.

Ingredients text:
${ingredientsRaw || '(none)'}

Instructions text:
${instructionsRaw || '(none)'}

Return JSON in exactly this shape:
{
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["Step one.", "Step two."]
}

Rules:
- Split ingredients into individual items (one per array entry)
- Split instructions into individual steps (one per array entry)
- Clean up grammar and punctuation
- Start each instruction step with a verb
- Keep ingredient amounts/units intact`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  // Strip markdown code fences if Claude wrapped the response
  const jsonText = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const parsed = JSON.parse(jsonText)

  return {
    ingredients: (parsed.ingredients as string[]).map((t: string) => ({ text: t })),
    instructions: parsed.instructions as string[],
  }
}

async function suggestTags(title: string, ingredientsRaw: string): Promise<string[]> {
  if (!title && !ingredientsRaw) return []
  const tagList = PRESET_TAGS.map(t => `"${t.value}" (${t.label})`).join(', ')
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Given this recipe, return a JSON array of applicable tag values from this list: ${tagList}.

Recipe title: ${title}
Ingredients: ${ingredientsRaw || '(none)'}

Rules:
- Only include tags that clearly apply
- Return an empty array if none apply
- Return ONLY a JSON array like ["vegetarian", "salad"], no explanation`,
      },
    ],
  })
  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const jsonText = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  try {
    const parsed = JSON.parse(jsonText)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export async function createMeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const sourceUrl = (formData.get('source_url') as string).trim() || null
  const ingredientsRaw = (formData.get('ingredients') as string).trim()
  const instructionsRaw = (formData.get('instructions') as string).trim()
  const notes = ((formData.get('notes') as string) ?? '').trim() || null
  const tags = formData.getAll('tags') as string[]
  const isPublic = formData.get('is_public') === 'on'
  const after = formData.get('after') as string

  let ingredients: { text: string }[] = []
  let instructions = instructionsRaw
  let autoTags: string[] = []

  try {
    const [formatted, suggested] = await Promise.all([
      formatRecipe(ingredientsRaw, instructionsRaw),
      suggestTags(title, ingredientsRaw),
    ])
    ingredients = formatted.ingredients
    instructions = formatted.instructions.join('\n')
    autoTags = suggested
  } catch (e) {
    console.error('AI formatting failed, using fallback:', e)
    const lines = ingredientsRaw.split('\n').map(l => l.trim()).filter(Boolean)
    const raw = lines.length > 1 ? lines : ingredientsRaw.split(',').map(l => l.trim()).filter(Boolean)
    ingredients = raw.map(text => ({ text }))
  }

  const mergedTags = Array.from(new Set([...tags, ...autoTags]))

  const { error } = await supabase.from('meals').insert({
    user_id: user.id,
    title,
    source_url: sourceUrl,
    ingredients,
    instructions,
    notes,
    tags: mergedTags.length > 0 ? mergedTags : null,
    is_public: isPublic,
  })

  if (error) {
    redirect(`/meals/new?error=${encodeURIComponent(error.message)}`)
  }

  if (after === 'new') {
    redirect('/meals/new?saved=1')
  }
  redirect('/meals')
}

export async function updateMeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mealId = formData.get('meal_id') as string
  const title = (formData.get('title') as string).trim()
  const sourceUrl = (formData.get('source_url') as string).trim() || null
  const ingredientsRaw = (formData.get('ingredients') as string).trim()
  const instructionsRaw = (formData.get('instructions') as string).trim()
  const notes = ((formData.get('notes') as string) ?? '').trim() || null
  const tags = formData.getAll('tags') as string[]
  const isPublic = formData.get('is_public') === 'on'

  // Edit mode skips AI re-formatting — the user is making targeted tweaks.
  // Store ingredients in the same { text } shape createMeal produces so MealCard
  // renders consistently.
  const ingredients = ingredientsRaw
    ? ingredientsRaw.split('\n').map(l => l.trim()).filter(Boolean).map(text => ({ text }))
    : []

  // Auto-tag is still cheap enough to run; merges with whatever the user picked.
  let autoTags: string[] = []
  try {
    autoTags = await suggestTags(title, ingredientsRaw)
  } catch (e) {
    console.error('Auto-tag failed on edit, skipping:', e)
  }
  const mergedTags = Array.from(new Set([...tags, ...autoTags]))

  const { error } = await supabase
    .from('meals')
    .update({
      title,
      source_url: sourceUrl,
      ingredients,
      instructions: instructionsRaw,
      notes,
      tags: mergedTags.length > 0 ? mergedTags : null,
      is_public: isPublic,
    })
    .eq('id', mealId)
    .eq('user_id', user.id)

  if (error) {
    redirect(`/meals/${mealId}/edit?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/meals?updated=1')
}

export async function copyMealToCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mealId = formData.get('meal_id') as string

  const { data: original, error: fetchError } = await supabase
    .from('meals')
    .select('title, source_url, ingredients, instructions, tags')
    .eq('id', mealId)
    .eq('is_public', true)
    .single()

  if (fetchError || !original) {
    redirect('/meals?tab=community&error=Could+not+copy+meal')
  }

  const { error } = await supabase.from('meals').insert({
    user_id: user.id,
    title: original.title,
    source_url: original.source_url,
    ingredients: original.ingredients,
    instructions: original.instructions,
    tags: original.tags,
    is_public: false,
  })

  if (error) {
    redirect(`/meals?tab=community&error=${encodeURIComponent(error.message)}`)
  }

  redirect('/meals?copied=1')
}

export async function deleteMeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mealId = formData.get('meal_id') as string

  // Look up the meal first so we can decide between a hard delete (private
  // recipes) and a soft delete that orphans ownership but keeps the row
  // visible in Community (public recipes — other members may have saved them).
  const { data: meal } = await supabase
    .from('meals')
    .select('is_public')
    .eq('id', mealId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!meal) {
    // Either it doesn't exist or isn't ours — silently bail so this can't be
    // used to probe other users' meal ids.
    redirect('/meals')
  }

  if (meal.is_public) {
    const { error } = await supabase.rpc('soft_delete_meal', { meal_id: mealId })
    if (error) {
      redirect(`/meals?error=${encodeURIComponent(error.message)}`)
    }
  } else {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id)
    if (error) {
      redirect(`/meals?error=${encodeURIComponent(error.message)}`)
    }
  }

  redirect('/meals')
}
