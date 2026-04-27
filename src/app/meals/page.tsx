import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { MealCard } from '@/components/MealCard'
import { copyMealToCollection } from '@/app/actions/meals'
import { DeleteMealButton } from '@/components/DeleteMealButton'

type SearchParams = Promise<{ tab?: string; copied?: string; error?: string }>

export default async function MealsPage({ searchParams }: { searchParams: SearchParams }) {
  const { tab = 'mine', copied, error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [myMealsRes, communityMealsRes] = await Promise.all([
    supabase
      .from('meals')
      .select('id, title, source_url, tags, ingredients, instructions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('meals')
      .select('id, title, source_url, tags, ingredients, instructions, user_id')
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
  ])

  const myMeals = myMealsRes.data ?? []
  const communityMeals = communityMealsRes.data ?? []

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
        {error && (
          <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: '#FEF2F2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Tabs + Add button */}
        <div className="flex items-center justify-between mb-1">
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
            <Link href="/meals/new" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
              + Add meal
            </Link>
          )}
        </div>

        {/* My Meals */}
        {tab === 'mine' && (
          <div className="mt-4 space-y-2">
            {myMeals.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#94A3B8' }}>
                <p style={{ fontSize: '1rem' }}>No meals yet.</p>
                <Link href="/meals/new" className="btn-primary inline-flex mt-4" style={{ fontSize: '0.875rem', padding: '8px 20px' }}>
                  Add your first meal
                </Link>
              </div>
            ) : (
              myMeals.map(meal => <MealCard key={meal.id} meal={meal} action={<DeleteMealButton mealId={meal.id} />} />)
            )}
          </div>
        )}

        {/* Community Meals */}
        {tab === 'community' && (
          <div className="mt-4 space-y-2">
            {communityMeals.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#94A3B8' }}>
                <p style={{ fontSize: '1rem' }}>No public meals from the community yet.</p>
              </div>
            ) : (
              communityMeals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  action={meal.user_id !== user!.id ? (
                    <form action={copyMealToCollection}>
                      <input type="hidden" name="meal_id" value={meal.id} />
                      <button
                        type="submit"
                        title="Add to my collection"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#E0F5F5',
                          color: '#00A6A6',
                          border: 'none',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        +
                      </button>
                    </form>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', padding: '6px 0' }}>Yours</span>
                  )}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
