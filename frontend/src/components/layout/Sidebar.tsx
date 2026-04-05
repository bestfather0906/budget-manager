import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  PieChart,
  FolderKanban,
  Receipt,
  BarChart2,
  Settings,
  Plus,
  Wallet,
  CreditCard,
} from 'lucide-react'
import { getProjects } from '../../api/projects'
import type { ProjectSummary } from '../../types'

export default function Sidebar() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getProjects().then((r) => setProjects(r.data)).catch(() => {})
  }, [location.pathname])

  const projectMenus = (projectId: number) => [
    { label: '집행현황', to: `/projects/${projectId}`, icon: <Wallet size={14} /> },
    { label: '비목 관리', to: `/projects/${projectId}/categories`, icon: <FolderKanban size={14} /> },
    { label: '지출내역', to: `/projects/${projectId}/expenses`, icon: <Receipt size={14} /> },
    { label: '월별 현황', to: `/projects/${projectId}/monthly`, icon: <BarChart2 size={14} /> },
  ]

  return (
    <aside className="w-60 min-h-screen bg-[#0F172A] flex flex-col text-slate-300 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Financial Manager</p>
        <h1 className="text-white font-bold text-base mt-0.5">사업예산 관리</h1>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* 전체 예산 현황 */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-primary-500 text-white font-medium'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`
          }
        >
          <PieChart size={16} />
          전체 예산 현황
        </NavLink>

        {/* 결제수단 관리 */}
        <NavLink
          to="/payment-methods"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mt-1 ${
              isActive
                ? 'bg-primary-500 text-white font-medium'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`
          }
        >
          <CreditCard size={16} />
          결제수단 관리
        </NavLink>

        {/* 사업별 메뉴 */}
        <div className="mt-4 space-y-4">
          {projects.map((p) => (
            <div key={p.id}>
              {/* 사업명 헤더 */}
              <div className="flex items-center gap-2 px-3 mb-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    p.status_color === 'red'
                      ? 'bg-red-400'
                      : p.status_color === 'yellow'
                        ? 'bg-yellow-400'
                        : 'bg-green-400'
                  }`}
                />
                <span className="text-xs font-semibold text-slate-300 truncate">{p.name}</span>
              </div>
              {/* 하위 메뉴 (항상 펼침) */}
              <div className="ml-4 space-y-0.5 border-l border-slate-700 pl-3">
                {projectMenus(p.id).map((m) => (
                  <NavLink
                    key={m.to}
                    to={m.to}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'text-primary-400 bg-slate-800 font-medium'
                          : 'text-slate-500 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    {m.icon}
                    {m.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 새 프로젝트 추가 */}
        {projects.length < 3 && (
          <button
            onClick={() => navigate('/projects/new')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-primary-400 hover:bg-slate-800 transition-colors mt-4"
          >
            <Plus size={14} />새 사업 추가
          </button>
        )}

        <div className="pt-4 border-t border-slate-800 mt-4">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white font-medium'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`
            }
          >
            <Settings size={16} />
            설정
          </NavLink>
        </div>
      </nav>

      {/* Bottom user */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
            M
          </div>
          <div>
            <p className="text-xs text-white font-medium">Manager</p>
            <p className="text-[10px] text-slate-500">관리자</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
