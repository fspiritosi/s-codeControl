import ShowDocument from './ShowDocument';

function ShowEmployeeDocument(props: {
  documents_employees: EmployeeDocumentDetailed[];
  role: string | never[] | null;
  resource: string;
  id: string;
  documentName: string;
  documentUrl: string;
}) {
  return <ShowDocument entityType="employee" {...props} />;
}

export default ShowEmployeeDocument;
