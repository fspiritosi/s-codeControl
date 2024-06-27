import { create } from 'zustand';

interface State {
  expanded: boolean;
  setExpanded: (open: boolean) => void;
}

/**
 * Creates a custom store for managing the logged-in user's data.
 * @param set - A function used to update the store's state.
 * @param get - A function used to access the store's state.
 * @returns An object containing the store's state properties.
 */
export const useSidebarOpen = create<State>((set, get) => {
  set({ expanded: true });

  const setExpanded = () => {
    set({ expanded: !get().expanded });
  };

  return {
    expanded: get().expanded,
    setExpanded,
  };
});
