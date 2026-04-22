import { profileUser } from '@/shared/types/types';
import { create } from 'zustand';
// TODO: Phase 8+ — Remove supabase import once .auth.getUser() is replaced with NextAuth session
import { supabaseBrowser } from '@/shared/lib/supabase/browser';
import { fetchProfileByCredentialId } from '@/shared/actions/auth';

type AuthUser = { id: string; email?: string; [key: string]: any } | null;

interface AuthState {
  credentialUser: AuthUser;
  profile: profileUser[];
  codeControlRole: string;
  roleActualCompany: string;
  setCredentialUser: (user: AuthUser) => void;
  setProfile: (profile: profileUser[]) => void;
  setCodeControlRole: (role: string) => void;
  setRoleActualCompany: (role: string | undefined) => void;
  handleActualCompanyRole: () => void;
  profileUser: (id: string) => void;
  loggedUser: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  credentialUser: null,
  profile: [],
  codeControlRole: '',
  roleActualCompany: '',

  setCredentialUser: (user) => set({ credentialUser: user }),
  setProfile: (profile) => set({ profile }),
  setCodeControlRole: (role) => set({ codeControlRole: role }),
  setRoleActualCompany: (role) => set({ roleActualCompany: role as any }),

  handleActualCompanyRole: () => {
    // Import dynamically to avoid circular deps
    const { useCompanyStore } = require('./companyStore');
    const sharedUsers = useCompanyStore.getState().sharedUsers;
    const profile = get().profile;
    const user = sharedUsers?.find((e: any) => e.profile_id.id === profile?.[0]?.id);
    if (user) {
      set({ roleActualCompany: user.role });
    } else {
      set({ roleActualCompany: undefined as any });
    }
  },

  profileUser: async (id: string) => {
    if (!id) return;
    const data = await fetchProfileByCredentialId(id);
    if (!data || data.length === 0) {
      console.error('Error al obtener el perfil');
    } else {
      set({ profile: data as unknown as profileUser[] || [] });
      set({ codeControlRole: (data as any)?.[0]?.role });
      const { useCompanyStore } = require('./companyStore');
      useCompanyStore.getState().howManyCompanies((data as any)[0]?.id);
    }
  },

  // TODO: Phase 8+ — Replace with NextAuth session
  loggedUser: async () => {
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      set({ credentialUser: user });
    }
    if (typeof window !== 'undefined') {
      get().profileUser(user?.id || '');
    }
  },
}));
