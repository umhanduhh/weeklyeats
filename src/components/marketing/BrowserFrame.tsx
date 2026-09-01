export function BrowserFrame({
  children,
  label = 'weeklyeats.app/planner',
  flat = false,
}: {
  children: React.ReactNode
  label?: string
  flat?: boolean
}) {
  return (
    <div
      className={`bg-white rounded-[14px] overflow-hidden ${
        flat ? 'border border-[#EFE9E0] rounded-[10px]' : ''
      }`}
      style={flat ? undefined : { boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 20px 50px rgba(26,26,26,0.12)' }}
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FAF7F2] border-b border-[#EBE5DC]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[9px] h-[9px] rounded-full bg-[#E5DED4]" />
          ))}
        </div>
        <span className="ml-1.5 font-mono text-[11px] text-[#9A9084] bg-white border border-[#EBE5DC] rounded-full px-3 py-[3px]">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
