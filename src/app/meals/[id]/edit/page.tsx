import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/AppHeader'
import { MealForm } from '@/components/MealForm'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ error?: string }>

// Walks any reasonable ingredient shape (including legacy nested arrays) and
// flattens it to one string per line. Bounded depth so a malformed row can't
// stack-overflow this on the server.
function ingredientsToText(value: unknown): string {
  const lines: string[] = []
  function walk(v: unknown, depth: number) {
    if (depth > 3) return
    if (Array.isArray(v)) {
      for (const item of v) walk(item, depth + 1)
      return
    }
    if (typeof v === 'string') {
      const trimmed = v.trim()
      if (trimmed) lines.push(trimmed)
      return
    }
    if (v && typeof v === 'object') {
      const o = v as { text?: unknown; name?: unknown; quantity?: unknown; unit?: unknown }
      if (typeof o.text === 'string' && o.text.trim()) {
        lines.push(o.text.trim())
        return
      }
      const parts = [o.quantity, o.unit, o.name].filter(p => typeof p === 'string' && p) as string[]
      if (parts.length > 0) lines.push(parts.join(' '))
    }
  }
  walk(value, 0)
  return lines.join('\n')
}

export default async function EditMealPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: meal } = await supabase
    .from('meals')
    .select('id, title, source_url, ingredients, instructions, notes, tags, is_public, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!meal) notFound()

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      <AppHeader email={user.email!} active="meals" />

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/meals" style={{ color: '#00A6A6', fontSize: '0.9375rem', textDecoration: 'none' }}>
            ← Meals
          </Link>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: '#1A1A1A' }}>
            Edit meal
          </h1>
        </div>

        {error && (
          <div className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ background: '#FEF2F2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <MealForm
          mode="edit"
          mealId={meal.id}
          initialTitle={meal.title ?? ''}
          initialSourceUrl={meal.source_url ?? ''}
          initialIngredients={ingredientsToText(meal.ingredients)}
          initialInstructions={meal.instructions ?? ''}
          initialNotes={meal.notes ?? ''}
          initialTags={meal.tags ?? []}
          initialIsPublic={!!meal.is_public}
        />
      </div>
    </div>
  )
}
