import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Homepage } from '@/components/marketing/Homepage'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <Homepage />
}
