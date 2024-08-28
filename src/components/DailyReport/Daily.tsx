"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from 'lucide-react'; //guardar
import { FilePenLine } from 'lucide-react'//editar
import { Trash2 } from 'lucide-react';//eliminar

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
  employee: string;
  equipment: string;
  service: string;
  item: string;
  start_time: string;
  end_time: string;
}

interface DynamicTableWithFormProps {
  selectedDate: Date | null;
}

export default function DynamicTableWithForm(selectedDate: DynamicTableWithFormProps) {
  const [rows, setRows] = useState<DailyReportItem[]>([
    {
      date: "",
      customer: "",
      employee: "",
      equipment: "",
      service: "",
      item: "",
      start_time: "",
      end_time: "",
    },
  ]);
  const [checkedRows, setCheckedRows] = useState<boolean[]>([false]);

  const [customers, setCustomers] = useState<Customers[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [services, setServices] = useState<Services[]>([]);
  const [items, setItems] = useState<Items[]>([]);

  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false);

  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const company_id = "your_company_id_here"; // Replace with actual company ID or get it from cookies

  async function fetchCustomers() {
    const { customers, error } = await fetch(`${URL}/api/company/customers/?actual=${company_id}`).then((e) => e.json());
    console.log(error);
    setCustomers(customers);
}

  async function fetchEmployees() {
    const { employees } = await fetch(`${URL}/api/employees/?actual=${company_id}`).then((e) => e.json());
    setEmployees(employees);
    return employees;
  }


  async function fetchEquipment() {
    const { data: equipment } = await fetch(`${URL}/api/equipment/?actual=${company_id}`).then((e) => e.json());
    setEquipment(equipment);
    return equipment;
  }

  async function fetchServices() {
    const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
    setServices(services);
    return services;
  }

  async function fetchItems() {
    const { items } = await fetch(`${URL}/api/services/items/report?actual=${company_id}`).then((e) => e.json());
    setItems(items);
    return items;
  }

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchEquipment();
    fetchServices();
    fetchItems();
  }, [company_id]);

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      console.log(diffInHours);
      setIsMultipleEmployeesAllowed(diffInHours > 12);
    }
  }, [startTime, endTime]);

  const handleInputChange = (
    index: number,
    field: keyof DailyReportItem,
    value: string
  ) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleCheck = (index: number) => {
    const newCheckedRows = [...checkedRows];
    newCheckedRows[index] = true;
    setCheckedRows(newCheckedRows);
  };

  const handleEdit = (index: number) => {
    const newCheckedRows = [...checkedRows];
    newCheckedRows[index] = false;
    setCheckedRows(newCheckedRows);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        date: "",
        customer: "",
        employee: "",
        equipment: "",
        service: "",
        item: "",
        start_time: "",
        end_time: "",
      },
    ]);
    setCheckedRows([...checkedRows, false]);
  };

  const removeRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    const newCheckedRows = checkedRows.filter((_, i) => i !== index);
    setRows(newRows);
    setCheckedRows(newCheckedRows);
  };
 const formatter=selectedDate.selectedDate?.toLocaleDateString();
  return (
    <div>
      <h1 className='align-middle text-center'>Parte diario del día: {formatter}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            {/* <TableHead>Fecha</TableHead> */}
            <TableHead>Cliente</TableHead>
            <TableHead>Servicio</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Empleado</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead>Hora Inicio</TableHead>
            <TableHead>Hora Fin</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {/* <TableCell>
                <Input
                  type="date"
                  value={row.date}
                  onChange={(e) => handleInputChange(index, "date", e.target.value)}
                  disabled={checkedRows[index]}
                />
              </TableCell> */}
              <TableCell>
                <Select
                  value={row.customer}
                  onValueChange={(value) => handleInputChange(index, "customer", value)}
                  disabled={checkedRows[index]}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={row.service}
                  onValueChange={(value) => handleInputChange(index, "service", value)}
                  disabled={checkedRows[index]}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.service_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={row.item}
                  onValueChange={(value) => handleInputChange(index, "item", value)}
                  disabled={checkedRows[index]}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={row.employee}
                  onValueChange={(value) => handleInputChange(index, "employee", value)}
                  disabled={checkedRows[index]}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {`${employee.firstname} ${employee.lastname}`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={row.equipment}
                  onValueChange={(value) => handleInputChange(index, "equipment", value)}
                  disabled={checkedRows[index]}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {equipment.map((equip) => (
                        <SelectItem key={equip.id} value={equip.id}>
                          {equip.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="time"
                  value={row.start_time}
                  onChange={(e) => handleInputChange(index, "start_time", e.target.value)}
                  disabled={checkedRows[index]}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="time"
                  value={row.end_time}
                  onChange={(e) => handleInputChange(index, "end_time", e.target.value)}
                  disabled={checkedRows[index]}
                />
              </TableCell>
              <TableCell>
                {checkedRows[index] ? (
                  <button onClick={() => handleEdit(index)}><FilePenLine/></button>
                ) : (
                  <>
                    <button onClick={() => handleCheck(index)} className="mr-4"><Check/></button>
                    <button onClick={() => removeRow(index)} className="ml-4"><Trash2/></button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!checkedRows.every(Boolean) && (
        <button onClick={addRow} className="mt-4">Agregar Nueva Fila</button>
      )}
    </div>
  );
}
