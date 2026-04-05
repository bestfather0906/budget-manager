import { useEffect, useState } from 'react'
import { CreditCard, Building2, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../api/paymentMethods'
import type { PaymentMethod } from '../types'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Toast from '../components/ui/Toast'

type FormState = { type: 'credit' | 'debit' | 'account'; nickname: string; number: string }

const emptyForm: FormState = { type: 'credit', nickname: '', number: '' }

export default function PaymentMethodManage() {
  const [items, setItems] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [editId, setEditId] = useState<number | null>(null)
  const [editNickname, setEditNickname] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await getPaymentMethods()
      setItems(r.data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nickname.trim()) return setToast({ msg: '별칭을 입력해주세요.', type: 'error' })
    if (!form.number.trim()) return setToast({ msg: '번호를 입력해주세요.', type: 'error' })
    setSubmitting(true)
    try {
      await createPaymentMethod(form)
      setToast({ msg: '결제수단이 등록되었습니다.', type: 'success' })
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch {
      setToast({ msg: '등록에 실패했습니다.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSave = async (id: number) => {
    if (!editNickname.trim()) return setToast({ msg: '별칭을 입력해주세요.', type: 'error' })
    try {
      await updatePaymentMethod(id, { nickname: editNickname })
      setToast({ msg: '수정되었습니다.', type: 'success' })
      setEditId(null)
      load()
    } catch {
      setToast({ msg: '수정에 실패했습니다.', type: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePaymentMethod(deleteTarget)
      setToast({ msg: '삭제되었습니다.', type: 'success' })
      load()
    } catch {
      setToast({ msg: '삭제에 실패했습니다.', type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">결제수단 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">회사 카드 및 계좌를 등록하여 지출 입력 시 선택할 수 있습니다.</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setForm(emptyForm) }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus size={14} /> 결제수단 추가
        </button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4"
        >
          <p className="text-sm font-semibold text-gray-700">새 결제수단 등록</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">유형</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'credit' | 'debit' | 'account' }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="credit">신용카드</option>
                <option value="debit">체크카드</option>
                <option value="account">계좌</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">별칭</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                placeholder="예: 법인카드1"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                {form.type === 'account' ? '계좌번호' : '카드번호'}
              </label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                placeholder={form.type === 'account' ? '123-456789-01-234' : '****-****-****-1234'}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      )}

      {/* 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-gray-400 text-sm">
            등록된 결제수단이 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">유형</th>
                <th className="text-left px-4 py-3 font-medium">별칭</th>
                <th className="text-left px-4 py-3 font-medium">번호</th>
                <th className="text-center px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((pm) => (
                <tr key={pm.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                      pm.type === 'credit'
                        ? 'bg-blue-50 text-blue-600'
                        : pm.type === 'debit'
                          ? 'bg-violet-50 text-violet-600'
                          : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {pm.type === 'account' ? <Building2 size={11} /> : <CreditCard size={11} />}
                      {pm.type === 'credit' ? '신용카드' : pm.type === 'debit' ? '체크카드' : '계좌'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {editId === pm.id ? (
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 w-36"
                        autoFocus
                      />
                    ) : (
                      pm.nickname
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{pm.number}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editId === pm.id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(pm.id)}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditId(pm.id); setEditNickname(pm.nickname) }}
                            className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(pm.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message="이 결제수단을 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
