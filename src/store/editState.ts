import { create } from 'zustand';

interface State {
  readonly: boolean;
  setReadOnly: (readonly: boolean) => void;
}

/**
 * Creates a custom store for managing the logged-in user's data.
 * @param set - A function used to update the store's state.
 * @param get - A function used to access the store's state.
 * @returns An object containing the store's state properties.
 */
export const useEditButton = create<State>((set, get) => {
  //set({ readonly: true });

  const setReadOnly = (readonly: boolean) => {
    set({ readonly: !readonly });
  };

  return {
    readonly: true,
    //readonly: get().readonly,
    setReadOnly,
  };
});
