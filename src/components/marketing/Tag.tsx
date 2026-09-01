const TAG_META: Record<string, { cls: string; label: string }> = {
  vegetarian: { cls: 'tag-vegetarian', label: 'Vegetarian' },
  crockpot: { cls: 'tag-crockpot', label: 'Crockpot' },
  glutenFree: { cls: 'tag-gluten-free', label: 'Gluten-free' },
  redMeat: { cls: 'tag-red-meat', label: 'Red meat' },
  noDairy: { cls: 'tag-no-dairy', label: 'No dairy' },
  freeze: { cls: 'tag-freeze', label: 'Freeze-friendly' },
  breakfast: { cls: 'tag-breakfast', label: 'Breakfast' },
  lunch: { cls: 'tag-lunch', label: 'Lunch' },
  snack: { cls: 'tag-snack', label: 'Snack' },
  salad: { cls: 'tag-salad', label: 'Salad' },
  soup: { cls: 'tag-soup', label: 'Soup' },
}

export function Tag({ kind, size = 14 }: { kind: string; size?: number }) {
  const meta = TAG_META[kind] ?? TAG_META.snack
  return (
    <span className={`tag ${meta.cls}`} style={{ fontSize: size, padding: `${size * 0.45}px ${size * 0.95}px` }}>
      {meta.label}
    </span>
  )
}
