interface ProgressBarProps {
  rate: number
  color?: 'green' | 'yellow' | 'red' | 'orange'
  height?: string
  showLabel?: boolean
}

const colorMap = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  orange: 'bg-primary-500',
}

export default function ProgressBar({
  rate,
  color = 'orange',
  height = 'h-2',
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min(Math.max(rate, 0), 100)
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-200 rounded-full ${height}`}>
        <div
          className={`${height} rounded-full transition-all ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 w-10 text-right">{rate.toFixed(1)}%</span>
      )}
    </div>
  )
}
