'use client';
import UploadDocument from './UploadDocument';

function UploadDocumentEmployee({
  employees,
  allDocumentTypes,
  currentCompany,
  default_id,
  user_id,
}: {
  employees: { label: string; value: string; cuit: string }[];
  allDocumentTypes: DocumentTypes[];
  currentCompany: Company[];
  default_id?: string;
  user_id?: string;
}) {
  return (
    <UploadDocument
      entityType="employee"
      resources={employees}
      allDocumentTypes={allDocumentTypes}
      currentCompany={currentCompany}
      default_id={default_id}
      user_id={user_id}
    />
  );
}

export default UploadDocumentEmployee;
