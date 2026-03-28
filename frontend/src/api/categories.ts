import client from './client'
import type { BudgetCategory, CategoryCreate } from '../types'

export const getCategories = (projectId: number) =>
  client.get<BudgetCategory[]>(`/api/v1/projects/${projectId}/categories`)

export const createCategory = (projectId: number, data: CategoryCreate) =>
  client.post<BudgetCategory>(`/api/v1/projects/${projectId}/categories`, data)

export const updateCategory = (id: number, data: Partial<CategoryCreate>) =>
  client.put<BudgetCategory>(`/api/v1/categories/${id}`, data)

export const deleteCategory = (id: number) =>
  client.delete(`/api/v1/categories/${id}`)
