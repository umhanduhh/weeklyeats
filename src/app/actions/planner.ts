'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NON_ENTREE_TAGS } from '@/lib/tags'

// ─── Get or create plan + slots ───────────────────────────────────────────────

export async function getOrCreatePlan(weekStartDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Upsert against the (user_id, week_start_date) unique index so concurrent
  // requests for the same week can't create duplicate plans.
  const { data: plan } = await supabase
    .from('weekly_plans')
    .upsert(
      { user_id: user.id, week_start_date: weekStartDate },
      { onConflict: 'user_id,week_start_date', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  const planId = plan!.id

  // Create the 14 slots only if this plan has none yet (i.e. first time we saw it).
  const { count } = await supabase
    .from('weekly_plan_slots')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId)

  if (!count) {
    await supabase.from('weekly_plan_slots').insert(
      [0, 1, 2, 3, 4, 5, 6].flatMap(day => [
        { plan_id: planId, day_of_week: day, meal_type: 'dinner' },
        { plan_id: planId, day_of_week: day, meal_type: 'other' },
      ])
    )
  }

  // Fetch slots with joined meal data
  const { data: slots } = await supabase
    .from('weekly_plan_slots')
    .select('id, day_of_week, meal_type, meal_id, note, constraint_tags, meals(id, title, tags, source_url)')
    .eq('plan_id', planId)
    .order('day_of_week')
    .order('meal_type')

  return { planId, slots: slots ?? [] }
}

// Defense-in-depth: confirm the slot's parent plan belongs to the caller before
// any update. RLS should already block cross-user writes, but this avoids
// trusting a slot id from the client outright.
async function assertSlotOwned(supabase: Awaited<ReturnType<typeof createClient>>, slotId: string, userId: string) {
  const { data } = await supabase
    .from('weekly_plan_slots')
    .select('id, weekly_plans!inner(user_id)')
    .eq('id', slotId)
    .eq('weekly_plans.user_id', userId)
    .maybeSingle()
  return !!data
}

// ─── Assign a meal to a slot ─────────────────────────────────────────────────

export async function assignMealToSlot(slotId: string, mealId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  if (!(await assertSlotOwned(supabase, slotId, user.id))) return

  await supabase
    .from('weekly_plan_slots')
    .update({ meal_id: mealId, note: null })
    .eq('id', slotId)

  // Update last_planned_date on the meal
  await supabase
    .from('meals')
    .update({ last_planned_date: new Date().toISOString().split('T')[0] })
    .eq('id', mealId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

// ─── Set a note (Eating Out / Skip) ─────────────────────────────────────────

export async function setSlotNote(slotId: string, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  if (!(await assertSlotOwned(supabase, slotId, user.id))) return

  await supabase
    .from('weekly_plan_slots')
    .update({ note, meal_id: null })
    .eq('id', slotId)

  revalidatePath('/dashboard')
}

// ─── Set constraint on a slot ────────────────────────────────────────────────

export async function setSlotConstraints(slotId: string, tags: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  if (!(await assertSlotOwned(supabase, slotId, user.id))) return

  await supabase
    .from('weekly_plan_slots')
    .update({ constraint_tags: tags })
    .eq('id', slotId)

  revalidatePath('/dashboard')
}

// ─── Clear a slot ────────────────────────────────────────────────────────────

export async function clearSlot(slotId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  if (!(await assertSlotOwned(supabase, slotId, user.id))) return

  await supabase
    .from('weekly_plan_slots')
    .update({ meal_id: null, note: null })
    .eq('id', slotId)

  revalidatePath('/dashboard')
}

// ─── Generate week ────────────────────────────────────────────────────────────

export async function generateWeek(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get empty dinner slots only — never auto-populate "other"
  const { data: emptySlots } = await supabase
    .from('weekly_plan_slots')
    .select('id, day_of_week, meal_type, constraint_tags')
    .eq('plan_id', planId)
    .eq('meal_type', 'dinner')
    .is('meal_id', null)
    .is('note', null)

  if (!emptySlots || emptySlots.length === 0) return

  // Get user's meals
  const { data: rawMeals } = await supabase
    .from('meals')
    .select('id, title, tags, last_planned_date')
    .eq('user_id', user.id)

  if (!rawMeals || rawMeals.length === 0) return

  // Filter out anything tagged as a dessert (or any future non-entree tag) up
  // front — no slot constraint can override this; you don't eat carrot cake
  // for dinner. The user can still hand-pick a dessert via MealPicker.
  const allMeals = rawMeals.filter(
    m => !(m.tags ?? []).some((t: string) => NON_ENTREE_TAGS.includes(t)),
  )

  if (allMeals.length === 0) return

  // Separate recently used (last 14 days) from available
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const recentIds = new Set(
    allMeals
      .filter(m => m.last_planned_date && new Date(m.last_planned_date) >= twoWeeksAgo)
      .map(m => m.id)
  )

  const preferred = allMeals.filter(m => !recentIds.has(m.id))
  const fallback = allMeals // use all if preferred pool is exhausted

  const usedThisRun = new Set<string>()
  const today = new Date().toISOString().split('T')[0]

  for (const slot of emptySlots) {
    const pool = preferred.filter(m => !usedThisRun.has(m.id))
    const fallbackPool = fallback.filter(m => !usedThisRun.has(m.id))

    let eligible = pool.length > 0 ? pool : fallbackPool
    if (eligible.length === 0) continue

    // Filter by ALL constraint tags — meal must have every one
    const constraints: string[] = slot.constraint_tags ?? []
    if (constraints.length > 0) {
      const tagged = eligible.filter(m => constraints.every(c => m.tags?.includes(c)))
      if (tagged.length > 0) eligible = tagged
    }

    const meal = eligible[Math.floor(Math.random() * eligible.length)]
    usedThisRun.add(meal.id)

    await supabase
      .from('weekly_plan_slots')
      .update({ meal_id: meal.id, note: null })
      .eq('id', slot.id)

    await supabase
      .from('meals')
      .update({ last_planned_date: today })
      .eq('id', meal.id)
  }

  revalidatePath('/dashboard')
}
