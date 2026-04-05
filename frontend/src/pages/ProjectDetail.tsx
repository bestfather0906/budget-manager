import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Plus, Settings, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { getProjectSummary, exportExcel } from '../api/projects'
import { getExpenses } from '../api/expenses'
import type { BudgetSummary, Expense } from '../types'
import ProgressBar from '../components/ui/ProgressBar'
import StatusBadge from '../components/ui/StatusBadge'
import DonutChart from '../components/ui/DonutChart'

const fmt = (n: number) => `₩${n.toLocaleString('ko-KR')}`

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getProjectSummary(Number(id)),
      getExpenses(Number(id)),
    ])
      .then(([s, e]) => {
        setSummary(s.data)
        setExpenses(e.data.items)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  // 월별 그룹핑 (최신 월 순)
  const monthlyGroups = (() => {
    const map = new Map<string, Expense[]>()
    expenses.forEach((e) => {
      const month = e.expense_date.slice(0, 7) // "YYYY-MM"
      if (!map.has(month)) map.set(month, [])
      map.get(month)!.push(e)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, items]) => ({
        month,
        label: `${month.slice(0, 4)}년 ${String(Number(month.slice(5, 7)))}월`,
        items: items.sort((a, b) => b.expense_date.localeCompare(a.expense_date)),
        total: items.reduce((s, e) => s + e.amount, 0),
      }))
  })()

  const toggleMonth = (month: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  const handleExport = async () => {
    if (!id || !summary) return
    setExporting(true)
    try {
      const r = await exportExcel(Number(id))
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `사업예산_${summary.project_name}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (error) return <p className="text-red-500">{error}</p>
  if (!summary) return null

  const donutColor =
    summary.execution_rate >= 90
      ? '#ef4444'
      : summary.execution_rate >= 70
        ? '#f59e0b'
        : '#f97316'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-primary-500 font-medium uppercase tracking-wide mb-1">
            Project Detail &rsaquo; Execution
          </p>
          <h2 className="text-2xl font-bold text-gray-900">{summary.project_name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/projects/${id}/categories`)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings size={14} /> 비목 관리
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={14} /> 엑셀 다운로드
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/expenses/new`)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={14} /> 지출 입력
          </button>
        </div>
      </div>

      {/* 경고 배너 */}
      {summary.budget_warning && (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertTriangle size={15} />
          비목별 배정 예산 합계가 전체 예산을 초과합니다. 예산 배분을 확인해 주세요.
        </div>
      )}

      {/* 4개 수치 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체예산" value={fmt(summary.total_budget)} sub="TOTAL ALLOCATED" color="gray" />
        <StatCard label="집행액" value={fmt(summary.total_spent)} sub="CURRENT SPEND" color="orange" />
        <StatCard label="잔액" value={fmt(summary.total_remaining)} sub="REMAINING FUNDS" color="blue" />
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">집행률</p>
            <p className="text-xs text-gray-500 mt-0.5">ON TRACK</p>
          </div>
          <div className="ml-auto">
            <DonutChart rate={summary.execution_rate} size={72} color={donutColor} />
          </div>
        </div>
      </div>

      {/* 비목별 집행현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">비목별 집행현황</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Detailed breakdown of departmental budget performance
            </p>
          </div>
          <button
            onClick={() => navigate(`/projects/${id}/expenses`)}
            className="text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            전체 내역 보기 →
          </button>
        </div>

        {summary.categories.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400 text-sm mb-2">등록된 비목이 없습니다.</p>
            <button
              onClick={() => navigate(`/projects/${id}/categories`)}
              className="text-sm text-primary-500 font-medium hover:underline"
            >
              비목 추가하기 →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium">비목명</th>
                  <th className="text-right px-6 py-3 font-medium">배정예산</th>
                  <th className="text-right px-6 py-3 font-medium">집행액</th>
                  <th className="text-right px-6 py-3 font-medium">잔액</th>
                  <th className="px-6 py-3 font-medium w-40">집행률</th>
                  <th className="text-center px-6 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {summary.categories.map((cat, i) => (
                  <tr
                    key={cat.category_id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      i % 2 !== 0 ? 'bg-gray-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cat.status_color === 'red'
                              ? 'bg-red-400'
                              : cat.status_color === 'yellow'
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                          }`}
                        />
                        {cat.category_name}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-600 tabular-nums">
                      {fmt(cat.allocated_amount)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-gray-800 tabular-nums">
                      {fmt(cat.spent_amount)}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-right tabular-nums font-medium ${
                        cat.remaining < 0 ? 'text-red-500' : 'text-blue-500'
                      }`}
                    >
                      {fmt(cat.remaining)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          rate={cat.execution_rate}
                          color={cat.status_color}
                          height="h-1.5"
                        />
                        <span className="text-xs text-gray-400 w-10 text-right tabular-nums">
                          {cat.execution_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={cat.status_color} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* 월별 집행현황 */}
      {monthlyGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">월별 집행현황</h3>
          {monthlyGroups.map(({ month, label, items, total }) => {
            const isOpen = openMonths.has(month)
            return (
              <div key={month} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 월 헤더 — 클릭으로 펼치기/접기 */}
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronUp size={15} className="text-primary-400" /> : <ChevronDown size={15} className="text-gray-300" />}
                    <span className="text-sm font-semibold text-gray-800">{label} 집행현황</span>
                    <span className="text-xs text-gray-400">{items.length}건</span>
                  </div>
                  <span className="text-sm font-bold text-primary-500 tabular-nums">{fmt(total)}</span>
                </button>

                {/* 지출 내역 테이블 */}
                {isOpen && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-2.5 font-medium">결제일</th>
                          <th className="text-left px-4 py-2.5 font-medium">출금일</th>
                          <th className="text-left px-4 py-2.5 font-medium">내용</th>
                          <th className="text-left px-4 py-2.5 font-medium">비목</th>
                          <th className="text-left px-4 py-2.5 font-medium">지출처</th>
                          <th className="text-left px-4 py-2.5 font-medium">결제수단</th>
                          <th className="text-right px-6 py-2.5 font-medium">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((e, i) => (
                          <tr key={e.id} className={`border-b border-gray-50 ${i % 2 !== 0 ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-6 py-3 tabular-nums text-gray-500">{e.expense_date}</td>
                            <td className="px-4 py-3 tabular-nums text-gray-500">{e.withdrawal_date || '-'}</td>
                            <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{e.description}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-700 font-medium">
                                {e.category_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{e.vendor || '-'}</td>
                            <td className="px-4 py-3 text-xs">
                              {e.payment_method_nickname ? (
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded font-medium ${
                                    e.payment_method_type === 'credit'
                                      ? 'bg-blue-50 text-blue-600'
                                      : e.payment_method_type === 'debit'
                                        ? 'bg-violet-50 text-violet-600'
                                        : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {e.payment_method_type === 'credit' ? '신용카드'
                                      : e.payment_method_type === 'debit' ? '체크카드'
                                      : '계좌'}
                                  </span>
                                  <span className="text-gray-500">{e.payment_method_nickname}</span>
                                </div>
                              ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-gray-800 tabular-nums">{fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary-50 border-t border-primary-100">
                          <td colSpan={5} className="px-6 py-3 text-xs font-semibold text-primary-700">{label} 합계</td>
                          <td className="px-6 py-3 text-right font-bold text-primary-600 tabular-nums">{fmt(total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: 'gray' | 'orange' | 'blue'
}) {
  const valueColor =
    color === 'orange'
      ? 'text-primary-500'
      : color === 'blue'
        ? 'text-blue-500'
        : 'text-gray-800'
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold mt-1 tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-gray-300 mt-0.5 uppercase tracking-wide">{sub}</p>
    </div>
  )
}
