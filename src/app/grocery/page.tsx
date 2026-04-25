import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { GroceryList } from '@/components/GroceryList'
import { getOrCreatePlan } from '@/app/actions/planner'
import { getGroceryList } from '@/app/actions/groceries'
import { getWeekStartDate } from '@/lib/weeks'

type SearchParams = Promise<{ week?: string }>

function formatWeekRange(weekStartDate: string) {
  const start = new Date(weekStartDate + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

function isCurrentWeek(weekStartDate: string) {
  const now = new Date()
  const day = now.getDay()
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + daysToMonday)
  return monday.toISOString().split('T')[0] === weekStartDate
}

export default async function GroceryPage({ searchParams }: { searchParams: SearchParams }) {
  const { week } = await searchParams
  const weekOffset = parseInt(week ?? '0', 10) || 0

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStartDate = getWeekStartDate(weekOffset)
  const { planId } = await getOrCreatePlan(weekStartDate)
  const groceryData = await getGroceryList(planId)

  const weekLabel = isCurrentWeek(weekStartDate) ? 'This week' : formatWeekRange(weekStartDate)

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      <AppHeader email={user.email!} active="grocery" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <GroceryList
          planId={planId}
          listId={groceryData?.listId ?? null}
          weekLabel={weekLabel}
          weekOffset={weekOffset}
          initialItems={groceryData ? groceryData.items : null}
        />
      </main>
    </div>
  )
}
