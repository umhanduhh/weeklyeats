#!/usr/bin/env node
/**
 * Backfill per-serving macros for every meal where calories IS NULL.
 *
 *   Usage:
 *     node scripts/backfill-macros.mjs
 *
 *   Requires in .env.local (or process env):
 *     NEXT_PUBLIC_SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY   ← grab from Supabase dashboard → Project Settings → API
 *     ANTHROPIC_API_KEY
 *
 * Outputs:
 *   migrations/2026_05_06_macros_backfill.sql — review then run in the Supabase SQL editor.
 *   scripts/.macros-cache.json — progress cache so the script resumes on interruption.
 *
 * Why not write directly to the DB?
 *   Same pattern as the tag backfill — keep a reviewable SQL artifact so you
 *   can sanity-check before applying.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_SQL = path.join(ROOT, 'migrations', '2026_05_06_macros_backfill.sql')
const CACHE_PATH = path.join(__dirname, '.macros-cache.json')

// --- env loading (tiny, no extra deps) ---------------------------------------
function loadDotenv(p) {
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/i)
    if (!m) continue
    if (process.env[m[1]] != null) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    process.env[m[1]] = v
  }
}
loadDotenv(path.join(ROOT, '.env.local'))
// Fallback: other worktree may hold the env during dev.
loadDotenv(path.resolve(ROOT, '..', 'zealous-moore', '.env.local'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

function bail(msg) {
  console.error(`\nerror: ${msg}\n`)
  process.exit(1)
}
if (!SUPABASE_URL) bail('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!SERVICE_ROLE) {
  bail(
    'Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
    '  Get it from Supabase dashboard → Project Settings → API → service_role key,\n' +
    '  then add to .env.local. (Keep it secret — server-only.)',
  )
}
if (!ANTHROPIC_KEY) bail('Missing ANTHROPIC_API_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY, maxRetries: 8 })

// --- macro estimation (mirrors src/lib/macros.ts) ---------------------------
const RANGES = {
  servings:  [1, 50],
  calories:  [0, 5000],
  protein_g: [0, 500],
  carbs_g:   [0, 500],
  fat_g:     [0, 500],
}
function clampInt(v, key) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return null
  const [lo, hi] = RANGES[key]
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

function ingredientsToText(value) {
  if (!Array.isArray(value)) return ''
  const lines = []
  for (const item of value) {
    if (typeof item === 'string') {
      lines.push(item)
    } else if (item && typeof item === 'object') {
      if (typeof item.text === 'string' && item.text) lines.push(item.text)
      else if (item.name) lines.push([item.quantity, item.unit, item.name].filter(Boolean).join(' '))
    }
  }
  return lines.join('\n')
}

async function estimateMacros(title, ingredientsText, instructionsText) {
  if (!ingredientsText.trim()) return null
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Estimate the per-serving macros for this recipe.

Recipe title: ${title}

Ingredients:
${ingredientsText}

Instructions:
${instructionsText || '(none)'}

Step 1 — Determine serving count:
- FIRST, scan ingredients and instructions for explicit yield language ("Serves 4", "Makes 6 servings", "Yield: 8"). If found, use it verbatim.
- Otherwise, estimate servings from total food volume. A serving is one adult portion of a main dish (~400-700 calories typical).

Step 2 — Estimate TOTAL macros for the whole recipe using standard USDA-style values:
- 1 lb raw chicken breast ≈ 540 cal, 110g protein, 0g carbs, 6g fat
- 1 lb 93/7 ground beef ≈ 700 cal, 95g protein, 0g carbs, 33g fat
- 1 cup uncooked rice ≈ 680 cal, 13g protein, 148g carbs, 1g fat
- 1 tbsp olive oil ≈ 120 cal, 0p, 0c, 14f

Step 3 — Divide totals by servings to get PER-SERVING macros. Round to integers.

Return ONLY this JSON, no markdown, no explanation:
{"servings": 4, "calories": 520, "protein_g": 35, "carbs_g": 50, "fat_g": 18}`,
    }],
  })
  const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
  const match = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').match(/\{[\s\S]*\}/)
  if (!match) return null
  let parsed
  try { parsed = JSON.parse(match[0]) } catch { return null }
  const out = {
    servings:  clampInt(parsed.servings, 'servings'),
    calories:  clampInt(parsed.calories, 'calories'),
    protein_g: clampInt(parsed.protein_g, 'protein_g'),
    carbs_g:   clampInt(parsed.carbs_g, 'carbs_g'),
    fat_g:     clampInt(parsed.fat_g, 'fat_g'),
  }
  for (const k of Object.keys(out)) if (out[k] == null) return null
  return out
}

// --- rate limiter -----------------------------------------------------------
// 50 RPM ceiling on the org. Cap to ~42 RPM to leave headroom.
const REQ_INTERVAL_MS = 1000 / 0.7
let lastReq = 0
const reqMutex = { busy: false, queue: [] }
async function throttle() {
  return new Promise(resolve => {
    const tick = () => {
      if (reqMutex.busy) { reqMutex.queue.push(tick); return }
      reqMutex.busy = true
      const wait = Math.max(0, lastReq + REQ_INTERVAL_MS - Date.now())
      setTimeout(() => {
        lastReq = Date.now()
        reqMutex.busy = false
        const next = reqMutex.queue.shift()
        if (next) next()
        resolve()
      }, wait)
    }
    tick()
  })
}

// --- main -------------------------------------------------------------------
function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {}
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) } catch { return {} }
}
function saveCache(c) { fs.writeFileSync(CACHE_PATH, JSON.stringify(c)) }

async function main() {
  console.log('Fetching meals with NULL calories...')
  const { data: meals, error } = await supabase
    .from('meals')
    .select('id, title, ingredients, instructions')
    .is('calories', null)
    .order('created_at', { ascending: true })
  if (error) bail(`Supabase select failed: ${error.message}`)
  console.log(`Found ${meals.length} meals to backfill.`)
  if (meals.length === 0) {
    console.log('Nothing to do.')
    return
  }

  const cache = loadCache()
  const todo = meals.filter(m => !(m.id in cache))
  console.log(`Cache has ${Object.keys(cache).length} entries; ${todo.length} new to process.`)

  const CONCURRENCY = 4
  let done = 0
  let failed = 0

  async function worker(slice) {
    for (const m of slice) {
      await throttle()
      const ingText = ingredientsToText(m.ingredients)
      try {
        const macros = await estimateMacros(m.title ?? '', ingText, m.instructions ?? '')
        cache[m.id] = macros ?? { error: 'unparseable' }
        if (!macros) failed++
      } catch (e) {
        cache[m.id] = { error: String(e?.message ?? e).slice(0, 200) }
        failed++
      }
      done++
      if (done % 5 === 0) {
        saveCache(cache)
        console.log(`  ${done}/${todo.length} (failed ${failed})`)
      }
    }
  }

  const slices = Array.from({ length: CONCURRENCY }, () => [])
  todo.forEach((m, i) => slices[i % CONCURRENCY].push(m))
  await Promise.all(slices.map(worker))
  saveCache(cache)
  console.log(`\nFinished. Total processed: ${done}, failed: ${failed}`)

  // Build SQL migration
  fs.mkdirSync(path.dirname(OUT_SQL), { recursive: true })
  const out = []
  out.push('-- Macro backfill (generated by scripts/backfill-macros.mjs)')
  out.push(`-- ${new Date().toISOString()}`)
  out.push('-- Review then run in Supabase SQL editor. Wrap in transaction.')
  out.push('')
  out.push('BEGIN;')
  out.push('')
  let updates = 0
  let skipped = 0
  for (const m of meals) {
    const r = cache[m.id]
    if (!r || r.error) { skipped++; continue }
    const safe = (m.title || '').replace(/--/g, '- -').slice(0, 80)
    out.push(`-- ${safe}`)
    out.push(`UPDATE meals SET servings=${r.servings}, calories=${r.calories}, protein_g=${r.protein_g}, carbs_g=${r.carbs_g}, fat_g=${r.fat_g} WHERE id = '${m.id}';`)
    updates++
  }
  out.push('')
  out.push('COMMIT;')
  fs.writeFileSync(OUT_SQL, out.join('\n') + '\n')
  console.log(`\nWrote ${OUT_SQL}`)
  console.log(`  ${updates} UPDATE statements, ${skipped} meals skipped (failed estimates — re-run to retry)`)
  if (skipped > 0) {
    console.log('\nMeals that failed:')
    for (const m of meals) {
      const r = cache[m.id]
      if (!r || r.error) console.log(`  - ${m.title}: ${r?.error ?? 'no result'}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
