import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

/** 비목 관리 페이지는 예산계획 관리로 통합되었습니다. */
export default function CategoryManage() {
  const { id } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/projects/${id}/budget-plan`, { replace: true })
  }, [id, navigate])
  return null
}
