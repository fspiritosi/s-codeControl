import ShowDocument from './ShowDocument';

function ShowEquipmentDocument(props: {
  documents_employees: EquipmentDocumentWithCompany[];
  role: string | never[] | null;
  resource: string;
  id: string;
  documentName: string;
  documentUrl: string;
}) {
  return <ShowDocument entityType="equipment" {...props} />;
}

export default ShowEquipmentDocument;
