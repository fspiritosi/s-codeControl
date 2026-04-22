import type { DataTableFilterOption } from '@/shared/components/data-table/types';

export const createFilterOptions = <T,>(
  data: T[] | undefined,
  accessor: (item: T) => any,
): DataTableFilterOption[] => {
  return Array.from(new Set(data?.map(accessor).filter(Boolean))).map((value) => ({
    label: typeof value === 'string' ? value.replaceAll('_', ' ') : value || '',
    value: value || '',
  }));
};
