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

    const notifications = (await fetchNotificationsByCompany(companyId)) as Notifications[];
    set({ notifications: notifications ?? [] });
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

// Polling de notificaciones — controlado por componentes que lo necesiten.
// Se pausa con la pestaña en background para no consumir egress mientras nadie mira.
const POLL_INTERVAL_MS = 60_000;
let notificationPollInterval: NodeJS.Timeout | null = null;
let visibilityListenerAttached = false;
let activeSubscribers = 0;

function tick() {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
  useUiStore.getState().allNotifications();
}

function ensureInterval() {
  if (notificationPollInterval) return;
  notificationPollInterval = setInterval(tick, POLL_INTERVAL_MS);
}

function clearPollInterval() {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval);
    notificationPollInterval = null;
  }
}

function handleVisibilityChange() {
  if (activeSubscribers === 0) return;
  if (document.visibilityState === 'visible') {
    ensureInterval();
    tick();
  } else {
    clearPollInterval();
  }
}

function startNotificationPolling() {
  if (typeof window === 'undefined') return;
  activeSubscribers += 1;
  if (!visibilityListenerAttached) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityListenerAttached = true;
  }
  if (document.visibilityState === 'visible') {
    ensureInterval();
    tick();
  }
}

function stopNotificationPolling() {
  if (typeof window === 'undefined') return;
  activeSubscribers = Math.max(0, activeSubscribers - 1);
  if (activeSubscribers === 0) {
    clearPollInterval();
    if (visibilityListenerAttached) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      visibilityListenerAttached = false;
    }
  }
}

export { startNotificationPolling, stopNotificationPolling };
