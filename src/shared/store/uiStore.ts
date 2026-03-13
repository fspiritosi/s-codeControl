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
    const { useDocumentStore } = require('./documentStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;

    const notifications = await fetchNotificationsByCompany(companyId);

    await useDocumentStore.getState().documetsFetch();

    const allDocumentsToShow = useDocumentStore.getState().allDocumentsToShow;

    const document = notifications?.map((doc: any) => {
      const findDocument =
        allDocumentsToShow?.employees?.find((document: any) => document.id === doc.document_id) ||
        allDocumentsToShow?.vehicles?.find((document: any) => document.id === doc.document_id);
      if (findDocument) {
        return { ...doc, document: findDocument };
      } else {
        return doc;
      }
    });

    const tipedData = document?.sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) as Notifications[];

    set({ notifications: tipedData });
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
