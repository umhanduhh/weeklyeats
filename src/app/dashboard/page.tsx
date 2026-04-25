import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { WeeklyPlanner } from '@/components/WeeklyPlanner'
import { getOrCreatePlan } from '@/app/actions/planner'
import { getWeekStartDate } from '@/lib/weeks'

type SearchParams = Promise<{ week?: string }>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { week } = await searchParams
  const weekOffset = parseInt(week ?? '0', 10) || 0

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStartDate = getWeekStartDate(weekOffset)
  const { planId, slots } = await getOrCreatePlan(weekStartDate)

  // Fetch meals for the picker
  const [myMealsRes, communityMealsRes] = await Promise.all([
    supabase
      .from('meals')
      .select('id, title, tags, source_url')
      .eq('user_id', user.id)
      .order('title'),
    supabase
      .from('meals')
      .select('id, title, tags, source_url')
      .eq('is_public', true)
      .neq('user_id', user.id)
      .order('title'),
  ])

  const myMeals = myMealsRes.data ?? []
  const communityMeals = communityMealsRes.data ?? []

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      <AppHeader email={user.email!} active="planner" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <WeeklyPlanner
          planId={planId}
          initialSlots={slots as any}
          weekStartDate={weekStartDate}
          weekOffset={weekOffset}
          myMeals={myMeals}
          communityMeals={communityMeals}
        />
      </main>
    </div>
  )
}
