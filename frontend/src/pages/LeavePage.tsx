import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { listLeaveRequests, listPendingLeaveRequests, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest, getLeaveBalances, calculateWorkingDays } from '@/api/leave';
import type { LeaveRequestDto, LeaveType, LeaveStatus, CreateLeaveRequest, LeaveBalanceDto } from '@/types';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Spinner from '@/components/common/Spinner';

const leaveTypeLabels: Record<LeaveType, string> = {
  VACATION: 'Vacation',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal',
  UNPAID: 'Unpaid Leave',
};

const leaveTypeColors: Record<LeaveType, string> = {
  VACATION: 'bg-blue-100 text-blue-700 border-blue-200',
  SICK: 'bg-orange-100 text-orange-700 border-orange-200',
  PERSONAL: 'bg-purple-100 text-purple-700 border-purple-200',
  UNPAID: 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusColors: Record<LeaveStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function LeavePage() {
  const user = useAuthStore((s) => s.user);
  const canApprove = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'EXECUTIVE';

  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestDto[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const [all, pending, bals] = await Promise.all([
        listLeaveRequests(params),
        canApprove ? listPendingLeaveRequests() : Promise.resolve([]),
        getLeaveBalances(),
      ]);
      setRequests(all);
      setPendingRequests(pending);
      setBalances(bals);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, canApprove]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!actionId || !actionType) return;
    try {
      if (actionType === 'approve') {
        await approveLeaveRequest(actionId, actionComment || undefined);
      } else {
        await rejectLeaveRequest(actionId, actionComment || undefined);
      }
      setActionId(null);
      setActionComment('');
      setActionType(null);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await cancelLeaveRequest(id);
      fetchData();
    } catch { /* ignore */ }
  };

  const displayList = tab === 'pending' ? pendingRequests : requests;

  const totalDays = (r: LeaveRequestDto) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Request Leave
        </button>
      </div>

      {/* Balance cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {balances.map((b) => (
            <div key={b.type} className={`rounded-lg border p-3 ${leaveTypeColors[b.type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-75">{leaveTypeLabels[b.type] || b.type}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold">{b.remainingDays}</span>
                <span className="text-xs opacity-75">remaining</span>
              </div>
              <div className="text-xs mt-0.5 opacity-75">{b.usedDays} used / {b.totalAllocated} allocated</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setTab('all')} className={`px-3 py-1.5 text-sm font-medium ${tab === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            All Requests
          </button>
          {canApprove && (
            <button onClick={() => setTab('pending')} className={`px-3 py-1.5 text-sm font-medium ${tab === 'pending' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Pending ({pendingRequests.length})
            </button>
          )}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All types</option>
          <option value="VACATION">Vacation</option>
          <option value="SICK">Sick Leave</option>
          <option value="PERSONAL">Personal</option>
          <option value="UNPAID">Unpaid Leave</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {displayList.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No leave requests found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">End</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Days</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Approver</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayList.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.userName}</td>
                    <td className="px-4 py-3">{leaveTypeLabels[r.type] || r.type}</td>
                    <td className="px-4 py-3">{r.startDate}</td>
                    <td className="px-4 py-3">{r.endDate}</td>
                    <td className="px-4 py-3 text-right">{totalDays(r)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-40 truncate">{r.reason || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.approverName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {canApprove && r.status === 'PENDING' && (
                          <>
                            <button onClick={() => { setActionId(r.id); setActionType('approve'); setActionComment(''); }} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                            <button onClick={() => { setActionId(r.id); setActionType('reject'); setActionComment(''); }} className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>
                          </>
                        )}
                        {(r.status === 'PENDING' || r.status === 'APPROVED') && r.userId === user?.id && (
                          <button onClick={() => handleCancel(r.id)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && <CreateLeaveModal balances={balances} onClose={() => { setShowCreate(false); fetchData(); }} />}

      {actionId && actionType && (
        <Modal title={actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'} onClose={() => { setActionId(null); setActionType(null); }}>
          <div className="space-y-4">
            <Field label="Comment (optional)" value={actionComment} onChange={setActionComment} />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setActionId(null); setActionType(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleAction} className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateLeaveModal({ balances, onClose }: { balances: LeaveBalanceDto[]; onClose: () => void }) {
  const [type, setType] = useState<LeaveType>('VACATION');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workingDays, setWorkingDays] = useState<number | null>(null);

  const selectedBalance = balances.find(b => b.type === type);

  useEffect(() => {
    if (startDate && endDate && startDate <= endDate) {
      calculateWorkingDays(startDate, endDate)
        .then(res => setWorkingDays(res.workingDays))
        .catch(() => setWorkingDays(null));
    } else {
      setWorkingDays(null);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const request: CreateLeaveRequest = { type, startDate, endDate, reason: reason || undefined };
      await createLeaveRequest(request);
      onClose();
    } catch {
      setError('Failed to create leave request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Request Leave" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as LeaveType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="VACATION">Vacation</option>
            <option value="SICK">Sick Leave</option>
            <option value="PERSONAL">Personal</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
          {selectedBalance && (
            <p className={`mt-1 text-sm font-medium ${selectedBalance.remainingDays > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Remaining: {selectedBalance.remainingDays} days (of {selectedBalance.totalAllocated} allocated)
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start Date" type="date" value={startDate} onChange={setStartDate} required />
          <Field label="End Date" type="date" value={endDate} onChange={setEndDate} required />
        </div>
        {workingDays != null && (
          <div className="text-sm text-gray-600">
            Working days: <span className="font-semibold">{workingDays}</span> (excluding weekends &amp; holidays)
          </div>
        )}
        {workingDays != null && selectedBalance && workingDays > selectedBalance.remainingDays && selectedBalance.totalAllocated > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2">
            Warning: this request exceeds your remaining balance ({selectedBalance.remainingDays} days remaining).
          </div>
        )}
        <Field label="Reason (optional)" value={reason} onChange={setReason} />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}