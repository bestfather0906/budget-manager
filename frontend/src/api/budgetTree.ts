import axios from './client'
import type {
  BudgetCategory,
  BudgetCategoryWithTree,
  BudgetItem,
  BudgetSubCategory,
  BudgetItemCreate,
  CategoryCreate,
  SubCategoryCreate,
} from '../types'

// ── 세목 ─────────────────────────────────────────────────────

export const getCategories = (projectId: number) =>
  axios.get<BudgetCategory[]>(`/api/v1/projects/${projectId}/categories`)

export const getBudgetTree = (projectId: number) =>
  axios.get<BudgetCategoryWithTree[]>(`/api/v1/projects/${projectId}/budget-tree`)

export const createCategory = (projectId: number, data: CategoryCreate) =>
  axios.post<BudgetCategory>(`/api/v1/projects/${projectId}/categories`, data)

export const updateCategory = (categoryId: number, data: Partial<CategoryCreate>) =>
  axios.put<BudgetCategory>(`/api/v1/categories/${categoryId}`, data)

export const deleteCategory = (categoryId: number) =>
  axios.delete(`/api/v1/categories/${categoryId}`)

// ── 세세목 ───────────────────────────────────────────────────

export const getSubCategories = (categoryId: number) =>
  axios.get<BudgetSubCategory[]>(`/api/v1/categories/${categoryId}/sub-categories`)

export const createSubCategory = (categoryId: number, data: SubCategoryCreate) =>
  axios.post<BudgetSubCategory>(`/api/v1/categories/${categoryId}/sub-categories`, data)

export const updateSubCategory = (subCategoryId: number, data: Partial<SubCategoryCreate>) =>
  axios.put<BudgetSubCategory>(`/api/v1/sub-categories/${subCategoryId}`, data)

export const deleteSubCategory = (subCategoryId: number) =>
  axios.delete(`/api/v1/sub-categories/${subCategoryId}`)

// ── 품목 ─────────────────────────────────────────────────────

export const getBudgetItems = (subCategoryId: number) =>
  axios.get<BudgetItem[]>(`/api/v1/sub-categories/${subCategoryId}/budget-items`)

export const createBudgetItem = (subCategoryId: number, data: BudgetItemCreate) =>
  axios.post<BudgetItem>(`/api/v1/sub-categories/${subCategoryId}/budget-items`, data)

export const updateBudgetItem = (itemId: number, data: Partial<BudgetItemCreate>) =>
  axios.put<BudgetItem>(`/api/v1/budget-items/${itemId}`, data)

export const deleteBudgetItem = (itemId: number) =>
  axios.delete(`/api/v1/budget-items/${itemId}`)
