type Status = 'green' | 'yellow' | 'red'

const config: Record<Status, { label: string; cls: string }> = {
  green: { label: '양호', cls: 'bg-green-100 text-green-700' },
  yellow: { label: '주의', cls: 'bg-yellow-100 text-yellow-700' },
  red: { label: '위험', cls: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, cls } = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
