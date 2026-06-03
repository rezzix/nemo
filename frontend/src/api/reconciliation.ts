import { apiGet, apiPost } from './client';
import type { ReconciliationViewDto, UnmatchedPaymentDto, UnreconciledTransactionDto, UnreconciledCountDto, ReconcileRequest } from '@/types';

export async function getReconciliationView(): Promise<ReconciliationViewDto> {
  return apiGet<ReconciliationViewDto>('/reconciliation/view');
}

export async function getUnreconciledCount(): Promise<UnreconciledCountDto> {
  return apiGet<UnreconciledCountDto>('/reconciliation/unreconciled-count');
}

export async function suggestMatches(transactionId: number): Promise<UnmatchedPaymentDto[]> {
  return apiGet<UnmatchedPaymentDto[]>(`/reconciliation/suggest/${transactionId}`);
}

export async function reconcile(transactionId: number, request: ReconcileRequest): Promise<UnreconciledTransactionDto> {
  return apiPost<UnreconciledTransactionDto>(`/reconciliation/bank-transactions/${transactionId}/reconcile`, request);
}

export async function unreconcile(transactionId: number): Promise<UnreconciledTransactionDto> {
  return apiPost<UnreconciledTransactionDto>(`/reconciliation/bank-transactions/${transactionId}/unreconcile`);
}

export async function getReconciledTransactions(): Promise<UnreconciledTransactionDto[]> {
  return apiGet<UnreconciledTransactionDto[]>('/reconciliation/reconciled');
}