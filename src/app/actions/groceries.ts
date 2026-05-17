'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export type GroceryItem = {
  id: string
  list_id: string
  ingredient: string
  category: string
  store: string | null
  checked: boolean
  position: number
  /** Meal titles that contributed this item — set on auto-generation, empty
   *  for items added freeform. Stored as text[] (a snapshot of titles) so the
   *  grocery list stays readable even if the underlying meal is later edited
   *  or deleted. Used by the "by meal" grouping in the UI. */
  meals: string[]
}

// ─── Get grocery list for a plan ─────────────────────────────────────────────

export async function getGroceryList(planId: string): Promise<{ listId: string; items: GroceryItem[] } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('plan_id', planId)
    .single()

  if (!list) return null

  const { data: items } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('list_id', list.id)
    .order('position')

  return { listId: list.id, items: (items ?? []) as GroceryItem[] }
}

// ─── Generate grocery list from plan meals ────────────────────────────────────

export async function generateGroceryList(planId: string): Promise<{ error?: string }> {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get all meal IDs from filled slots
  const { data: slots } = await supabase
    .from('weekly_plan_slots')
    .select('meal_id')
    .eq('plan_id', planId)
    .not('meal_id', 'is', null)

  if (!slots || slots.length === 0) return { error: 'No meals assigned this week yet.' }

  const mealIds = slots.map(s => s.meal_id).filter(Boolean) as string[]

  // Fetch meals directly
  const { data: meals } = await supabase
    .from('meals')
    .select('id, title, ingredients')
    .in('id', mealIds)

  if (!meals || meals.length === 0) return { error: 'No meals found.' }

  // Collect ingredients per-meal so we can pass meal context to Claude and
  // remember which meal(s) each grocery item came from after deduplication.
  const ingredientsByMeal: Array<{ title: string; lines: string[] }> = []
  for (const meal of meals) {
    const lines: string[] = []
    const ing = meal.ingredients
    if (Array.isArray(ing)) {
      for (const i of ing) {
        if (typeof i === 'string') lines.push(i)
        else if (i && typeof i === 'object' && 'text' in i && typeof i.text === 'string') lines.push(i.text)
      }
    } else if (typeof ing === 'string' && ing.trim()) {
      lines.push(...ing.split('\n').filter(Boolean))
    }
    if (lines.length > 0) ingredientsByMeal.push({ title: meal.title, lines })
  }

  if (ingredientsByMeal.length === 0) return { error: 'No ingredients found — make sure your meals have ingredients saved.' }

  // Build the prompt with per-meal section headers so Claude can attribute each
  // resulting grocery item back to its source meal(s). Titles are quoted in the
  // header but echoed VERBATIM in the JSON output so we can match them later.
  const mealSections = ingredientsByMeal
    .map(m => `[Meal: ${m.title}]\n${m.lines.map(l => `- ${l}`).join('\n')}`)
    .join('\n\n')
  const knownTitles = ingredientsByMeal.map(m => m.title)

  // Use Claude to parse, deduplicate, categorize, and attribute to source meals.
  // max_tokens raised from 2048 → 4096: per-item `meals` arrays inflated the
  // response payload, and a full week of meals was truncating mid-array — the
  // unterminated JSON then hit the catch block as a parse failure.
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Below are ingredients for a weekly meal plan, grouped by meal. Please:
1. Parse and clean up each ingredient (fix formatting, normalize units).
2. Combine duplicates or very similar ingredients across meals (e.g. "1 onion" in Meal A + "2 onions" in Meal B = "3 onions").
3. Assign each to the most appropriate grocery category.
4. For each output item, list which source meal(s) it came from in a "meals" array. Use the meal titles EXACTLY as they appear in the section headers.

Return ONLY a valid JSON array, no explanation, no code fences:
[
  { "ingredient": "3 onions", "category": "Produce", "meals": ["Chicken Tikka Masala", "Pad Thai"] },
  ...
]

Categories (pick the best fit, use exact names):
- Produce
- Meat & Seafood
- Dairy & Eggs
- Pantry & Dry Goods
- Frozen
- Bakery
- Beverages
- Condiments & Sauces
- Other

Meal plan:
${mealSections}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'

  // Claude occasionally wraps the JSON in prose ("Here's the parsed list…") or
  // a fenced code block. Strip fences first, then carve out the outermost
  // [...]. The greedy regex tolerates leading/trailing commentary; falling
  // through to the raw text preserves the old behavior when nothing wraps it.
  const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const arrayMatch = stripped.match(/\[[\s\S]*\]/)
  const jsonText = arrayMatch ? arrayMatch[0] : stripped

  let parsed: Array<{ ingredient: string; category: string; meals?: unknown }>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { error: 'Could not parse the grocery list. Try again.' }
  }
  if (!Array.isArray(parsed)) {
    return { error: 'Could not parse the grocery list. Try again.' }
  }

  // Normalize the meals attribution: drop anything that isn't a string, drop
  // titles Claude hallucinated, and dedupe. Anything left becomes the row's
  // `meals` text[]. Items with no recognized source still get persisted —
  // they'll just bucket under "Other meal" in the by-meal view.
  const knownSet = new Set(knownTitles)
  const sanitizeMeals = (v: unknown): string[] => {
    if (!Array.isArray(v)) return []
    const out = new Set<string>()
    for (const x of v) if (typeof x === 'string' && knownSet.has(x)) out.add(x)
    return Array.from(out)
  }

  // Look up the plan's week_start_date
  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('week_start_date')
    .eq('id', planId)
    .single()

  // Delete any existing list for this plan
  await supabase
    .from('grocery_lists')
    .delete()
    .eq('plan_id', planId)

  // Create new list
  const { data: list, error: listError } = await supabase
    .from('grocery_lists')
    .insert({ plan_id: planId, user_id: user.id, week_start_date: plan?.week_start_date })
    .select('id')
    .single()

  if (listError || !list) return { error: `Could not create grocery list: ${listError?.message ?? 'unknown error'}` }

  // Insert items
  const { error: itemsError } = await supabase.from('grocery_items').insert(
    parsed.map((item, i) => ({
      list_id: list.id,
      ingredient: item.ingredient,
      category: item.category ?? 'Other',
      position: i,
      meals: sanitizeMeals(item.meals),
    }))
  )

  if (itemsError) return { error: `Could not save items: ${itemsError.message}` }

  revalidatePath('/grocery')
  return {}
  } catch (e) {
    return { error: `Unexpected error: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// ─── Parse and add freeform items ────────────────────────────────────────────

export async function parseAndAddItems(listId: string, rawText: string): Promise<{ items?: GroceryItem[]; error?: string }> {
  if (!rawText.trim()) return { error: 'Nothing to add.' }

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Parse this freeform grocery note into individual items. The text may use commas, newlines, "and", or any other separators — just figure out each distinct ingredient.

Return ONLY a valid JSON array, no explanation, no code fences:
[
  { "ingredient": "2 cans black beans", "category": "Pantry & Dry Goods" },
  ...
]

Categories (use exact names):
- Produce
- Meat & Seafood
- Dairy & Eggs
- Pantry & Dry Goods
- Frozen
- Bakery
- Beverages
- Condiments & Sauces
- Other

Grocery note:
${rawText}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'

  // Same defensive parsing as generateGroceryList — Claude sometimes wraps the
  // JSON array in prose. Strip fences, then carve out the outermost [...].
  const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const arrayMatch = stripped.match(/\[[\s\S]*\]/)
  const jsonText = arrayMatch ? arrayMatch[0] : stripped

  let parsed: Array<{ ingredient: string; category: string }>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { error: 'Could not parse your items. Try again.' }
  }
  if (!Array.isArray(parsed)) {
    return { error: 'Could not parse your items. Try again.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grocery_items')
    .insert(parsed.map((item, i) => ({
      list_id: listId,
      ingredient: item.ingredient,
      category: item.category ?? 'Other',
      position: 9999 + i,
      // Freeform items have no meal source — they bucket under "Added by hand"
      // in the by-meal view.
      meals: [] as string[],
    })))
    .select('*')

  if (error) return { error: error.message }
  revalidatePath('/grocery')
  return { items: data as GroceryItem[] }
}

// ─── Toggle checked ───────────────────────────────────────────────────────────

export async function toggleGroceryItem(itemId: string, checked: boolean) {
  const supabase = await createClient()
  await supabase.from('grocery_items').update({ checked }).eq('id', itemId)
  revalidatePath('/grocery')
}

// ─── Update store ─────────────────────────────────────────────────────────────

export async function updateGroceryItemStore(itemId: string, store: string | null) {
  const supabase = await createClient()
  await supabase.from('grocery_items').update({ store: store || null }).eq('id', itemId)
  revalidatePath('/grocery')
}

// ─── Update category ──────────────────────────────────────────────────────────

export async function updateGroceryItemCategory(itemId: string, category: string) {
  const supabase = await createClient()
  await supabase.from('grocery_items').update({ category }).eq('id', itemId)
  revalidatePath('/grocery')
}

// ─── Delete item ──────────────────────────────────────────────────────────────

export async function deleteGroceryItem(itemId: string) {
  const supabase = await createClient()
  await supabase.from('grocery_items').delete().eq('id', itemId)
  revalidatePath('/grocery')
}
