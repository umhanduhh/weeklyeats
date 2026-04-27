export const PRESET_TAGS = [
  { value: 'red-meat',      label: 'Red Meat',      className: 'tag tag-red-meat' },
  { value: 'crockpot',      label: 'Crockpot',      className: 'tag tag-crockpot' },
  { value: 'vegetarian',    label: 'Vegetarian',    className: 'tag tag-vegetarian' },
  { value: 'no-dairy',      label: 'No Dairy',      className: 'tag tag-no-dairy' },
  { value: 'gluten-free',   label: 'Gluten Free',   className: 'tag tag-gluten-free' },
  { value: 'good-to-freeze',label: 'Good to Freeze',className: 'tag tag-freeze' },
  { value: 'salad',         label: 'Salad',         className: 'tag tag-salad' },
  { value: 'soup',          label: 'Soup',          className: 'tag tag-soup' },
]

export function getTagClass(value: string) {
  return PRESET_TAGS.find(t => t.value === value)?.className ?? 'tag tag-custom'
}

export function getTagLabel(value: string) {
  return PRESET_TAGS.find(t => t.value === value)?.label ?? value
}
