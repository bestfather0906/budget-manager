import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getMonthlyStats, exportExcel, getProjectSummary } from '../api/projects'
import { getExpenses } from '../api/expenses'
import type { MonthlyStatItem, BudgetSummary, Expense } from '../types'

const fmt = (n: number) => `₩${n.toLocaleString('ko-KR')}`
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function MonthlyStats() {
  const { id } = useParams()
  const [stats, setStats] = useState<MonthlyStatItem[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([])
  const [monthExpensesLoading, setMonthExpensesLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getMonthlyStats(Number(id)), getProjectSummary(Number(id))])
      .then(([s, p]) => {
        setStats(s.data)
        setSummary(p.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  const categoryNames = [...new Set(stats.map((s) => s.category_name))]

  // 월별 집계 (막대차트용)
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`
    const monthStats = stats.filter((s) => s.month === m)
    const total = monthStats.reduce((sum, s) => sum + s.total_amount, 0)
    return { month: MONTHS[i], total }
  })

  // 비목별 피벗 (라인차트용)
  const pivoted = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`
    const row: Record<string, string | number> = { month: MONTHS[i] }
    categoryNames.forEach((cat) => {
      const found = stats.find((s) => s.month === m && s.category_name === cat)
      row[cat] = found ? found.total_amount : 0
    })
    return row
  })

  // 월별 통계 테이블
  const tableData = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`
    const monthStats = stats.filter((s) => s.month === m)
    const row: Record<string, number | string> = { month: MONTHS[i] }
    let total = 0
    categoryNames.forEach((cat) => {
      const found = monthStats.find((s) => s.category_name === cat)
      const val = found ? found.total_amount : 0
      row[cat] = val
      total += val
    })
    row['합계'] = total
    return row
  })
  const grandTotals: Record<string, number> = { 합계: 0 }
  categoryNames.forEach((cat) => {
    grandTotals[cat] = tableData.reduce((s, r) => s + (r[cat] as number), 0)
    grandTotals['합계'] += grandTotals[cat]
  })

  const handleMonthClick = async (monthKey: string, hasData: boolean) => {
    if (!id || !hasData) return
    if (selectedMonth === monthKey) {
      setSelectedMonth(null)
      setMonthExpenses([])
      return
    }
    setSelectedMonth(monthKey)
    setMonthExpensesLoading(true)
    const [y, m] = monthKey.split('-')
    const lastDay = new Date(Number(y), Number(m), 0).getDate()
    try {
      const r = await getExpenses(Number(id), {
        start_date: `${monthKey}-01`,
        end_date: `${monthKey}-${String(lastDay).padStart(2, '0')}`,
      })
      setMonthExpenses(r.data.items)
    } finally {
      setMonthExpensesLoading(false)
    }
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-800 rounded-lg p-3 text-xs shadow-lg">
        <p className="text-slate-400 mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-white">
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    )
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">월별 집행현황</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <Download size={14} /> 엑셀 다운로드
        </button>
      </div>

      {/* 월별 집행액 에어리어 차트 */}
      <div className="bg-[#0F172A] rounded-xl p-6 shadow-sm">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">월별 집행현황</p>
        <p className="text-white text-sm font-medium mb-4">
          {year}년 전체 비목 집행 추이 (단위: KRW)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyTotals} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#f97316" fill="url(#areaGrad)" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} name="집행액" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 하단: 테이블 + 라인차트 */}
      <div className="grid grid-cols-5 gap-5">
        {/* 월별 통계 테이블 */}
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">월별 집행 통계</h3>
            <span className="text-xs text-gray-400">{year}년</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium">월</th>
                  {categoryNames.map((c) => (
                    <th key={c} className="text-right px-3 py-2.5 font-medium">{c}</th>
                  ))}
                  <th className="text-right px-4 py-2.5 font-medium text-primary-500">합계</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => {
                  const hasData = (row['합계'] as number) > 0
                  const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`
                  const isSelected = selectedMonth === monthKey
                  return (
                    <tr
                      key={i}
                      onClick={() => handleMonthClick(monthKey, hasData)}
                      className={`border-b border-gray-50 ${
                        i % 2 !== 0 ? 'bg-gray-50/50' : ''
                      } ${hasData ? 'cursor-pointer hover:bg-primary-50/50' : 'opacity-40'} ${
                        isSelected ? 'bg-primary-50' : ''
                      }`}
                    >
                      <td className="px-4 py-2 text-gray-600 font-medium">
                        <span className="flex items-center gap-1">
                          {row.month as string}
                          {hasData && (isSelected ? <ChevronUp size={12} className="text-primary-400" /> : <ChevronDown size={12} className="text-gray-300" />)}
                        </span>
                      </td>
                      {categoryNames.map((c) => (
                        <td key={c} className="px-3 py-2 text-right text-gray-600 tabular-nums">
                          {(row[c] as number) > 0 ? fmt(row[c] as number) : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right font-bold text-primary-600 tabular-nums">
                        {(row['합계'] as number) > 0 ? fmt(row['합계'] as number) : '-'}
                      </td>
                    </tr>
                  )
                })}
                {/* 합계 행 */}
                <tr className="bg-primary-500 text-white font-bold">
                  <td className="px-4 py-2.5">합계</td>
                  {categoryNames.map((c) => (
                    <td key={c} className="px-3 py-2.5 text-right tabular-nums">
                      {fmt(grandTotals[c])}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(grandTotals['합계'])}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 월별 지출 상세 내역 */}
        {selectedMonth && (
          <div className="col-span-5 bg-white rounded-xl shadow-sm border border-primary-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-primary-50">
              <h3 className="text-sm font-semibold text-gray-800">
                {selectedMonth.replace('-', '년 ')}월 지출 상세 내역
              </h3>
              {monthExpenses.length > 0 && (
                <span className="text-sm font-bold text-primary-600">
                  총 {fmt(monthExpenses.reduce((s, e) => s + e.amount, 0))}
                </span>
              )}
            </div>
            {monthExpensesLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : monthExpenses.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-gray-400">지출 내역이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-2.5 font-medium">결제일</th>
                      <th className="text-left px-4 py-2.5 font-medium">출금일</th>
                      <th className="text-left px-4 py-2.5 font-medium">내용</th>
                      <th className="text-left px-4 py-2.5 font-medium">비목</th>
                      <th className="text-left px-4 py-2.5 font-medium">지출처</th>
                      <th className="text-left px-4 py-2.5 font-medium">결제수단</th>
                      <th className="text-right px-5 py-2.5 font-medium">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthExpenses.map((e, i) => (
                      <tr key={e.id} className={`border-b border-gray-50 ${i % 2 !== 0 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-5 py-2 tabular-nums text-gray-500">{e.expense_date}</td>
                        <td className="px-4 py-2 tabular-nums text-gray-500">{e.withdrawal_date || '-'}</td>
                        <td className="px-4 py-2 text-gray-800 max-w-[200px] truncate">{e.description}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-primary-100 text-primary-700 font-medium">
                            {e.category_name}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-500">{e.vendor || '-'}</td>
                        <td className="px-4 py-2">
                          {e.payment_method_nickname ? (
                            <div className="flex items-center gap-1">
                              <span className={`inline-flex px-1.5 py-0.5 rounded font-medium text-[10px] ${
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
                              <span className="text-gray-500 text-[10px]">{e.payment_method_nickname}</span>
                            </div>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-5 py-2 text-right font-medium text-gray-800 tabular-nums">{fmt(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 비목별 라인 차트 */}
        <div className="col-span-2 bg-[#0F172A] rounded-xl p-5 shadow-sm">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">비목별 월별 추이</p>
          <p className="text-slate-500 text-[10px] mb-4">
            각 월별·비목별 지출 현황 (단위: 만원)
          </p>
          {stats.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
              데이터 없음
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pivoted} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '10px', color: '#64748b' }}
                />
                {categoryNames.map((cat, i) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
