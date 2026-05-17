/**
 * Server-side helpers for shaping meal rows before they cross the RSC boundary.
 *
 * Some legacy rows store ingredients in shapes other than `[{text: string}]`
 * (nested arrays from old import paths, raw strings, etc.). Anything we hand
 * across the RSC boundary must be a flat, predictable structure or React will
 * refuse to serialize it ("Maximum array nesting exceeded"). The sanitizer
 * lives here so every meal-displaying route (list, detail, dashboard joins)
 * runs the same normalization.
 */

export type Ingredient = { text: string }

/** Flatten any reasonable ingredient shape (string, {text}, {name,quantity,unit},
 *  nested arrays) into a flat array of {text}. Bounded depth so a malformed row
 *  can't stack-overflow the server. */
export function sanitizeIngredients(value: unknown): Ingredient[] {
  const out: Ingredient[] = []
  function walk(v: unknown, depth: number) {
    if (depth > 3) return
    if (Array.isArray(v)) {
      for (const item of v) walk(item, depth + 1)
      return
    }
    if (typeof v === 'string') {
      const trimmed = v.trim()
      if (trimmed) out.push({ text: trimmed })
      return
    }
    if (v && typeof v === 'object') {
      const o = v as { text?: unknown; name?: unknown; quantity?: unknown; unit?: unknown }
      if (typeof o.text === 'string' && o.text.trim()) {
        out.push({ text: o.text.trim() })
        return
      }
      const parts = [o.quantity, o.unit, o.name].filter(p => typeof p === 'string' && p) as string[]
      if (parts.length > 0) out.push({ text: parts.join(' ') })
    }
  }
  walk(value, 0)
  return out
}

/** Common subset of meal columns required to render a MealCard. Both the
 *  /meals listing route and the /meals/[id] detail route normalize to this. */
export type RawMealRow = {
  id: string
  title: string
  source_url: string | null
  tags: string[] | null
  ingredients: unknown
  instructions: string | null
  notes?: string | null
  user_id?: string
  servings?: number | null
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
}

export function normalizeMeal(m: RawMealRow) {
  return { ...m, ingredients: sanitizeIngredients(m.ingredients) }
}
