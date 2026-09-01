export function Wordmark({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-baseline font-serif"
      style={{ fontSize: size, gap: size * 0.18, color: dark ? '#fff' : 'var(--color-ink)', letterSpacing: '-0.5px' }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full text-white font-serif flex-shrink-0 self-center"
        style={{ width: size * 0.85, height: size * 0.85, background: 'var(--color-teal)', fontSize: size * 0.55 }}
      >
        w
      </span>
      <span>weeklyeats</span>
    </span>
  )
}
