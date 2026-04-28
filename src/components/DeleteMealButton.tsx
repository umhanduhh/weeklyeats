'use client'

import { useTransition } from 'react'
import { deleteMeal } from '@/app/actions/meals'

type Props = {
  mealId: string
  isPublic?: boolean
}

export function DeleteMealButton({ mealId, isPublic = false }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const message = isPublic
      ? 'Remove this recipe from your collection? It will stay available in the Community feed for others.'
      : 'Delete this recipe? This can\'t be undone.'
    if (!confirm(message)) return
    const formData = new FormData()
    formData.set('meal_id', mealId)
    startTransition(() => deleteMeal(formData))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={{
        width: '100%',
        background: 'none',
        color: '#991B1B',
        border: 'none',
        padding: '8px 12px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: isPending ? 'default' : 'pointer',
        opacity: isPending ? 0.5 : 1,
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
      }}
    >
      {isPending
        ? (isPublic ? 'Removing…' : 'Deleting…')
        : (isPublic ? 'Remove from my collection' : 'Delete this recipe')}
    </button>
  )
}
