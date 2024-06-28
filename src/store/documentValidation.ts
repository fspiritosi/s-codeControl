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
  set({ documentsErrors: [] });
  set({ totalForms: 1 });
  set({ hasErrors: true });
  set({ loading: false });

  const addDocumentsErrors = (index: number) => {
    const allErros = get()?.documentsErrors;
    const newValues = [...allErros, (allErros[index] = true)];
    set({ documentsErrors: newValues });
    allFormsValid();
  };

  const resetDocumentErrors = () => {
    set({ documentsErrors: [] });
    allFormsValid();
  };

  const deleteDocument = (index: number) => {
    const allDocuments = get()?.documentsErrors;
    const newDocuments = allDocuments.slice(index, 1);
    set({ documentsErrors: newDocuments });
    allFormsValid();
  };

  const updateDocumentErrors = (index: number, boolean: boolean) => {
    const newErrors = [...get().documentsErrors];
    newErrors[index] = boolean;
    set({ documentsErrors: newErrors });
    allFormsValid();
  };

  const setTotalForms = (increment: boolean) => {
    const total = get()?.totalForms;
    if (increment) {
      set({ totalForms: total + 1 });
    } else {
      if (total === 1) return;
      set({ totalForms: total - 1 });
    }
    allFormsValid();
  };

  const allFormsValid = () => {
    const errorsCheck = get().documentsErrors.some((error) => error === true);
    const totalCheck = get().totalForms === get().documentsErrors.length;

    if (errorsCheck || !totalCheck) {
      set({ hasErrors: true });
    } else {
      set({ hasErrors: false });
    }
  };

  const setAllFormsValues = async (formsValues: AllDocumentsValues) => {
    set({ AllDocumentsValues: [...get?.().AllDocumentsValues, formsValues] });
  };

  const sendAllForms = async () => {};

  const resetAll = () => {
    set({ documentsErrors: [] });
    set({ totalForms: 1 });
    set({ hasErrors: true });
    set({ AllDocumentsValues: [] });
  };

  return {
    documentsErrors: get().documentsErrors,
    addDocumentsErrors,
    hasErrors: get().hasErrors,
    resetDocumentErrors,
    updateDocumentErrors,
    deleteDocument,
    setTotalForms,
    totalForms: get().totalForms,
    resetAll,
    loading: get().loading,
    setLoading: (loading: boolean) => set({ loading }),
    AllDocumentsValues: get().AllDocumentsValues,
    setAllFormsValues,
    sendAllForms,
  };
});
