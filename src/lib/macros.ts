import Anthropic from '@anthropic-ai/sdk'

export type Macros = {
  servings: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

// Hard caps — anything outside is treated as a hallucination and clamped.
// These match the CHECK constraints in 2026_05_06_macros.sql so server-side
// inserts never get rejected.
const RANGES = {
  servings: [1, 50],
  calories: [0, 5000],
  protein_g: [0, 500],
  carbs_g: [0, 500],
  fat_g: [0, 500],
} as const

function clampInt(v: unknown, key: keyof typeof RANGES): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return null
  const [lo, hi] = RANGES[key]
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

/**
 * Ask Haiku to estimate per-serving macros for a recipe.
 *
 * Strategy:
 *  1. The prompt instructs Claude to first scan the ingredients/instructions
 *     for explicit yield language ("Serves 4", "Makes 6", "Yield: 8") and use
 *     that as the serving count.
 *  2. If no yield is stated, Claude estimates servings from total food volume.
 *  3. Per-serving macros are then derived from total recipe macros / servings.
 *
 * Throws on API errors so the caller can decide whether to retry. Returns
 * clamped integers; null on unparseable response.
 */
export async function estimateMacros(
  title: string,
  ingredientsText: string,
  instructionsText: string,
): Promise<Macros | null> {
  if (!ingredientsText.trim()) return null

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Estimate the per-serving macros for this recipe.

Recipe title: ${title}

Ingredients:
${ingredientsText}

Instructions:
${instructionsText || '(none)'}

Step 1 — Determine serving count:
- FIRST, scan the ingredients and instructions for explicit yield language like "Serves 4", "Makes 6 servings", "Yield: 8", "8 portions". If you find one, use it verbatim.
- If no yield is stated, estimate servings from total volume of food. A "serving" is one adult portion of a main dish (~400-700 calories typical).

Step 2 — Estimate TOTAL macros for the whole recipe based on ingredient quantities. Use standard USDA-style values:
- 1 lb raw chicken breast ≈ 540 cal, 110g protein, 0g carbs, 6g fat
- 1 lb 93/7 ground beef ≈ 700 cal, 95g protein, 0g carbs, 33g fat
- 1 cup uncooked rice ≈ 680 cal, 13g protein, 148g carbs, 1g fat
- 1 tbsp olive oil ≈ 120 cal, 0p, 0c, 14f
- (etc.)

Step 3 — Divide totals by servings to get PER-SERVING macros. Round each to the nearest integer.

Return ONLY this JSON shape, no explanation, no markdown:
{"servings": 4, "calories": 520, "protein_g": 35, "carbs_g": 50, "fat_g": 18}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()
  // Pull the first {...} block to survive minor prose leakage.
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return null
  }

  const out = {
    servings: clampInt(parsed.servings, 'servings'),
    calories: clampInt(parsed.calories, 'calories'),
    protein_g: clampInt(parsed.protein_g, 'protein_g'),
    carbs_g: clampInt(parsed.carbs_g, 'carbs_g'),
    fat_g: clampInt(parsed.fat_g, 'fat_g'),
  }

  // All 5 fields must come back valid — partial macros aren't useful and would
  // hide the failure mode in the UI.
  if (
    out.servings == null ||
    out.calories == null ||
    out.protein_g == null ||
    out.carbs_g == null ||
    out.fat_g == null
  ) {
    return null
  }

  return out as Macros
}
