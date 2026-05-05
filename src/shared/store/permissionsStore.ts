import { create } from 'zustand';

interface PermissionsState {
  permissions: Set<string>;
  setPermissions: (codes: string[]) => void;
  can: (code: string) => boolean;
  reset: () => void;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: new Set<string>(),
  setPermissions: (codes) => set({ permissions: new Set(codes) }),
  can: (code) => get().permissions.has(code),
  reset: () => set({ permissions: new Set() }),
}));
