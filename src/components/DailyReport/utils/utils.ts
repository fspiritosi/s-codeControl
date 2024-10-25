import { Customers, Employee, Equipment, Items, Services } from '../DailyReport';

export const getCustomerName = (customerId: string, customers: Customers[]): string => {
  const customer = customers?.find((c) => c.id === customerId);
  return customer ? customer.name : 'Unknown';
};

export const getServiceName = (serviceId: string, services: Services[]) => {
  const service = services?.find((s) => s.id === serviceId);
  return service ? service.service_name : 'Unknown';
};

export const getItemName = (itemId: string, items: Items[]) => {
  const item = items?.find((i) => i.id === itemId);
  return item ? item.item_name : 'Unknown';
};
export const getEmployeeNames = (employeeIds: string[], employees: Employee[]) => {
  return employeeIds
    ?.map((id) => {
      const employee = employees?.find((emp) => emp.id === id);
      //console.log(employee)
      return employee ? `${employee.firstname} ${employee.lastname}` : 'Unknown';
    })
    .join(', ');
};

export const getEquipmentNames = (equipmentIds: string[], equipment: Equipment[]) => {
  return equipmentIds
    ?.map((id) => {
      const eq = equipment?.find((e) => e.id === id);
      return eq ? eq.intern_number?.toString() : 'Unknown';
    })
    .join(', ');
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
};
