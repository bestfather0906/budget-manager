import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createProject, getProject, updateProject } from '../api/projects'
import type { ProjectCreate } from '../types'
import Toast from '../components/ui/Toast'

export default function ProjectForm({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<ProjectCreate>({
    name: '',
    description: '',
    total_budget: 0,
    start_date: '',
    end_date: '',
  })
  const [rawBudget, setRawBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (mode === 'edit' && id) {
      getProject(Number(id)).then((r) => {
        setForm({
          name: r.data.name,
          description: r.data.description || '',
          total_budget: r.data.total_budget,
          start_date: r.data.start_date || '',
          end_date: r.data.end_date || '',
        })
        setRawBudget(r.data.total_budget.toString())
      })
    }
  }, [mode, id])

  const handleBudgetChange = (v: string) => {
    const digits = v.replace(/[^0-9]/g, '')
    setRawBudget(digits)
    setForm((f) => ({ ...f, total_budget: digits ? Number(digits) : 0 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setToast({ msg: '사업명을 입력해주세요.', type: 'error' })
    if (!form.total_budget) return setToast({ msg: '예산을 입력해주세요.', type: 'error' })

    setLoading(true)
    try {
      const payload = {
        ...form,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        description: form.description || undefined,
      }
      if (mode === 'edit' && id) {
        await updateProject(Number(id), payload)
        setToast({ msg: '사업이 수정되었습니다.', type: 'success' })
        setTimeout(() => navigate(`/projects/${id}`), 1000)
      } else {
        const r = await createProject(payload)
        setToast({ msg: '사업이 생성되었습니다.', type: 'success' })
        setTimeout(() => navigate(`/projects/${r.data.id}`), 1000)
      }
    } catch (err: unknown) {
      setToast({ msg: (err as Error).message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const displayBudget = rawBudget ? Number(rawBudget).toLocaleString('ko-KR') : ''

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        {mode === 'new' ? '새 사업 등록' : '사업 수정'}
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            사업명 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 2025년 스마트시티 사업"
            required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">사업 설명</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="사업에 대한 간단한 설명"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">사업 시작일</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">사업 종료일</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            전체 예산 <span className="text-red-400">*</span>
          </label>
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 focus-within:border-primary-500 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-primary-400 font-bold text-lg">₩</span>
              <input
                type="text"
                value={displayBudget}
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="0"
                className="flex-1 text-2xl font-bold text-primary-600 bg-transparent focus:outline-none tabular-nums"
              />
            </div>
          </div>
        </div>

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
            {loading ? '저장 중...' : mode === 'new' ? '사업 생성' : '수정 완료'}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
