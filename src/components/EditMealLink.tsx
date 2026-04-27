import Link from 'next/link'

export function EditMealLink({ mealId }: { mealId: string }) {
  return (
    <Link
      href={`/meals/${mealId}/edit`}
      title="Edit meal"
      aria-label="Edit meal"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#E0F5F5',
        color: '#007A7A',
        border: 'none',
        fontSize: '0.875rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        flexShrink: 0,
        textDecoration: 'none',
      }}
    >
      ✎
    </Link>
  )
}
