export const createFilterOptions = <T extends any>(
  data: T[] | undefined,
  accessor: (item: T) => any,
  icon?: React.ComponentType<{ className?: string }>
) => {
  return Array.from(new Set(data?.map(accessor).filter(Boolean))).map((value) => ({
    label: typeof value === 'string' ? value.replaceAll('_', ' ') : value || '',
    value: value || '',
    icon,
  }));
};
