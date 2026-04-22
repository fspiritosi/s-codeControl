import { Notifications } from '@/shared/types/types';
import { create } from 'zustand';
import { fetchNotificationsByCompany, deleteNotificationsByCompany } from '@/shared/actions/notifications';

interface UiState {
  active_sidebar: boolean;
  notifications: Notifications[];
  toggleSidebar: () => void;
  setActiveSidebar: (active: boolean) => void;
  allNotifications: () => void;
  markAllAsRead: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  active_sidebar: false,
  notifications: [],

  toggleSidebar: () => {
    set({ active_sidebar: !get().active_sidebar });
  },

  setActiveSidebar: (active) => set({ active_sidebar: active }),

  allNotifications: async () => {
    const { useCompanyStore } = require('./companyStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;
    if (!companyId) return;

    const notifications = await fetchNotificationsByCompany(companyId);

    const sorted = notifications?.sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) as Notifications[];

    set({ notifications: sorted });
  },

  markAllAsRead: async () => {
    const { useCompanyStore } = require('./companyStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;

    const result = await deleteNotificationsByCompany(companyId);

    if (result.error) {
      console.error('Error al marcar todas las notificaciones como leídas:', result.error);
    } else {
      get().allNotifications();
    }
  },
}));

// Polling replacement for real-time subscription (15s for notifications - more time-sensitive)
let notificationPollInterval: NodeJS.Timeout | null = null;

function startNotificationPolling() {
  if (notificationPollInterval) return;
  notificationPollInterval = setInterval(() => {
    useUiStore.getState().allNotifications();
  }, 15000);
}

function stopNotificationPolling() {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval);
    notificationPollInterval = null;
  }
}

if (typeof window !== 'undefined') {
  startNotificationPolling();
}

export { startNotificationPolling, stopNotificationPolling };
