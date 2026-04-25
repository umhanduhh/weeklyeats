export const GROCERY_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry & Dry Goods',
  'Frozen',
  'Bakery',
  'Beverages',
  'Condiments & Sauces',
  'Other',
]

export const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥦',
  'Meat & Seafood': '🥩',
  'Dairy & Eggs': '🥛',
  'Pantry & Dry Goods': '🥫',
  'Frozen': '🧊',
  'Bakery': '🍞',
  'Beverages': '🧃',
  'Condiments & Sauces': '🫙',
  'Other': '📦',
}

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? '📦'
}
