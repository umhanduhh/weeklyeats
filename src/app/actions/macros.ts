'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { estimateMacros, type Macros } from '@/lib/macros'

type Ingredient = { text?: string; name?: string; quantity?: string; unit?: string }

function ingredientsToText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  const lines: string[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      lines.push(item)
    } else if (item && typeof item === 'object') {
      const o = item as Ingredient
      if (typeof o.text === 'string' && o.text) {
        lines.push(o.text)
      } else if (o.name) {
        lines.push([o.quantity, o.unit, o.name].filter(Boolean).join(' '))
      }
    }
  }
  return lines.join('\n')
}

export type CalculateMacrosResult =
  | { ok: true; macros: Macros }
  | { ok: false; error: string }

/**
 * Manual "Calculate macros" button target. Fetches the meal, runs Haiku to
 * estimate per-serving macros, writes them back, and revalidates the meals
 * list so the new macro line shows up on next render.
 *
 * Only the meal owner can trigger this — RLS would block writes anyway, but
 * we short-circuit with a friendly error.
 */
export async function calculateMealMacros(mealId: string): Promise<CalculateMacrosResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const { data: meal, error: fetchErr } = await supabase
    .from('meals')
    .select('id, user_id, title, ingredients, instructions')
    .eq('id', mealId)
    .maybeSingle()

  if (fetchErr || !meal) return { ok: false, error: 'Meal not found' }
  if (meal.user_id !== user.id) return { ok: false, error: 'Not your meal' }

  const ingredientsText = ingredientsToText(meal.ingredients)
  if (!ingredientsText.trim()) {
    return { ok: false, error: 'Add ingredients first' }
  }

  let macros: Macros | null
  try {
    macros = await estimateMacros(meal.title ?? '', ingredientsText, meal.instructions ?? '')
  } catch (e) {
    console.error('estimateMacros failed:', e)
    return { ok: false, error: 'Could not calculate — try again' }
  }
  if (!macros) return { ok: false, error: 'Macros could not be parsed' }

  const { error: updateErr } = await supabase
    .from('meals')
    .update(macros)
    .eq('id', mealId)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('macros update failed:', updateErr)
    return { ok: false, error: updateErr.message }
  }

  revalidatePath('/meals')
  return { ok: true, macros }
}
