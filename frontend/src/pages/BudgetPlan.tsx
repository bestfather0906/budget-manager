import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  getBudgetTree,
  createCategory, updateCategory, deleteCategory,
  createSubCategory, updateSubCategory, deleteSubCategory,
  createBudgetItem, updateBudgetItem, deleteBudgetItem,
} from '../api/budgetTree'
import type { BudgetCategoryWithTree, BudgetSubCategoryWithItems, BudgetItem } from '../types'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Toast from '../components/ui/Toast'

const fmt = (n: number) => n.toLocaleString('ko-KR')

type EditTarget =
  | { type: 'category'; id: number; name: string }
  | { type: 'sub'; id: number; name: string }
  | { type: 'item'; id: number; name: string; unit_price: number; quantity: number; note: string }

export default function BudgetPlan() {
  const { id } = useParams()
  const projectId = Number(id)

  const [tree, setTree] = useState<BudgetCategoryWithTree[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number } | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  // 새 항목 입력 상태
  const [newCatName, setNewCatName] = useState('')
  const [newSubName, setNewSubName] = useState<Record<number, string>>({})
  const [newItem, setNewItem] = useState<Record<number, { name: string; unit_price: string; quantity: string; note: string }>>({})

  const load = async () => {
    setLoading(true)
    try {
      const r = await getBudgetTree(projectId)
      setTree(r.data)
      // 처음 로드 시 모두 펼침
      const exp: Record<number, boolean> = {}
      r.data.forEach((c) => { exp[c.id] = true })
      setExpanded((prev) => Object.keys(prev).length === 0 ? exp : prev)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const showToast = (msg: string, type: 'success' | 'error' = 'success') =>
    setToast({ msg, type })

  // ── 세목 ────────────────────────────────────────────────────

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    try {
      await createCategory(projectId, { name: newCatName.trim() })
      setNewCatName('')
      await load()
      showToast('세목이 추가되었습니다.')
    } catch { showToast('추가 실패', 'error') }
  }

  // ── 세세목 ───────────────────────────────────────────────────

  const handleAddSub = async (categoryId: number) => {
    const name = (newSubName[categoryId] || '').trim()
    if (!name) return
    try {
      await createSubCategory(categoryId, { name })
      setNewSubName((p) => ({ ...p, [categoryId]: '' }))
      await load()
      showToast('세세목이 추가되었습니다.')
    } catch { showToast('추가 실패', 'error') }
  }

  // ── 품목 ─────────────────────────────────────────────────────

  const handleAddItem = async (subCategoryId: number) => {
    const f = newItem[subCategoryId]
    if (!f || !f.name.trim()) return
    try {
      await createBudgetItem(subCategoryId, {
        name: f.name.trim(),
        unit_price: Number(f.unit_price) || 0,
        quantity: Number(f.quantity) || 1,
        note: f.note || undefined,
      })
      setNewItem((p) => ({ ...p, [subCategoryId]: { name: '', unit_price: '', quantity: '1', note: '' } }))
      await load()
      showToast('품목이 추가되었습니다.')
    } catch { showToast('추가 실패', 'error') }
  }

  // ── 수정 저장 ────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!editTarget) return
    try {
      if (editTarget.type === 'category') {
        await updateCategory(editTarget.id, { name: editTarget.name })
      } else if (editTarget.type === 'sub') {
        await updateSubCategory(editTarget.id, { name: editTarget.name })
      } else {
        await updateBudgetItem(editTarget.id, {
          name: editTarget.name,
          unit_price: editTarget.unit_price,
          quantity: editTarget.quantity,
          note: editTarget.note || undefined,
        })
      }
      setEditTarget(null)
      await load()
      showToast('수정되었습니다.')
    } catch { showToast('수정 실패', 'error') }
  }

  // ── 삭제 ────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'category') await deleteCategory(deleteTarget.id)
      else if (deleteTarget.type === 'sub') await deleteSubCategory(deleteTarget.id)
      else await deleteBudgetItem(deleteTarget.id)
      setDeleteTarget(null)
      await load()
      showToast('삭제되었습니다.')
    } catch { showToast('삭제 실패', 'error') }
  }

  // ── 계획금액 합계 ────────────────────────────────────────────

  const subTotal = (sub: BudgetSubCategoryWithItems) =>
    sub.budget_items.reduce((s, i) => s + i.planned_amount, 0)

  const catTotal = (cat: BudgetCategoryWithTree) =>
    cat.sub_categories.reduce((s, sub) => s + subTotal(sub), 0)

  const grandTotal = tree.reduce((s, cat) => s + catTotal(cat), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">예산계획 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">세목 → 세세목 → 품목(단가×수량) 구조로 초기 예산계획을 입력하세요</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">전체 계획금액</p>
          <p className="text-xl font-bold text-primary-600">₩{fmt(grandTotal)}</p>
        </div>
      </div>

      {/* 세목 목록 */}
      <div className="space-y-3">
        {tree.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* 세목 헤더 */}
            <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-b border-orange-100">
              <button onClick={() => toggle(cat.id)} className="text-gray-400 hover:text-gray-600">
                {expanded[cat.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {editTarget?.type === 'category' && editTarget.id === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    className="flex-1 text-sm border border-orange-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={editTarget.name}
                    onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                  />
                  <button onClick={handleSaveEdit} className="p-1 text-green-500 hover:text-green-700"><Check size={15} /></button>
                  <button onClick={() => setEditTarget(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={15} /></button>
                </div>
              ) : (
                <span className="flex-1 font-semibold text-gray-800 text-sm">{cat.name}</span>
              )}
              <span className="text-xs text-orange-600 font-medium tabular-nums">₩{fmt(catTotal(cat))}</span>
              <button
                onClick={() => setEditTarget({ type: 'category', id: cat.id, name: cat.name })}
                className="p-1 text-gray-300 hover:text-primary-500"
              ><Pencil size={13} /></button>
              <button
                onClick={() => setDeleteTarget({ type: 'category', id: cat.id })}
                className="p-1 text-gray-300 hover:text-red-500"
              ><Trash2 size={13} /></button>
            </div>

            {expanded[cat.id] && (
              <div className="px-4 py-3 space-y-4">
                {/* 세세목 목록 */}
                {cat.sub_categories.map((sub) => (
                  <div key={sub.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    {/* 세세목 헤더 */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100">
                      {editTarget?.type === 'sub' && editTarget.id === sub.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            className="flex-1 text-sm border border-amber-300 rounded px-2 py-1 focus:outline-none"
                            value={editTarget.name}
                            onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                          <button onClick={handleSaveEdit} className="p-1 text-green-500"><Check size={14} /></button>
                          <button onClick={() => setEditTarget(null)} className="p-1 text-gray-400"><X size={14} /></button>
                        </div>
                      ) : (
                        <span className="flex-1 text-sm font-medium text-gray-700">{sub.name}</span>
                      )}
                      <span className="text-xs text-amber-600 tabular-nums">₩{fmt(subTotal(sub))}</span>
                      <button
                        onClick={() => setEditTarget({ type: 'sub', id: sub.id, name: sub.name })}
                        className="p-1 text-gray-300 hover:text-primary-500"
                      ><Pencil size={12} /></button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'sub', id: sub.id })}
                        className="p-1 text-gray-300 hover:text-red-500"
                      ><Trash2 size={12} /></button>
                    </div>

                    {/* 품목 목록 */}
                    <div className="divide-y divide-gray-50">
                      {sub.budget_items.map((item: BudgetItem) => (
                        <div key={item.id} className="px-3 py-2 flex items-center gap-3 text-sm hover:bg-gray-50">
                          {editTarget?.type === 'item' && editTarget.id === item.id ? (
                            <div className="flex items-center gap-2 flex-1 flex-wrap">
                              <input
                                className="w-28 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
                                placeholder="품목명"
                                value={editTarget.name}
                                onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                              />
                              <input
                                className="w-24 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none text-right"
                                placeholder="단가"
                                type="number"
                                value={editTarget.unit_price}
                                onChange={(e) => setEditTarget({ ...editTarget, unit_price: Number(e.target.value) })}
                              />
                              <span className="text-xs text-gray-400">×</span>
                              <input
                                className="w-16 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none text-right"
                                placeholder="수량"
                                type="number"
                                value={editTarget.quantity}
                                onChange={(e) => setEditTarget({ ...editTarget, quantity: Number(e.target.value) })}
                              />
                              <input
                                className="w-24 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
                                placeholder="비고"
                                value={editTarget.note}
                                onChange={(e) => setEditTarget({ ...editTarget, note: e.target.value })}
                              />
                              <button onClick={handleSaveEdit} className="p-1 text-green-500"><Check size={14} /></button>
                              <button onClick={() => setEditTarget(null)} className="p-1 text-gray-400"><X size={14} /></button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-gray-700">{item.name}</span>
                              <span className="text-gray-400 text-xs tabular-nums">
                                {fmt(item.unit_price)}원 × {item.quantity}
                                {item.note ? ` (${item.note})` : ''}
                              </span>
                              <span className="font-medium text-gray-800 tabular-nums w-24 text-right">
                                ₩{fmt(item.planned_amount)}
                              </span>
                              <button
                                onClick={() => setEditTarget({
                                  type: 'item', id: item.id,
                                  name: item.name, unit_price: item.unit_price,
                                  quantity: item.quantity, note: item.note || '',
                                })}
                                className="p-1 text-gray-300 hover:text-primary-500"
                              ><Pencil size={12} /></button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'item', id: item.id })}
                                className="p-1 text-gray-300 hover:text-red-500"
                              ><Trash2 size={12} /></button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 품목 추가 입력 */}
                    <div className="px-3 py-2 bg-gray-50 flex items-center gap-2 flex-wrap">
                      <input
                        className="w-28 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        placeholder="품목명"
                        value={newItem[sub.id]?.name || ''}
                        onChange={(e) => setNewItem((p) => ({ ...p, [sub.id]: { ...p[sub.id], name: e.target.value, unit_price: p[sub.id]?.unit_price || '', quantity: p[sub.id]?.quantity || '1', note: p[sub.id]?.note || '' } }))}
                      />
                      <input
                        className="w-24 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400 text-right"
                        placeholder="단가"
                        type="number"
                        value={newItem[sub.id]?.unit_price || ''}
                        onChange={(e) => setNewItem((p) => ({ ...p, [sub.id]: { ...p[sub.id], name: p[sub.id]?.name || '', unit_price: e.target.value, quantity: p[sub.id]?.quantity || '1', note: p[sub.id]?.note || '' } }))}
                      />
                      <span className="text-xs text-gray-400">×</span>
                      <input
                        className="w-16 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400 text-right"
                        placeholder="수량"
                        type="number"
                        value={newItem[sub.id]?.quantity || '1'}
                        onChange={(e) => setNewItem((p) => ({ ...p, [sub.id]: { ...p[sub.id], name: p[sub.id]?.name || '', unit_price: p[sub.id]?.unit_price || '', quantity: e.target.value, note: p[sub.id]?.note || '' } }))}
                      />
                      <span className="text-xs text-gray-400">=</span>
                      <span className="text-xs text-primary-600 font-medium tabular-nums w-20 text-right">
                        ₩{fmt((Number(newItem[sub.id]?.unit_price) || 0) * (Number(newItem[sub.id]?.quantity) || 1))}
                      </span>
                      <input
                        className="w-20 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none"
                        placeholder="비고"
                        value={newItem[sub.id]?.note || ''}
                        onChange={(e) => setNewItem((p) => ({ ...p, [sub.id]: { ...p[sub.id], name: p[sub.id]?.name || '', unit_price: p[sub.id]?.unit_price || '', quantity: p[sub.id]?.quantity || '1', note: e.target.value } }))}
                      />
                      <button
                        onClick={() => handleAddItem(sub.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-white bg-primary-500 hover:bg-primary-600 rounded transition-colors"
                      >
                        <Plus size={12} /> 추가
                      </button>
                    </div>
                  </div>
                ))}

                {/* 세세목 추가 */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="세세목명 입력 (예: 위촉식 및 사전교육)"
                    value={newSubName[cat.id] || ''}
                    onChange={(e) => setNewSubName((p) => ({ ...p, [cat.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSub(cat.id)}
                  />
                  <button
                    onClick={() => handleAddSub(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus size={14} /> 세세목 추가
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 세목 추가 */}
      <div className="flex items-center gap-2">
        <input
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
          placeholder="세목명 입력 (예: 청소년단 운영비)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <button
          onClick={handleAddCategory}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus size={14} /> 세목 추가
        </button>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={`이 ${deleteTarget.type === 'category' ? '세목' : deleteTarget.type === 'sub' ? '세세목' : '품목'}을 삭제하시겠습니까? 하위 항목도 모두 삭제됩니다.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={false}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
