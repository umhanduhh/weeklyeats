export function getWeekStartDate(offset: number = 0): string {
  const now = new Date()
  const day = now.getDay() // 0 = Sun
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + daysToMonday + offset * 7)
  return monday.toISOString().split('T')[0]
}
