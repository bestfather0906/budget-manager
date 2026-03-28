import client from './client'
import type {
  BudgetSummary,
  MonthlyStatItem,
  Project,
  ProjectCreate,
  ProjectSummary,
} from '../types'

export const getProjects = () =>
  client.get<ProjectSummary[]>('/api/v1/projects')

export const getProject = (id: number) =>
  client.get<Project>(`/api/v1/projects/${id}`)

export const createProject = (data: ProjectCreate) =>
  client.post<Project>('/api/v1/projects', data)

export const updateProject = (id: number, data: Partial<ProjectCreate>) =>
  client.put<Project>(`/api/v1/projects/${id}`, data)

export const deleteProject = (id: number) =>
  client.delete(`/api/v1/projects/${id}`)

export const getProjectSummary = (id: number) =>
  client.get<BudgetSummary>(`/api/v1/projects/${id}/summary`)

export const getMonthlyStats = (id: number) =>
  client.get<MonthlyStatItem[]>(`/api/v1/projects/${id}/monthly-stats`)

export const exportExcel = (id: number) =>
  client.get(`/api/v1/projects/${id}/export`, { responseType: 'blob' })
