import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import ProjectForm from './pages/ProjectForm'
import BudgetPlan from './pages/BudgetPlan'
import ExpenseList from './pages/ExpenseList'
import ExpenseForm from './pages/ExpenseForm'
import MonthlyStats from './pages/MonthlyStats'
import PaymentMethodManage from './pages/PaymentMethodManage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects/new" element={<ProjectForm mode="new" />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<ProjectForm mode="edit" />} />
          <Route path="/projects/:id/budget-plan" element={<BudgetPlan />} />
          <Route path="/projects/:id/expenses" element={<ExpenseList />} />
          <Route path="/projects/:id/expenses/new" element={<ExpenseForm mode="new" />} />
          <Route path="/projects/:id/expenses/:eid/edit" element={<ExpenseForm mode="edit" />} />
          <Route path="/projects/:id/monthly" element={<MonthlyStats />} />
          <Route path="/payment-methods" element={<PaymentMethodManage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function SettingsPage() {
  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-2">설정</h2>
      <p className="text-sm text-gray-400">추후 기능이 추가될 예정입니다.</p>
    </div>
  )
}
