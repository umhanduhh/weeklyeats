'use server'

import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type GroceryItem = {
  id: string
  name: string
  category: string
  store: string | null
  checked: boolean
  sort_order: number
}

const CATEGORY_ORDER = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry',
  'Frozen',
  'Bakery',
  'Beverages',
  'Other',
]

// ─── Generate grocery list from week's meals ──────────────────────────────────

export async function generateGroceryList(planId: string, weekStartDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all meal slots for this plan (dinner + other)
  const { data: slots } = await supabase
    .from('weekly_plan_slots')
    .select('meal_id, meals(id, title, ingredients)')
    .eq('plan_id', planId)
    .not('meal_id', 'is', null)

  if (!slots || slots.length === 0) {
    return { error: 'No meals assigned this week. Add some meals to your plan first!' }
  }

  // Collect unique meals with ingredients
  const seen = new Set<string>()
  const uniqueMeals: { id: string; title: string; ingredients: string }[] = []

  for (const slot of slots) {
    const meal = slot.meals as unknown as { id: string; title: string; ingredients: string | null } | null
    if (!meal || !meal.ingredients?.trim() || seen.has(meal.id)) continue
    seen.add(meal.id)
    uniqueMeals.push(meal as { id: string; title: string; ingredients: string })
  }

  if (uniqueMeals.length === 0) {
    return { error: 'No ingredient data found. Make sure your meals have ingredients listed.' }
  }

  const ingredientText = uniqueMeals
    .map(m => `--- ${m.title} ---\n${m.ingredients}`)
    .join('\n\n')

  // Ask Claude to parse, deduplicate, and categorize
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Organize this grocery list from multiple recipes.

${ingredientText}

Instructions:
1. Parse each ingredient into a clean shopping item. Keep amounts when helpful (e.g. "Ground beef (1 lb)").
2. Combine duplicates across recipes into one entry — add quantities together when it makes sense.
3. Assign each item to exactly one of these categories: Produce, Meat & Seafood, Dairy & Eggs, Pantry, Frozen, Bakery, Beverages, Other

Return ONLY a valid JSON array with no explanation or code fences:
[{"name":"Garlic","category":"Produce"},{"name":"Ground beef (1 lb)","category":"Meat & Seafood"}]`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonText = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  let parsedItems: { name: string; category: string }[]
  try {
    parsedItems = JSON.parse(jsonText)
    if (!Array.isArray(parsedItems)) throw new Error('Not an array')
  } catch {
    return { error: 'Could not parse the grocery list. Please try again.' }
  }

  // Sort by category order
  parsedItems.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category)
    const bi = CATEGORY_ORDER.indexOf(b.category)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  // Upsert the list record
  let listId: string

  const { data: existing } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .single()

  if (existing) {
    listId = existing.id
    await supabase.from('grocery_items').delete().eq('list_id', listId)
  } else {
    const { data: created } = await supabase
      .from('grocery_lists')
      .insert({ user_id: user.id, plan_id: planId, week_start_date: weekStartDate })
      .select('id')
      .single()
    listId = created!.id
  }

  await supabase.from('grocery_items').insert(
    parsedItems.map((item, i) => ({
      list_id: listId,
      name: item.name,
      category: CATEGORY_ORDER.includes(item.category) ? item.category : 'Other',
      sort_order: i,
    }))
  )

  revalidatePath('/grocery')
  return { success: true }
}

// ─── Fetch existing list ──────────────────────────────────────────────────────

export async function getGroceryList(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .single()

  if (!list) return null

  const { data: items } = await supabase
    .from('grocery_items')
    .select('id, name, category, store, checked, sort_order')
    .eq('list_id', list.id)
    .order('sort_order')

  return { listId: list.id, items: (items ?? []) as GroceryItem[] }
}

// ─── Item mutations ───────────────────────────────────────────────────────────

export async function toggleGroceryItem(itemId: string, checked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('grocery_items').update({ checked }).eq('id', itemId)
  revalidatePath('/grocery')
}

export async function updateGroceryItemStore(itemId: string, store: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('grocery_items').update({ store: store || null }).eq('id', itemId)
  revalidatePath('/grocery')
}

export async function removeGroceryItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('grocery_items').delete().eq('id', itemId)
  revalidatePath('/grocery')
}
