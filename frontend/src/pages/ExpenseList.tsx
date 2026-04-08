import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { getExpenses, deleteExpense } from '../api/expenses'
import { getCategories } from '../api/budgetTree'
import type { Expense, BudgetCategory } from '../types'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Toast from '../components/ui/Toast'

const fmt = (n: number) => `₩${n.toLocaleString('ko-KR')}`

export default function ExpenseList() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [filterCat, setFilterCat] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const projectId = Number(id)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (filterCat) params.category_id = Number(filterCat)
      if (filterStart) params.start_date = filterStart
      if (filterEnd) params.end_date = filterEnd
      const r = await getExpenses(projectId, params)
      setExpenses(r.data.items)
      setTotalCount(r.data.total_count)
      setTotalAmount(r.data.total_amount)
    } finally {
      setLoading(false)
    }
  }, [projectId, filterCat, filterStart, filterEnd])

  useEffect(() => {
    getCategories(projectId).then((r) => setCategories(r.data))
    load()
  }, [projectId, load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteExpense(deleteTarget)
      setToast({ msg: '지출내역이 삭제되었습니다.', type: 'success' })
      load()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">지출내역</h2>
          <p className="text-sm text-gray-500 mt-0.5">사업별 집행 현황 및 상세 지출 기록</p>
        </div>
        <button
          onClick={() => navigate(`/projects/${id}/expenses/new`)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus size={14} /> 지출 입력
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">세목</label>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">전체 세목</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">시작일</label>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">종료일</label>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Search size={14} /> 조회
        </button>
        <button
          onClick={() => { setFilterCat(''); setFilterStart(''); setFilterEnd('') }}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          초기화
        </button>
      </div>

      {/* 요약 */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">
          검색 결과 : <strong className="text-gray-800">{totalCount}건</strong>
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">
          지출 합계 :{' '}
          <strong className="text-primary-500 text-base tabular-nums">{fmt(totalAmount)}</strong>
        </span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <p>지출내역이 없습니다.</p>
            <button
              onClick={() => navigate(`/projects/${id}/expenses/new`)}
              className="mt-3 text-primary-500 font-medium hover:underline text-sm"
            >
              지출 입력하기 →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-center px-3 py-3 font-medium w-10">#</th>
                  <th className="text-left px-3 py-3 font-medium">결제일</th>
                  <th className="text-left px-3 py-3 font-medium">세목</th>
                  <th className="text-left px-3 py-3 font-medium">세세목</th>
                  <th className="text-left px-3 py-3 font-medium">품목</th>
                  <th className="text-left px-3 py-3 font-medium">내용</th>
                  <th className="text-left px-3 py-3 font-medium">지출처</th>
                  <th className="text-left px-3 py-3 font-medium">결제수단</th>
                  <th className="text-right px-3 py-3 font-medium">금액</th>
                  <th className="text-center px-3 py-3 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-gray-50 hover:bg-primary-50/30 transition-colors ${i % 2 !== 0 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-500 text-xs">{e.expense_date}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-medium">
                        {e.category_name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{e.sub_category_name}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-primary-100 text-primary-700 font-medium">
                        {e.budget_item_name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-800 max-w-[140px] truncate text-xs">{e.description}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{e.vendor || '-'}</td>
                    <td className="px-3 py-2.5 text-xs">
                      {e.payment_method_nickname ? (
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex px-1 py-0.5 rounded font-medium ${
                            e.payment_method_type === 'credit' ? 'bg-blue-50 text-blue-600'
                            : e.payment_method_type === 'debit' ? 'bg-violet-50 text-violet-600'
                            : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {e.payment_method_type === 'credit' ? '신용' : e.payment_method_type === 'debit' ? '체크' : '계좌'}
                          </span>
                          <span className="text-gray-500">{e.payment_method_nickname}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800 tabular-nums">
                      {fmt(e.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/projects/${id}/expenses/${e.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(e.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message="이 지출내역을 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
