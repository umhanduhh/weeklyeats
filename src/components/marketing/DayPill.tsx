export function DayPill({ day, size = 14, dim = false }: { day: string; size?: number; dim?: boolean }) {
  return (
    <span
      className="day-pill"
      style={{ fontSize: size, padding: `${size * 0.45}px ${size * 0.95}px`, opacity: dim ? 0.55 : 1, letterSpacing: '0.2px' }}
    >
      {day}
    </span>
  )
}
