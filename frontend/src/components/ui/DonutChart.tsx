interface DonutChartProps {
  rate: number
  size?: number
  color?: string
}

export default function DonutChart({ rate, size = 80, color = '#f97316' }: DonutChartProps) {
  const pct = Math.min(Math.max(rate, 0), 100)
  const r = 30
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="35"
          cy="35"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 35 35)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-800">{pct.toFixed(1)}%</span>
      </div>
    </div>
  )
}
