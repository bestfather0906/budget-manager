import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getCategories } from '../api/categories'
import { createExpense, getExpenses, updateExpense } from '../api/expenses'
import { getPaymentMethods } from '../api/paymentMethods'
import type { BudgetCategory, ExpenseCreate, PaymentMethod } from '../types'
import Toast from '../components/ui/Toast'

const today = () => new Date().toISOString().slice(0, 10)

export default function ExpenseForm({ mode }: { mode: 'new' | 'edit' }) {
  const { id, eid } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [form, setForm] = useState<ExpenseCreate>({
    category_id: 0,
    expense_date: today(),
    amount: 0,
    description: '',
    vendor: '',
    payment_method_id: null,
  })
  const [rawAmount, setRawAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    getCategories(projectId).then((r) => {
      setCategories(r.data)
      if (r.data.length > 0 && form.category_id === 0) {
        setForm((f) => ({ ...f, category_id: r.data[0].id }))
      }
    })
    getPaymentMethods(true).then((r) => setPaymentMethods(r.data.items))

    if (mode === 'edit' && eid) {
      getExpenses(projectId).then((r) => {
        const target = r.data.items.find((e) => e.id === Number(eid))
        if (target) {
          setForm({
            category_id: target.category_id,
            expense_date: target.expense_date,
            amount: target.amount,
            description: target.description,
            vendor: target.vendor || '',
            payment_method_id: target.payment_method_id ?? null,
          })
          setRawAmount(target.amount.toString())
        }
      })
    }
  }, [projectId, mode, eid]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAmountChange = (v: string) => {
    const digits = v.replace(/[^0-9]/g, '')
    setRawAmount(digits)
    setForm((f) => ({ ...f, amount: digits ? Number(digits) : 0 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category_id) return setToast({ msg: '비목을 선택해주세요.', type: 'error' })
    if (!form.amount) return setToast({ msg: '금액을 입력해주세요.', type: 'error' })
    if (!form.description.trim()) return setToast({ msg: '내용을 입력해주세요.', type: 'error' })

    setLoading(true)
    try {
      if (mode === 'edit' && eid) {
        await updateExpense(Number(eid), form)
        setToast({ msg: '지출내역이 수정되었습니다.', type: 'success' })
      } else {
        await createExpense(projectId, form)
        setToast({ msg: '지출내역이 저장되었습니다.', type: 'success' })
      }
      setTimeout(() => navigate(`/projects/${id}/expenses`), 1000)
    } catch (err: unknown) {
      setToast({ msg: (err as Error).message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const displayAmount =
    rawAmount ? Number(rawAmount).toLocaleString('ko-KR') : ''

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* 헤더 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        지출 입력
      </button>

      {/* 폼 카드 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* 지출일 + 비목 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              지출일 <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              비목 <span className="text-red-400">*</span>
            </label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: Number(e.target.value) }))}
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value={0}>선택하세요</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 내용 */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            내용(적요) <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="지출 항목에 대한 설명을 입력하세요"
            required
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* 지불 정보 */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">
            Payment Details
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">지출처</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="기업명 입력"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">결제수단</label>
              <select
                value={form.payment_method_id ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_method_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">선택 안 함</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.nickname} ({pm.number})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 금액 */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            금액 <span className="text-red-400">*</span>
          </label>
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 focus-within:border-primary-500 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-primary-400 font-bold text-lg">₩</span>
              <input
                type="text"
                value={displayAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="flex-1 text-2xl font-bold text-primary-600 bg-transparent focus:outline-none tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
