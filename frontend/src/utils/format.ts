import type { IssuePriority } from '@/types';
import { getCurrency } from '@/hooks/useVersion';

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const priorityColors: Record<IssuePriority, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-blue-100 text-blue-700',
};

export function priorityColor(priority: IssuePriority): string {
  return priorityColors[priority] ?? 'bg-gray-100 text-gray-700';
}

export function statusColor(statusName: string): string {
  const s = statusName.toLowerCase();
  if (s.includes('closed')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('done') || s.includes('complete')) return 'bg-green-100 text-green-700';
  if (s.includes('progress') || s.includes('active')) return 'bg-blue-100 text-blue-700';
  if (s.includes('todo') || s.includes('open')) return 'bg-gray-100 text-gray-700';
  if (s.includes('review')) return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
}

// PMO / RAID helpers

export function riskColor(score: number): string {
  if (score >= 16) return 'bg-red-100 text-red-800';
  if (score >= 10) return 'bg-orange-100 text-orange-800';
  if (score >= 5) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

export function riskLabel(score: number): string {
  if (score >= 16) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

export function stageBadge(stage: string | null): string {
  switch (stage) {
    case 'INITIATION': return 'bg-blue-100 text-blue-800';
    case 'PLANNING': return 'bg-purple-100 text-purple-800';
    case 'EXECUTION': return 'bg-amber-100 text-amber-800';
    case 'CLOSING': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function stageLabel(stage: string | null): string {
  if (!stage) return '—';
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

export function raidTypeColor(type: string): string {
  switch (type) {
    case 'RISK': return 'bg-red-50 text-red-700 border-red-200';
    case 'ASSUMPTION': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ISSUE': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'DEPENDENCY': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function raidStatusBadge(status: string): string {
  switch (status) {
    case 'OPEN': return 'bg-yellow-100 text-yellow-800';
    case 'MITIGATING': return 'bg-blue-100 text-blue-800';
    case 'RESOLVED': return 'bg-green-100 text-green-800';
    case 'CLOSED': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function eviColor(value: number): string {
  if (value >= 1) return 'text-green-600';
  if (value >= 0.9) return 'text-yellow-600';
  return 'text-red-600';
}

export function deliverableStateBadge(state: string): string {
  switch (state) {
    case 'DRAFT': return 'bg-gray-100 text-gray-800';
    case 'DELIVERED': return 'bg-blue-100 text-blue-800';
    case 'VALIDATED': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function deliverableStateLabel(state: string): string {
  switch (state) {
    case 'DRAFT': return 'Draft';
    case 'DELIVERED': return 'Delivered';
    case 'VALIDATED': return 'Validated';
    default: return state;
  }
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  const symbol = getCurrency();
  const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, "'");
  return symbol + ' ' + formatted;
}

export function scoreLabel(score: number): string {
  switch (score) {
    case 0: return 'Marginal';
    case 1: return 'Functional';
    case 2: return 'Impactful';
    case 4: return 'Strategic';
    case 5: return 'Exceptional';
    default: return '—';
  }
}

export function scoreColor(score: number): string {
  switch (score) {
    case 5: return 'bg-emerald-100 text-emerald-700';
    case 4: return 'bg-green-100 text-green-700';
    case 2: return 'bg-blue-100 text-blue-700';
    case 1: return 'bg-yellow-100 text-yellow-700';
    case 0: return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function roleBadgeColor(role: string): string {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-700';
    case 'MANAGER': return 'bg-blue-100 text-blue-700';
    case 'EXECUTIVE': return 'bg-purple-100 text-purple-700';
    case 'HR': return 'bg-pink-100 text-pink-700';
    case 'CONTRIBUTOR': return 'bg-green-100 text-green-700';
    case 'EXTERNAL': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}