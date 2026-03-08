import { Notifications } from '@/types/types';
import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';
import {
  fetchNotificationsByCompany,
  deleteNotificationsByCompany,
} from '@/app/server/GET/actions';

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

// TODO: Phase 5 - replace with polling/SSE
// Real-time subscription for notifications
if (typeof window !== 'undefined') {
  supabase
    .channel('realtime-notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
      useUiStore.getState().allNotifications();
    })
    .subscribe();
}
