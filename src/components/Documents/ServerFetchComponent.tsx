// ServerComponent.tsx
import { getAllEmployees } from '@/app/server/employeesActions/actions';
import NewDocumentNoMulti from './NewDocumentNoMulti';

export default async function ServerComponent() {
  const employees = (await getAllEmployees('id, firstname, lastname')).map((employee) => ({
    label: employee.id,
    value: employee.firstname + ' ' + employee.lastname,
  }));

  return <NewDocumentNoMulti employees={employees} />;
}