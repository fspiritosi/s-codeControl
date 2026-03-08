import { AllDocumentsValues } from '@/types/types';
import { create } from 'zustand';

interface State {
  documentsErrors: boolean[];
  addDocumentsErrors: (index: number) => void;
  resetDocumentErrors: () => void;
  updateDocumentErrors: (index: number, boolean: boolean) => void;
  hasErrors: boolean;
  deleteDocument: (index: number) => void;
  setTotalForms: (increment: boolean) => void;
  totalForms: number;
  resetAll: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  AllDocumentsValues: AllDocumentsValues[];
  setAllFormsValues: (formsValues: AllDocumentsValues) => void;
  sendAllForms: () => void;
}

export const DocumentsValidation = create<State>((set, get) => {
  const allFormsValid = () => {
    const errorsCheck = get().documentsErrors.some((error) => error === true);
    const totalCheck = get().totalForms === get().documentsErrors.length;

    if (errorsCheck || !totalCheck) {
      set({ hasErrors: true });
    } else {
      set({ hasErrors: false });
    }
  };

  return {
    documentsErrors: [],
    totalForms: 1,
    hasErrors: true,
    loading: false,
    AllDocumentsValues: [],

    addDocumentsErrors: (index: number) => {
      const allErros = get().documentsErrors;
      const newValues = [...allErros, (allErros[index] = true)];
      set({ documentsErrors: newValues });
      allFormsValid();
    },

    resetDocumentErrors: () => {
      set({ documentsErrors: [] });
      allFormsValid();
    },

    deleteDocument: (index: number) => {
      const allDocuments = get().documentsErrors;
      const newDocuments = allDocuments.slice(index, 1);
      set({ documentsErrors: newDocuments });
      allFormsValid();
    },

    updateDocumentErrors: (index: number, boolean: boolean) => {
      const newErrors = [...get().documentsErrors];
      newErrors[index] = boolean;
      set({ documentsErrors: newErrors });
      allFormsValid();
    },

    setTotalForms: (increment: boolean) => {
      const total = get().totalForms;
      if (increment) {
        set({ totalForms: total + 1 });
      } else {
        if (total === 1) return;
        set({ totalForms: total - 1 });
      }
      allFormsValid();
    },

    setAllFormsValues: async (formsValues: AllDocumentsValues) => {
      set({ AllDocumentsValues: [...get().AllDocumentsValues, formsValues] });
    },

    sendAllForms: async () => {},

    resetAll: () => {
      set({ documentsErrors: [] });
      set({ totalForms: 1 });
      set({ hasErrors: true });
      set({ AllDocumentsValues: [] });
    },

    setLoading: (loading: boolean) => set({ loading }),
  };
});
