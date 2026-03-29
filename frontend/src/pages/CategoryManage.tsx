import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Check, X, ArrowLeft } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import { getProjectSummary } from '../api/projects'
import type { BudgetCategory } from '../types'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Toast from '../components/ui/Toast'

const fmt = (n: number) => `₩${n.toLocaleString('ko-KR')}`

export default function CategoryManage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', allocated_amount: 0 })
  const [newForm, setNewForm] = useState({ name: '', allocated_amount: '' })
  const [showNew, setShowNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = () => {
    getCategories(projectId).then((r) => setCategories(r.data))
    getProjectSummary(projectId).then((r) => setTotalBudget(r.data.total_budget))
  }

  useEffect(() => { load() }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalAllocated = categories.reduce((s, c) => s + c.allocated_amount, 0)
  const isOverBudget = totalAllocated > totalBudget

  const handleCreate = async () => {
    if (!newForm.name.trim()) return setToast({ msg: '비목명을 입력해주세요.', type: 'error' })
    try {
      await createCategory(projectId, {
        name: newForm.name,
        allocated_amount: Number(newForm.allocated_amount.replace(/,/g, '')) || 0,
        order_index: categories.length,
      })
      setNewForm({ name: '', allocated_amount: '' })
      setShowNew(false)
      load()
      setToast({ msg: '비목이 추가되었습니다.', type: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: 'error' })
    }
  }

  const handleUpdate = async (catId: number) => {
    try {
      await updateCategory(catId, editForm)
      setEditingId(null)
      load()
      setToast({ msg: '비목이 수정되었습니다.', type: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget)
      load()
      setToast({ msg: '비목이 삭제되었습니다.', type: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} /> 비목 관리
      </button>

      {/* 예산 요약 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">전체 예산</span>
          <span className="font-semibold">{fmt(totalBudget)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">비목 배정 합계</span>
          <span className={`font-semibold ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
            {fmt(totalAllocated)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
          <span className="text-gray-500">미배정</span>
          <span className={`font-semibold ${isOverBudget ? 'text-red-500' : 'text-blue-500'}`}>
            {fmt(totalBudget - totalAllocated)}
          </span>
        </div>
        {isOverBudget && (
          <p className="text-xs text-red-500 mt-2">
            배정 합계가 전체 예산을 초과합니다.
          </p>
        )}
      </div>

      {/* 비목 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">비목 목록</h3>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            <Plus size={13} /> 비목 추가
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {categories.map((cat) => (
            <div key={cat.id} className="px-5 py-3.5 flex items-center gap-3">
              {editingId === cat.id ? (
                <>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    value={editForm.allocated_amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, allocated_amount: Number(e.target.value) }))}
                    className="w-36 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                  />
                  <button onClick={() => handleUpdate(cat.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                  <span className="text-sm text-gray-500 tabular-nums">{fmt(cat.allocated_amount)}</span>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditForm({ name: cat.name, allocated_amount: cat.allocated_amount }) }}
                    className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}

          {showNew && (
            <div className="px-5 py-3.5 flex items-center gap-3 bg-primary-50">
              <input
                autoFocus
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="비목명"
                className="flex-1 text-sm border border-primary-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                value={newForm.allocated_amount}
                onChange={(e) => setNewForm((f) => ({ ...f, allocated_amount: e.target.value }))}
                placeholder="배정 예산"
                className="w-36 text-sm border border-primary-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
              />
              <button onClick={handleCreate} className="p-1.5 text-green-500 hover:bg-green-50 rounded">
                <Check size={14} />
              </button>
              <button onClick={() => setShowNew(false)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded">
                <X size={14} />
              </button>
            </div>
          )}

          {categories.length === 0 && !showNew && (
            <div className="py-10 text-center text-gray-400 text-sm">
              비목을 추가해주세요.
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message="이 비목을 삭제하시겠습니까? 관련 지출내역도 함께 삭제됩니다."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
