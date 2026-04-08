import client from './client'
import type { Expense, ExpenseCreate, ExpenseListResponse } from '../types'

export const getExpenses = (
  projectId: number,
  params?: { category_id?: number; sub_category_id?: number; budget_item_id?: number; start_date?: string; end_date?: string }
) => client.get<ExpenseListResponse>(`/api/v1/projects/${projectId}/expenses`, { params })

export const createExpense = (projectId: number, data: ExpenseCreate) =>
  client.post<Expense>(`/api/v1/projects/${projectId}/expenses`, data)

export const updateExpense = (id: number, data: Partial<ExpenseCreate>) =>
  client.put<Expense>(`/api/v1/expenses/${id}`, data)

export const deleteExpense = (id: number) =>
  client.delete(`/api/v1/expenses/${id}`)
