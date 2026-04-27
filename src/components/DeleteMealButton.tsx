'use client'

import { useTransition } from 'react'
import { deleteMeal } from '@/app/actions/meals'

export function DeleteMealButton({ mealId }: { mealId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this meal? This can\'t be undone.')) return
    const formData = new FormData()
    formData.set('meal_id', mealId)
    startTransition(() => deleteMeal(formData))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Delete meal"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#FEF2F2',
        color: '#991B1B',
        border: 'none',
        fontSize: '1rem',
        cursor: isPending ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        flexShrink: 0,
        opacity: isPending ? 0.5 : 1,
      }}
    >
      ×
    </button>
  )
}
