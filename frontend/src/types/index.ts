export interface Project {
  id: number
  name: string
  description?: string
  total_budget: number
  start_date?: string
  end_date?: string
  created_at: string
}

export interface ProjectSummary extends Project {
  total_spent: number
  execution_rate: number
  status_color: 'green' | 'yellow' | 'red'
}

// ── 예산 계층 구조 ───────────────────────────────────────────

export interface BudgetCategory {
  id: number
  project_id: number
  name: string
  order_index: number
}

export interface BudgetSubCategory {
  id: number
  category_id: number
  name: string
  order_index: number
}

export interface BudgetItem {
  id: number
  sub_category_id: number
  name: string
  unit_price: number
  quantity: number
  note?: string
  planned_amount: number
}

export interface BudgetSubCategoryWithItems extends BudgetSubCategory {
  budget_items: BudgetItem[]
}

export interface BudgetCategoryWithTree extends BudgetCategory {
  sub_categories: BudgetSubCategoryWithItems[]
}

// ── 집행현황 요약 ────────────────────────────────────────────

export interface CategoryBudgetItem {
  category_id: number
  category_name: string
  allocated_amount: number
  spent_amount: number
  remaining: number
  execution_rate: number
  status_color: 'green' | 'yellow' | 'red'
}

export interface BudgetSummary {
  project_id: number
  project_name: string
  total_budget: number
  total_spent: number
  total_remaining: number
  execution_rate: number
  budget_warning: boolean
  categories: CategoryBudgetItem[]
}

// ── 결제수단 ─────────────────────────────────────────────────

export interface PaymentMethod {
  id: number
  type: 'credit' | 'debit' | 'account'
  nickname: string
  number: string
  is_active: boolean
  created_at: string
}

export interface PaymentMethodListResponse {
  items: PaymentMethod[]
  total_count: number
}

// ── 지출 ─────────────────────────────────────────────────────

export interface Expense {
  id: number
  project_id: number
  budget_item_id: number
  budget_item_name: string
  sub_category_name: string
  category_name: string
  expense_date: string
  amount: number
  description: string
  vendor?: string
  payment_method_id?: number
  payment_method_nickname?: string
  payment_method_type?: string
  payment_method_number?: string
  withdrawal_date?: string
  created_at: string
  updated_at: string
}

export interface ExpenseListResponse {
  items: Expense[]
  total_count: number
  total_amount: number
}

export interface ExpenseCreate {
  budget_item_id: number
  expense_date: string
  amount: number
  description: string
  vendor?: string
  payment_method_id?: number | null
  withdrawal_date?: string | null
}

// ── 월별 통계 ────────────────────────────────────────────────

export interface MonthlyStatItem {
  month: string
  category_name: string
  total_amount: number
}

// ── 프로젝트 생성/수정 ───────────────────────────────────────

export interface ProjectCreate {
  name: string
  description?: string
  total_budget: number
  start_date?: string
  end_date?: string
}

export interface CategoryCreate {
  name: string
  order_index?: number
}

export interface SubCategoryCreate {
  name: string
  order_index?: number
}

export interface BudgetItemCreate {
  name: string
  unit_price: number
  quantity: number
  note?: string
}
