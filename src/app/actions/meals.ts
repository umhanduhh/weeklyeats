'use server'

import { redirect } from 'next/navigation'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

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

export async function createMeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const sourceUrl = (formData.get('source_url') as string).trim() || null
  const ingredientsRaw = (formData.get('ingredients') as string).trim()
  const instructionsRaw = (formData.get('instructions') as string).trim()
  const tags = formData.getAll('tags') as string[]
  const isPublic = formData.get('is_public') === 'on'
  const after = formData.get('after') as string

  let ingredients: { text: string }[] = []
  let instructions = instructionsRaw

  try {
    const formatted = await formatRecipe(ingredientsRaw, instructionsRaw)
    ingredients = formatted.ingredients
    instructions = formatted.instructions.join('\n')
  } catch (e) {
    console.error('AI formatting failed, using fallback:', e)
    // Fall back: split by newline, or by comma if no newlines present
    const lines = ingredientsRaw.split('\n').map(l => l.trim()).filter(Boolean)
    const raw = lines.length > 1 ? lines : ingredientsRaw.split(',').map(l => l.trim()).filter(Boolean)
    ingredients = raw.map(text => ({ text }))
  }

  const { error } = await supabase.from('meals').insert({
    user_id: user.id,
    title,
    source_url: sourceUrl,
    ingredients,
    instructions,
    tags: tags.length > 0 ? tags : null,
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
