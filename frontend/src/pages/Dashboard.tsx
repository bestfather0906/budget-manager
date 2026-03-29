import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, TrendingUp } from 'lucide-react'
import { getProjects } from '../api/projects'
import { getExpenses } from '../api/expenses'
import type { ProjectSummary, Expense } from '../types'
import ProgressBar from '../components/ui/ProgressBar'

const fmt = (n: number) => `₩${n.toLocaleString('ko-KR')}`

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    getProjects()
      .then(async (r) => {
        setProjects(r.data)
        if (r.data.length > 0) {
          const expenseResults = await Promise.all(
            r.data.map((p) => getExpenses(p.id))
          )
          const all = expenseResults
            .flatMap((r) => r.data.items)
            .sort((a, b) => b.expense_date.localeCompare(a.expense_date))
            .slice(0, 6)
          setRecentExpenses(all)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const totalBudget = projects.reduce((s, p) => s + p.total_budget, 0)
  const totalSpent = projects.reduce((s, p) => s + p.total_spent, 0)
  const overallRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">전체 예산 현황</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          전체 사업의 예산 집행 현황 및 잔액을 한눈에 확인하세요.
        </p>
      </div>

      {/* 프로젝트 요약 카드 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">진행 중인 프로젝트 요약</h3>
          {projects.length < 3 && (
            <button
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
            >
              <Plus size={13} /> 새 프로젝트
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-400 text-sm mb-3">아직 등록된 사업이 없습니다.</p>
            <button
              onClick={() => navigate('/projects/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus size={14} /> 첫 번째 사업 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      {p.start_date ? p.start_date.slice(0, 4) + '년' : '연도 미설정'}
                    </p>
                    <h4 className="font-semibold text-gray-900 mt-0.5 line-clamp-1">{p.name}</h4>
                  </div>
                  <span className="text-2xl font-bold text-primary-500">
                    {p.execution_rate.toFixed(0)}%
                  </span>
                </div>

                <ProgressBar
                  rate={p.execution_rate}
                  color={p.status_color}
                  height="h-1.5"
                />

                <div className="mt-3 flex justify-between text-xs text-gray-500">
                  <span>집행액 {fmt(p.total_spent)}</span>
                  <span>잔액 {fmt(p.total_budget - p.total_spent)}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">전체 예산 {fmt(p.total_budget)}</span>
                  <ArrowRight
                    size={14}
                    className="text-gray-300 group-hover:text-primary-500 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 사업별 집행현황 */}
      {projects.length > 0 && (
        <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary-500" />
            <h3 className="text-sm font-semibold text-gray-700">사업별 집행현황</h3>
          </div>
          <div className="space-y-5">
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-800">{p.name}</span>
                  <span className="text-sm font-bold text-primary-500">{p.execution_rate.toFixed(1)}%</span>
                </div>
                <ProgressBar rate={p.execution_rate} color={p.status_color} height="h-2" />
                <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                  <span>집행 {fmt(p.total_spent)}</span>
                  <span>잔액 {fmt(p.total_budget - p.total_spent)} / 전체 {fmt(p.total_budget)}</span>
                </div>
              </div>
            ))}
          </div>
          {projects.length > 1 && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span className="font-medium">전체 합계</span>
              <span>{fmt(totalSpent)} / {fmt(totalBudget)}
                <span className="ml-2 font-bold text-primary-500">{overallRate.toFixed(1)}%</span>
              </span>
            </div>
          )}
        </section>
      )}

      {/* 최근 지출 내역 */}
      {recentExpenses.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">최근 지출 내역</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">날짜</th>
                  <th className="text-left px-5 py-3 font-medium">내용</th>
                  <th className="text-left px-5 py-3 font-medium">비목</th>
                  <th className="text-left px-5 py-3 font-medium">지출처</th>
                  <th className="text-right px-5 py-3 font-medium">금액</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-5 py-3 text-gray-500">{e.expense_date}</td>
                    <td className="px-5 py-3 text-gray-800 max-w-[180px] truncate">{e.description}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-700 font-medium">
                        {e.category_name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{e.vendor || '-'}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800 tabular-nums">
                      {fmt(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
