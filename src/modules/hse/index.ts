// HSE Module — training, checklist, and document management
// Re-exports for external consumers

// Training actions
export * from './features/training/actions.server';

// Training components
export { default as TrainingSection } from './features/training/components/training-section';
export { TrainingCreateDialog } from './features/training/components/training-create-dialog';
export { default as TrainingDetail } from './features/training/components/trainin-detail-wrapper';
export { TrainingEditDialog } from './features/training/components/training-edit-dialog';
export { TrainingEvaluation } from './features/training/components/training-evaluation';
export { MaterialViewer } from './features/training/components/material-viewer';
export { TrainingList } from './features/training/components/TrainingList';
export { TrainingGrid } from './features/training/components/TrainingGrid';
export { default as OverviewTab } from './features/training/components/OverviewTab';
export { default as EmployeesTab } from './features/training/components/EmployeesTab';
export { default as MaterialsTab } from './features/training/components/MaterialsTab';
export { default as TagTab } from './features/training/components/tags/TagTab';
export { default as TagTable } from './features/training/components/tags/tagTable';
export { default as TagForm } from './features/training/components/tags/tagForm';

// Checklist components
export { default as ChecklistSergio } from './features/checklist/components/ChecklistSergio';
export { default as VehicleInspectionChecklist } from './features/checklist/components/VehicleInspectionChecklist';
export { default as DynamicChecklistForm } from './features/checklist/components/DynamicChecklistForm';
export { default as ListOfChecklist } from './features/checklist/components/ListOfChecklist';
export { default as VehicleInspectionForm } from './features/checklist/components/VehicleInspectionForm';
export { default as DynamicFormWrapper } from './features/checklist/components/DynamicFormWrapper';

// Document actions
export * from './features/documents/actions.server';

// Document components
export { DocumentsSection } from './features/documents/components/Document-section';
export { DocumentDetailDialog } from './features/documents/components/Document-detail-dialog';
export { DocumentUploadDialog } from './features/documents/components/Document-upload-dialog';
export { DocumentNewVersionDialog } from './features/documents/components/Document-new-version-dialog';
export { default as DocTypeTab } from './features/documents/components/doc_types/DocTypeTab';
export { default as DocTypeForm } from './features/documents/components/doc_types/DocTypeForm';
export { default as DocTypeTable } from './features/documents/components/doc_types/DocTypeTable';
