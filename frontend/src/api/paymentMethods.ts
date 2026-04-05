import client from './client'
import type { PaymentMethod, PaymentMethodListResponse } from '../types'

export const getPaymentMethods = (activeOnly = false) =>
  client.get<PaymentMethodListResponse>('/api/v1/payment-methods', {
    params: activeOnly ? { active_only: true } : undefined,
  })

export const createPaymentMethod = (data: {
  type: 'card' | 'account'
  nickname: string
  number: string
}) => client.post<PaymentMethod>('/api/v1/payment-methods', data)

export const updatePaymentMethod = (
  id: number,
  data: { nickname?: string; is_active?: boolean }
) => client.put<PaymentMethod>(`/api/v1/payment-methods/${id}`, data)

export const deletePaymentMethod = (id: number) =>
  client.delete(`/api/v1/payment-methods/${id}`)
