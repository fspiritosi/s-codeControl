import React, { useState, useEffect } from "react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import { FilePenLine } from 'lucide-react';
import { Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MultiSelect from './MultiSelect';

interface Customers {
  id: string;
  name: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  firstname: string;
  lastname: string;
  allocated_to: string[];
  is_active: boolean;
}

interface Equipment {
  id: string;
  name: string;
  description: string;
  serial_number: string;
  model: string;
  brand: string;
  status: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  domain: string;
  intern_number: number;
  allocated_to: string[];
  is_active: boolean;
}

interface Services {
  id: string;
  customer_id: string;
  service_name: string;
  service_start: Date;
  service_validity: Date;
  company_id: string;
  is_active: boolean;
}

interface Items {
  id: string;
  service_id: string;
  item_name: string;
  item_description: string;
  item_price: number;
  company_id: string;
  is_active: boolean;
  customer_service_id: { id: string; customer_id: { id: string; name: string } };
}

interface DailyReportItem {
  date: string;
  customer: string;
  employee: string[];
  equipment: string[];
  service: string;
  item: string;
  start_time: string;
  end_time: string;
}

interface TableRowWithFormProps {
  index: number;
  row: DailyReportItem[];
  handleInputChange: (index: number, field: keyof DailyReportItem, value: string | string[]) => void;
  customers: Customers[];
  employees: Employee[];
  equipment: Equipment[];
  services: Services[];
  items: Items[];
  checkedRows: boolean[];
  setCheckedRows: React.Dispatch<React.SetStateAction<boolean[]>>;
  removeRow: (index: number) => void;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customers | null>>;
  setSelectedService: React.Dispatch<React.SetStateAction<Services | null>>;
}

const TableRowWithForm: React.FC<TableRowWithFormProps> = ({
  index,
  row,
  handleInputChange,
  customers,
  employees,
  equipment,
  services,
  items,
  checkedRows,
  setCheckedRows,
  removeRow,
  setSelectedCustomer,
  setSelectedService,
}) => {
  const [customerEmployees, setCustomerEmployees] = useState<Employee[]>([]);
  const [customerEquipment, setCustomerEquipment] = useState<Equipment[]>([]);
  const [customerServices, setCustomerServices] = useState<Services[]>([]);
  const [customerItems, setCustomerItems] = useState<Items[]>([]);
  console.log(row)
  const transformarArray = (arrayOriginal:any) => {
    return arrayOriginal.map((item:any) => ({
      date: item.date || '',
      customer: item.customer || '',
      employee: item.employee || [''],
      equipment: item.equipment || [''],
      service: item.service || '',
      item: item.item || '',
      start_time: item.start_time || '',
      end_time: item.end_time || ''
    }));
  };
  // Seleccionar el objeto específico dentro del array row
  const currentRow = transformarArray(row as any) [index];
  console.log(currentRow)
  
  console.log(employees);
  console.log(customers);
  console.log(currentRow);
  console.log(currentRow.customer);
  console.log(currentRow.employee);

  useEffect(() => {
    if (currentRow.customer) {
      console.log(currentRow);
      handleSelectCustomer(currentRow.customer);
    }
  }, [currentRow.customer]);

  const handleSelectCustomer = (customerId: string) => {
    console.log(customerId);
    const customer = customers.find((c: Customers) => c.id.toString() === customerId);
    
    console.log(customer);
    if (customer) {
      setSelectedCustomer(customer);

      const filteredEmployees = employees.filter((employee: Employee) =>
        employee.allocated_to.includes(customer.id)
      );
      setCustomerEmployees(filteredEmployees);

      const filteredEquipment = equipment?.filter((equipment: Equipment) =>
        equipment.allocated_to?.includes(customer.id)
      );
      setCustomerEquipment(filteredEquipment);

      const filteredServices = services.filter((service: Services) =>
        service.customer_id === customer.id
      );
      setCustomerServices(filteredServices);

      // Resetear selects dependientes
      handleInputChange(index, "service", "");
      handleInputChange(index, "item", "");
      handleInputChange(index, "employee", []);
      handleInputChange(index, "equipment", []);
    }
  };

  const handleSelectService = (serviceId: string) => {
    const service = services.find((s: Services) => s.id === serviceId);
    if (service) {
      setSelectedService(service);

      const filteredItems = items.filter((item: Items) =>
        item.customer_service_id.id === service.id
      );
      setCustomerItems(filteredItems);

      // Resetear selects dependientes
      handleInputChange(index, "item", "");
    }
  };

  const handleSelectChange = (field: keyof DailyReportItem, value: string | string[]) => {
    handleInputChange(index, field, value);
  };
  console.log(customerEmployees);
  // Filtrar servicios según el cliente seleccionado
  const filteredServices = customerServices.length > 0 ? customerServices : services.filter(service => service.customer_id === customers.find(customer => customer.name === currentRow.customer)?.id);

  // Filtrar items según el servicio seleccionado
  const filteredItems = customerItems.length > 0 ? customerItems : items.filter(item => item.service_id === services.find(service => service.service_name === currentRow.service)?.id);

  const employeeNames = customerEmployees.map(employee => ({
    id: employee.id,
    name: `${employee.firstname} ${employee.lastname}`
  }));
  console.log(employeeNames);
  return (
    <TableRow key={index} className="w-full">
      {/* Cliente */}
      <TableCell className="w-32">
        <Select
          onValueChange={(value) => {
            handleSelectChange("customer", value);
            handleSelectCustomer(value);
          }}
          value={currentRow.customer}
          disabled={checkedRows[index]} // Deshabilita si está en "checked"
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Servicio */}
      <TableCell className="w-32">
        <Select
          onValueChange={(value) => {
            handleSelectChange("service", value);
            handleSelectService(value);
          }}
          value={currentRow.service}
          disabled={checkedRows[index]} // Deshabilita si está en "checked"
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar servicio" />
          </SelectTrigger>
          <SelectContent>
            {filteredServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.service_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Item */}
      <TableCell className="w-32">
        <Select
          onValueChange={(value) => handleSelectChange("item", value)}
          value={currentRow.item}
          disabled={checkedRows[index]} // Deshabilita si está en "checked"
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar item" />
          </SelectTrigger>
          <SelectContent>
            {filteredItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.item_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Empleado */}
      <TableCell className="w-32">
        <MultiSelect
          multiEmp={employeeNames}
          placeholder="empleados Seleccionados"
          disabled={checkedRows[index]} // Deshabilita si está en "checked"
          onChange={(selectedItems: string[]) => handleInputChange(index, "employee", selectedItems)}
          selectedItems={currentRow.employee}
        />
      </TableCell>

      {/* Equipo */}
      <TableCell className="w-32">
        <MultiSelect
          multiEmp={customerEquipment.map(equipment => ({ id: equipment.id, name: equipment.name }))}
          placeholder="equipos Seleccionados"
          disabled={checkedRows[index]} // Deshabilita si está en "checked"
          onChange={(selectedItems: string[]) => handleInputChange(index, "equipment", selectedItems)}
          selectedItems={currentRow.equipment}
        />
      </TableCell>

      {/* Horas de inicio y fin */}
      <TableCell className="w-24">
        <Input
          type="time"
          value={currentRow.start_time}
          onChange={(e) => handleSelectChange("start_time", e.target.value)}
          disabled={checkedRows[index]} // Deshabilita si está en "checked"
        />
      </TableCell>
      <TableCell className="w-24">
        <Input
          type="time"
          value={currentRow.end_time}
          onChange={(e) => handleSelectChange("end_time", e.target.value)}
          disabled={checkedRows[index]} // Deshabilita si está en "checked"
        />
      </TableCell>

      {/* Botones */}
      <TableCell className="w-24 flex">
        {checkedRows[index] ? (
          <div className="flex items-center gap-x-2">
            <Button variant={"outline"} onClick={() => setCheckedRows(checkedRows.map((checked, i) => (i === index ? false : checked)))}>
              <FilePenLine size={20} />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant={"outline"} className="ml-1">
                  <Trash2 size={20} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la fila y no se podrán recuperar los cambios.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => removeRow(index)}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
          </div>
        ) : (
          <Button variant={"outline"} className="mr-1" onClick={() => setCheckedRows(checkedRows.map((checked, i) => (i === index ? true : checked)))}>
            <Check size={20} />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default TableRowWithForm;