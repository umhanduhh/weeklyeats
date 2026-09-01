import { Tag } from './Tag'
import { MealLibraryScreen } from './MealLibraryScreen'
import { RecipeDetailScreen } from './RecipeDetailScreen'
import { GroceryScreen } from './GroceryScreen'

function ScreenCard({
  label,
  caption,
  children,
}: {
  label: string
  caption: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div
        className="bg-white rounded-2xl overflow-hidden relative h-[430px]"
        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 16px 40px rgba(26,26,26,0.10)' }}
      >
        <div className="absolute inset-0 overflow-hidden">{children}</div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[70px]"
          style={{ background: 'linear-gradient(rgba(255,255,255,0), #fff)' }}
        />
      </div>
      <div>
        <div className="font-sans font-semibold uppercase text-[11px] text-teal" style={{ letterSpacing: '0.08em' }}>
          {label}
        </div>
        <div className="font-sans text-sm mt-1" style={{ color: '#5B564C' }}>
          {caption}
        </div>
      </div>
    </div>
  )
}

export function InsideTheApp() {
  return (
    <section id="inside" className="max-w-[1120px] mx-auto px-8 py-[76px]">
      <div className="flex items-end justify-between gap-8 mb-10 flex-wrap">
        <div>
          <h2 className="font-serif text-ink mb-2 text-[38px] -tracking-[0.8px]" style={{ fontWeight: 400 }}>
            A look inside
          </h2>
          <p className="font-sans text-base m-0" style={{ color: '#8A8578' }}>
            Real screens. This is what you sign in to.
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap max-w-[420px]">
          {['vegetarian', 'crockpot', 'glutenFree', 'noDairy', 'freeze', 'redMeat'].map((t) => (
            <Tag key={t} kind={t} size={11} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        <ScreenCard label="Meal library" caption="Everything you've saved, searchable by tag or source.">
          <MealLibraryScreen width={340} />
        </ScreenCard>
        <ScreenCard label="Recipe" caption="Ingredients and steps, kept exactly as written.">
          <RecipeDetailScreen width={340} />
        </ScreenCard>
        <ScreenCard label="Grocery list" caption="Combined quantities, grouped by aisle.">
          <GroceryScreen width={340} />
        </ScreenCard>
      </div>
    </section>
  )
}
