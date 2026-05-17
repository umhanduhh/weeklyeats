import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { MealCard } from '@/components/MealCard'
import { EditMealLink } from '@/components/EditMealLink'
import { normalizeMeal } from '@/lib/meals-data'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ from?: string }>

/**
 * Read-only recipe view. Linked from the planner (tap a scheduled meal) and
 * usable for sharing — any signed-in user can open this URL for a public meal,
 * not just the owner.
 *
 * Renders the existing MealCard with the accordion pre-expanded so ingredients
 * and instructions are visible without an extra tap. The owner sees an Edit
 * action; everyone else sees a read-only card.
 *
 * `?from=planner` swaps the "← Meals" back link for "← Planner" so a tap from
 * the dashboard returns where it came from. Other origins fall back to /meals.
 */
export default async function MealDetailPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  const { from } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Owner OR public. RLS should also enforce this server-side, but the explicit
  // `.or(...)` lets us 404 cleanly rather than relying on a silent empty result.
  const { data: meal } = await supabase
    .from('meals')
    .select('id, title, source_url, tags, ingredients, instructions, notes, user_id, servings, calories, protein_g, carbs_g, fat_g, is_public')
    .eq('id', id)
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .maybeSingle()

  if (!meal) notFound()

  const isOwner = meal.user_id === user.id
  const normalized = normalizeMeal(meal)

  // Pick the back destination. Default to the meals list — that's the broadest
  // "return where the user came from" guess when the param is absent.
  const backHref =
    from === 'planner' ? '/dashboard'
    : from === 'grocery' ? '/grocery'
    : '/meals'
  const backLabel =
    from === 'planner' ? '← Planner'
    : from === 'grocery' ? '← Grocery'
    : '← Meals'

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      <AppHeader email={user.email!} active={from === 'planner' ? 'planner' : from === 'grocery' ? 'grocery' : 'meals'} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={backHref}
            style={{
              color: '#00A6A6',
              fontSize: '0.9375rem',
              textDecoration: 'none',
              // Tap target — without padding the bare text link is hard to hit
              // on mobile.
              padding: '8px 4px',
              margin: '-8px -4px',
            }}
          >
            {backLabel}
          </Link>
        </div>

        <MealCard
          meal={normalized}
          defaultOpen
          canCalculateMacros={isOwner}
          action={isOwner ? <EditMealLink mealId={meal.id} /> : null}
        />
      </div>
    </div>
  )
}
