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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        textDecoration: 'none',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    </Link>
  )
}
