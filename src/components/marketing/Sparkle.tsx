export function Sparkle({ size = 16, className = 'text-teal' }: { size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-block leading-none ${className}`} style={{ width: size, height: size, fontSize: size }}>
      ✦
    </span>
  )
}
