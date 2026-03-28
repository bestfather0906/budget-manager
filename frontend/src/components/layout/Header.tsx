import { Bell, HelpCircle, Search } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {title ? (
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      ) : (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search budget data..."
            className="pl-9 pr-4 py-1.5 text-sm bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} className="text-gray-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <HelpCircle size={18} className="text-gray-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
          M
        </div>
      </div>
    </header>
  )
}
