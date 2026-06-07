import { create } from 'zustand';
import type { DateFilter, DateFilterType } from '@/types';
import { getDateRange } from '@/lib/utils';

interface FilterState {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  getDateRange: () => { start: Date; end: Date };
}

export const useFilterStore = create<FilterState>((set, get) => ({
  dateFilter: { type: 'thisMonth' },

  setDateFilter: (filter) => set({ dateFilter: filter }),

  getDateRange: () => {
    const { dateFilter } = get();
    if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
      return { start: dateFilter.startDate, end: dateFilter.endDate };
    }
    return getDateRange(dateFilter.type);
  },
}));
