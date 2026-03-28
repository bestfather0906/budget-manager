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

export interface BudgetCategory {
  id: number
  project_id: number
  name: string
  allocated_amount: number
  order_index: number
}

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

export interface Expense {
  id: number
  project_id: number
  category_id: number
  category_name: string
  expense_date: string
  amount: number
  description: string
  vendor?: string
  card_number?: string
  created_at: string
  updated_at: string
}

export interface ExpenseListResponse {
  items: Expense[]
  total_count: number
  total_amount: number
}

export interface MonthlyStatItem {
  month: string
  category_name: string
  total_amount: number
}

export interface ExpenseCreate {
  category_id: number
  expense_date: string
  amount: number
  description: string
  vendor?: string
  card_number?: string
}

export interface ProjectCreate {
  name: string
  description?: string
  total_budget: number
  start_date?: string
  end_date?: string
}

export interface CategoryCreate {
  name: string
  allocated_amount: number
  order_index?: number
}
