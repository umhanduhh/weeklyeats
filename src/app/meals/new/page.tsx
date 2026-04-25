import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { MealForm } from '@/components/MealForm'

type SearchParams = Promise<{ saved?: string; error?: string }>

export default async function NewMealPage({ searchParams }: { searchParams: SearchParams }) {
  const { saved, error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      <AppHeader email={user.email!} active="meals" />

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/meals" style={{ color: '#00A6A6', fontSize: '0.9375rem', textDecoration: 'none' }}>
            ← Meals
          </Link>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: '#1A1A1A' }}>
            Add meal
          </h1>
        </div>

        {saved && (
          <div className="mb-5 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: '#E0F5F5', color: '#007A7A' }}>
            Meal saved! Add another below.
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ background: '#FEF2F2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <MealForm />
      </div>
    </div>
  )
}
