'use client';
import UploadDocument from './UploadDocument';

function UploadDocumentEquipment({
  equipments,
  allDocumentTypes,
  currentCompany,
  user_id,
  default_id,
}: {
  equipments: { label: string; value: string }[];
  allDocumentTypes: DocumentTypes[];
  currentCompany: Company[];
  user_id: string | undefined;
  default_id?: string;
}) {
  return (
    <UploadDocument
      entityType="equipment"
      resources={equipments}
      allDocumentTypes={allDocumentTypes}
      currentCompany={currentCompany}
      default_id={default_id}
      user_id={user_id}
    />
  );
}

export default UploadDocumentEquipment;
