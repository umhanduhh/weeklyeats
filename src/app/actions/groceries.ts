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

  // Collect all ingredients — stored as JSONB array
  const allIngredients: string[] = []
  for (const meal of meals) {
    const ing = meal.ingredients
    if (Array.isArray(ing)) {
      for (const i of ing) {
        if (typeof i === 'string') allIngredients.push(i)
        else if (i && typeof i === 'object' && 'text' in i && typeof i.text === 'string') allIngredients.push(i.text)
      }
    } else if (typeof ing === 'string' && ing.trim()) {
      allIngredients.push(...ing.split('\n').filter(Boolean))
    }
  }

  if (allIngredients.length === 0) return { error: 'No ingredients found — make sure your meals have ingredients saved.' }

  // Use Claude to parse, deduplicate, and categorize
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `I have these raw ingredients from a weekly meal plan. Please:
1. Parse and clean up each ingredient (fix formatting, normalize units)
2. Combine duplicates or very similar ingredients (e.g. "1 onion" + "2 onions" = "3 onions")
3. Assign each to the most appropriate grocery category

Return ONLY a valid JSON array, no explanation, no code fences:
[
  { "ingredient": "2 lbs ground beef", "category": "Meat & Seafood" },
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

Ingredients to process:
${allIngredients.join('\n')}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const jsonText = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  let parsed: Array<{ ingredient: string; category: string }>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { error: 'Could not parse the grocery list. Try again.' }
  }

  // Look up the plan's week_start_date
  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('week_start_date')
    .eq('id', planId)
    .single()

  // Find or create the list, then swap items: insert the new batch first and
  // only delete the old rows once that succeeds, so a mid-flight failure can't
  // leave the user with an empty list.
  const { data: existing } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('plan_id', planId)
    .maybeSingle()

  let listId: string
  if (existing) {
    listId = existing.id
  } else {
    const { data: created, error: listError } = await supabase
      .from('grocery_lists')
      .insert({ plan_id: planId, user_id: user.id, week_start_date: plan?.week_start_date })
      .select('id')
      .single()
    if (listError || !created) return { error: `Could not create grocery list: ${listError?.message ?? 'unknown error'}` }
    listId = created.id
  }

  // Snapshot existing item ids before insert so we can delete exactly those on success.
  const { data: oldItems } = await supabase
    .from('grocery_items')
    .select('id')
    .eq('list_id', listId)
  const oldIds = (oldItems ?? []).map(r => r.id)
  const offset = oldIds.length // keep positions distinct from old rows during the swap

  const { error: itemsError } = await supabase.from('grocery_items').insert(
    parsed.map((item, i) => ({
      list_id: listId,
      ingredient: item.ingredient,
      category: item.category ?? 'Other',
      position: offset + i,
    }))
  )

  if (itemsError) return { error: `Could not save items: ${itemsError.message}` }

  if (oldIds.length > 0) {
    await supabase.from('grocery_items').delete().in('id', oldIds)
  }
  // Renumber the kept items to start at 0 for stable ordering.
  await Promise.all(
    parsed.map((_, i) =>
      supabase.from('grocery_items').update({ position: i })
        .eq('list_id', listId)
        .eq('position', offset + i)
    )
  )

  revalidatePath('/grocery')
  return {}
  } catch (e) {
    return { error: `Unexpected error: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// ─── Parse and add freeform items ────────────────────────────────────────────

export async function parseAndAddItems(listId: string, rawText: string): Promise<{ items?: GroceryItem[]; error?: string }> {
  if (!rawText.trim()) return { error: 'Nothing to add.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the caller owns this list before spending an Anthropic call on it.
  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!list) return { error: 'List not found' }

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
  const jsonText = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  let parsed: Array<{ ingredient: string; category: string }>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { error: 'Could not parse your items. Try again.' }
  }

  const { data, error } = await supabase
    .from('grocery_items')
    .insert(parsed.map((item, i) => ({
      list_id: listId,
      ingredient: item.ingredient,
      category: item.category ?? 'Other',
      position: 9999 + i,
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
