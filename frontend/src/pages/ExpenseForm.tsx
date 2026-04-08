import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getBudgetTree } from '../api/budgetTree'
import { createExpense, getExpenses, updateExpense } from '../api/expenses'
import { getPaymentMethods } from '../api/paymentMethods'
import type { BudgetCategoryWithTree, BudgetSubCategoryWithItems, BudgetItem, ExpenseCreate, PaymentMethod } from '../types'
import Toast from '../components/ui/Toast'

const today = () => new Date().toISOString().slice(0, 10)
const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function ExpenseForm({ mode }: { mode: 'new' | 'edit' }) {
  const { id, eid } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [tree, setTree] = useState<BudgetCategoryWithTree[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  // 연속 선택
  const [selectedCatId, setSelectedCatId] = useState<number>(0)
  const [selectedSubId, setSelectedSubId] = useState<number>(0)
  const [selectedItemId, setSelectedItemId] = useState<number>(0)

  const [form, setForm] = useState<ExpenseCreate>({
    budget_item_id: 0,
    expense_date: today(),
    amount: 0,
    description: '',
    vendor: '',
    payment_method_id: null,
    withdrawal_date: null,
  })
  const [rawAmount, setRawAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // 선택된 계층 파생
  const selectedCat = tree.find((c) => c.id === selectedCatId)
  const subList: BudgetSubCategoryWithItems[] = selectedCat?.sub_categories ?? []
  const selectedSub = subList.find((s) => s.id === selectedSubId)
  const itemList: BudgetItem[] = selectedSub?.budget_items ?? []
  const selectedItem = itemList.find((i) => i.id === selectedItemId)

  useEffect(() => {
    getBudgetTree(projectId).then((r) => {
      setTree(r.data)
      if (r.data.length > 0 && selectedCatId === 0) {
        setSelectedCatId(r.data[0].id)
      }
    })
    getPaymentMethods(true).then((r) => setPaymentMethods(r.data.items))

    if (mode === 'edit' && eid) {
      getExpenses(projectId).then((r) => {
        const target = r.data.items.find((e) => e.id === Number(eid))
        if (target) {
          setForm({
            budget_item_id: target.budget_item_id,
            expense_date: target.expense_date,
            amount: target.amount,
            description: target.description,
            vendor: target.vendor || '',
            payment_method_id: target.payment_method_id ?? null,
            withdrawal_date: target.withdrawal_date ?? null,
          })
          setRawAmount(target.amount.toString())
          setSelectedItemId(target.budget_item_id)
        }
      })
    }
  }, [projectId, mode, eid]) // eslint-disable-line react-hooks/exhaustive-deps

  // 세목 변경 시 하위 초기화
  const handleCatChange = (catId: number) => {
    setSelectedCatId(catId)
    setSelectedSubId(0)
    setSelectedItemId(0)
    setForm((f) => ({ ...f, budget_item_id: 0 }))
  }

  // 세세목 변경 시 품목 초기화
  const handleSubChange = (subId: number) => {
    setSelectedSubId(subId)
    setSelectedItemId(0)
    setForm((f) => ({ ...f, budget_item_id: 0 }))
  }

  // 품목 선택
  const handleItemChange = (itemId: number) => {
    setSelectedItemId(itemId)
    setForm((f) => ({ ...f, budget_item_id: itemId }))
  }

  const handleAmountChange = (v: string) => {
    const digits = v.replace(/[^0-9]/g, '')
    setRawAmount(digits)
    setForm((f) => ({ ...f, amount: digits ? Number(digits) : 0 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.budget_item_id) return setToast({ msg: '품목을 선택해주세요.', type: 'error' })
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

  const displayAmount = rawAmount ? Number(rawAmount).toLocaleString('ko-KR') : ''

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        지출 입력
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">

        {/* 지출일 */}
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

        {/* 예산 항목 선택 (연속 드롭다운) */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">예산 항목 선택 *</p>

          {/* 세목 */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">세목</label>
            <select
              value={selectedCatId}
              onChange={(e) => handleCatChange(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value={0}>세목 선택</option>
              {tree.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 세세목 */}
          {selectedCatId > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">세세목</label>
              <select
                value={selectedSubId}
                onChange={(e) => handleSubChange(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value={0}>세세목 선택</option>
                {subList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 품목 */}
          {selectedSubId > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">품목</label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemChange(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value={0}>품목 선택</option>
                {itemList.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (계획: ₩{fmt(i.planned_amount)})
                  </option>
                ))}
              </select>
              {selectedItem && (
                <p className="mt-1.5 text-xs text-gray-400">
                  계획금액: ₩{fmt(selectedItem.planned_amount)}
                  ({fmt(selectedItem.unit_price)}원 × {selectedItem.quantity})
                </p>
              )}
            </div>
          )}
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
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">결제 정보</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">지출처</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="기관명 입력"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">결제수단</label>
              <select
                value={form.payment_method_id ?? ''}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  payment_method_id: e.target.value ? Number(e.target.value) : null,
                  withdrawal_date: null,
                }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">선택 안 함</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.type === 'credit' ? '[신용카드]' : pm.type === 'debit' ? '[체크카드]' : '[계좌]'} {pm.nickname} ({pm.number})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {paymentMethods.find((pm) => pm.id === form.payment_method_id)?.type === 'credit' && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <label className="text-xs font-medium text-blue-700 mb-1.5 block">
                출금일 <span className="font-normal text-blue-500">(신용카드 실제 출금 날짜)</span>
              </label>
              <input
                type="date"
                value={form.withdrawal_date ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, withdrawal_date: e.target.value || null }))}
                className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>
          )}
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
