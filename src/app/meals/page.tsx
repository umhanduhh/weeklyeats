import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { MealsList } from '@/components/MealsList'
import { normalizeMeal } from '@/lib/meals-data'

type SearchParams = Promise<{ tab?: string; copied?: string; updated?: string; error?: string }>

export default async function MealsPage({ searchParams }: { searchParams: SearchParams }) {
  const { tab = 'mine', copied, updated, error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [myMealsRes, communityMealsRes] = await Promise.all([
    supabase
      .from('meals')
      .select('id, title, source_url, tags, ingredients, instructions, notes, servings, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('meals')
      .select('id, title, source_url, tags, ingredients, instructions, user_id, servings, calories, protein_g, carbs_g, fat_g')
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
  ])

  const myMeals = (myMealsRes.data ?? []).map(normalizeMeal)
  const communityMeals = (communityMealsRes.data ?? []).map(normalizeMeal)

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      <AppHeader email={user.email!} active="meals" />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Banners */}
        {copied && (
          <div className="mb-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: '#E0F5F5', color: '#007A7A' }}>
            Meal added to your collection.
          </div>
        )}
        {updated && (
          <div className="mb-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: '#E0F5F5', color: '#007A7A' }}>
            Meal updated.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: '#FEF2F2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Tabs + Add buttons.
            Desktop: single row, tabs left, buttons right.
            Mobile: tabs stay on top in a swipeable-feeling row; add buttons
            wrap below as a full-width pair so they're easy to tap and don't
            cram against the tabs. */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 mb-1">
          <div className="flex border-b" style={{ borderColor: '#E2E8F0' }}>
            <Link
              href="/meals?tab=mine"
              className="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={{
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: tab === 'mine' ? '#00A6A6' : '#64748B',
                borderBottomColor: tab === 'mine' ? '#00A6A6' : 'transparent',
                textDecoration: 'none',
              }}
            >
              My Meals {myMeals.length > 0 && <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>({myMeals.length})</span>}
            </Link>
            <Link
              href="/meals?tab=community"
              className="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={{
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: tab === 'community' ? '#00A6A6' : '#64748B',
                borderBottomColor: tab === 'community' ? '#00A6A6' : 'transparent',
                textDecoration: 'none',
              }}
            >
              Community {communityMeals.length > 0 && <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>({communityMeals.length})</span>}
            </Link>
          </div>

          {tab === 'mine' && (
            <div className="flex gap-2">
              <Link
                href="/meals/bulk-import"
                className="flex-1 md:flex-initial inline-flex items-center justify-center"
                style={{
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '8px',
                  color: '#64748B',
                  textDecoration: 'none',
                  background: '#fff',
                  minHeight: '44px',
                }}
              >
                ↑ Bulk import
              </Link>
              <Link
                href="/meals/new"
                className="btn-primary flex-1 md:flex-initial"
                style={{ fontSize: '0.875rem' }}
              >
                + Add meal
              </Link>
            </div>
          )}
        </div>

        {/* My Meals */}
        {tab === 'mine' && (
          <MealsList meals={myMeals} mode="mine" currentUserId={user.id} />
        )}

        {/* Community Meals */}
        {tab === 'community' && (
          <MealsList meals={communityMeals} mode="community" currentUserId={user.id} />
        )}
      </div>
    </div>
  )
}
