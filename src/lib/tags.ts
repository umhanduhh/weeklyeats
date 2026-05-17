export const PRESET_TAGS = [
  { value: 'red-meat',      label: 'Red Meat',      className: 'tag tag-red-meat' },
  { value: 'crockpot',      label: 'Crockpot',      className: 'tag tag-crockpot' },
  { value: 'vegetarian',    label: 'Vegetarian',    className: 'tag tag-vegetarian' },
  { value: 'no-dairy',      label: 'No Dairy',      className: 'tag tag-no-dairy' },
  { value: 'gluten-free',   label: 'Gluten Free',   className: 'tag tag-gluten-free' },
  { value: 'good-to-freeze',label: 'Good to Freeze',className: 'tag tag-freeze' },
  { value: 'salad',         label: 'Salad',         className: 'tag tag-salad' },
  { value: 'soup',          label: 'Soup',          className: 'tag tag-soup' },
  // Desserts are excluded from auto-generation in planner.ts so a randomly
  // picked dinner never ends up being carrot cake. Users can still pin a
  // dessert to a slot manually through MealPicker.
  { value: 'dessert',       label: 'Dessert',       className: 'tag tag-dessert' },
]

/**
 * Tags that mark a meal as not-a-meal — excluded from auto-population in
 * generateWeek regardless of any constraints the user has set on the slot.
 *
 * Lives here (not in planner.ts) so the planner stays focused on scheduling
 * logic and any future "not a real entree" tags (e.g. 'side', 'breakfast')
 * have one place to land.
 */
export const NON_ENTREE_TAGS: readonly string[] = ['dessert']

export function getTagClass(value: string) {
  return PRESET_TAGS.find(t => t.value === value)?.className ?? 'tag tag-custom'
}

export function getTagLabel(value: string) {
  return PRESET_TAGS.find(t => t.value === value)?.label ?? value
}
