export interface UpcomingLeave {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
}

export interface WeeklyAvailability {
  weekStart: Date;
  weekLabel: string;
  allocatedHours: number;
  leaveDays: number;
  leaveHours: number;
  availableHours: number;
  fullyOnLeave: boolean;
}

export interface AvailabilityData {
  weeklyCapacity: number;
  dailyHours: number;
  totalAllocation: number;
  totalAllocatedHours: number;
  totalAvailableHours: number;
  upcomingLeaves: UpcomingLeave[];
  weeklyBreakdown: WeeklyAvailability[];
}

const DAYS_PER_WEEK = 5;
const WEEKS_AHEAD = 8;

export function countWorkingDaysInRange(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 4);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function computeAvailability(
  weeklyCapacity: number,
  totalAllocation: number,
  approvedLeaves: { id: number; type: string; startDate: string; endDate: string }[]
): AvailabilityData {
  const dailyHours = weeklyCapacity / DAYS_PER_WEEK;
  const totalAllocatedHours = weeklyCapacity * totalAllocation / 100;
  const totalAvailableHours = weeklyCapacity - totalAllocatedHours;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingLeaves: UpcomingLeave[] = approvedLeaves
    .filter((leave) => {
      const end = new Date(leave.endDate);
      end.setHours(0, 0, 0, 0);
      return end >= today;
    })
    .map((leave) => ({
      id: leave.id,
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      workingDays: countWorkingDaysInRange(new Date(leave.startDate), new Date(leave.endDate)),
    }));

  const weeklyBreakdown: WeeklyAvailability[] = [];
  const currentWeekStart = getWeekStart(today);

  for (let i = 0; i < WEEKS_AHEAD; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() + i * 7);

    const weekEnd = getWeekEnd(weekStart);

    let leaveDaysThisWeek = 0;
    for (const leave of upcomingLeaves) {
      const leaveStart = new Date(leave.startDate);
      leaveStart.setHours(0, 0, 0, 0);
      const leaveEnd = new Date(leave.endDate);
      leaveEnd.setHours(23, 59, 59, 999);

      if (leaveStart <= weekEnd && leaveEnd >= weekStart) {
        const overlapStart = leaveStart > weekStart ? leaveStart : weekStart;
        const overlapEnd = leaveEnd < weekEnd ? leaveEnd : weekEnd;
        leaveDaysThisWeek += countWorkingDaysInRange(overlapStart, overlapEnd);
      }
    }

    const leaveHours = leaveDaysThisWeek * dailyHours;
    const availableHours = weeklyCapacity - totalAllocatedHours - leaveHours;
    const fullyOnLeave = leaveDaysThisWeek >= DAYS_PER_WEEK;

    weeklyBreakdown.push({
      weekStart,
      weekLabel: formatWeekLabel(weekStart),
      allocatedHours: totalAllocatedHours,
      leaveDays: leaveDaysThisWeek,
      leaveHours,
      availableHours,
      fullyOnLeave,
    });
  }

  return {
    weeklyCapacity,
    dailyHours,
    totalAllocation,
    totalAllocatedHours,
    totalAvailableHours,
    upcomingLeaves,
    weeklyBreakdown,
  };
}

export function allocationColor(allocation: number): string {
  if (allocation > 100) return 'text-red-600';
  if (allocation > 80) return 'text-yellow-600';
  return 'text-green-600';
}

export function allocationBgColor(allocation: number): string {
  if (allocation > 100) return 'bg-red-500';
  if (allocation > 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function availableColor(available: number): string {
  if (available < 0) return 'text-red-600';
  if (available === 0) return 'text-yellow-600';
  return 'text-green-600';
}

export function availableBgColor(available: number, capacity: number): string {
  if (available < 0) return 'bg-red-100';
  if (available === 0) return 'bg-yellow-50';
  return 'bg-green-50';
}