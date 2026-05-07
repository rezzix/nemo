import { useState, useEffect } from 'react';
import { listHolidays } from '@/api/holidays';
import type { HolidayDto } from '@/types';

export function useHolidays(weekStart: string) {
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [holidayMap, setHolidayMap] = useState<Record<string, HolidayDto>>({});

  useEffect(() => {
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const endStr = end.toISOString().slice(0, 10);

    listHolidays({ startDate: weekStart, endDate: endStr })
      .then((data) => {
        setHolidays(data);
        const map: Record<string, HolidayDto> = {};
        data.forEach(h => { map[h.date] = h; });
        setHolidayMap(map);
      })
      .catch(() => {});
  }, [weekStart]);

  return { holidays, holidayMap };
}