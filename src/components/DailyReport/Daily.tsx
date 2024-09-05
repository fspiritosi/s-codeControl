// // "use client";
// // import React, { useState, useEffect } from "react";
// // import TableRowWithForm from "./TableRowWithForm";
// // import {
// //   Table,
// //   TableBody,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import cookies from "js-cookie";
// // import { Button } from "@/components/ui/button";
// // import { MdAddCircleOutline } from "react-icons/md";

// // interface Customers {
// //   id: string;
// //   name: string;
// //   is_active: boolean;
// // }

// // interface Employee {
// //   id: string;
// //   firstname: string;
// //   lastname: string;
// //   allocated_to: string[];
// //   is_active: boolean;
// // }

// // interface Equipment {
// //   id: string;
// //   name: string;
// //   description: string;
// //   serial_number: string;
// //   model: string;
// //   brand: string;
// //   status: string;
// //   company_id: string;
// //   created_at: string;
// //   updated_at: string;
// //   domain: string;
// //   intern_number: number;
// //   allocated_to: string[];
// //   is_active: boolean;
// // }

// // interface Services {
// //   id: string;
// //   customer_id: string;
// //   service_name: string;
// //   service_start: Date;
// //   service_validity: Date;
// //   company_id: string;
// //   is_active: boolean;
// // }

// // interface Items {
// //   id: string;
// //   service_id: string;
// //   item_name: string;
// //   item_description: string;
// //   item_price: number;
// //   company_id: string;
// //   is_active: boolean;
// //   customer_service_id: { id: string; customer_id: { id: string; name: string } };
// // }

// // interface DailyReportItem {
// //   date: string;
// //   customer: string;
// //   employee: string[];
// //   equipment: string;
// //   service: string;
// //   item: string;
// //   start_time: string;
// //   end_time: string;
// // }

// // interface DynamicTableWithFormProps {
// //   selectedDate: Date | null;
// // }

// // const DynamicTableWithForm: React.FC<DynamicTableWithFormProps> = ({ selectedDate }) => {
// //   const [rows, setRows] = useState<DailyReportItem[]>([
// //     {
// //       date: "",
// //       customer: "",
// //       employee: [""],
// //       equipment: "",
// //       service: "",
// //       item: "",
// //       start_time: "",
// //       end_time: "",
// //     },
// //   ]);
// //   const [checkedRows, setCheckedRows] = useState<boolean[]>([false]);

// //   const [customers, setCustomers] = useState<Customers[]>([]);
// //   const [employees, setEmployees] = useState<Employee[]>([]);
// //   const [equipment, setEquipment] = useState<Equipment[]>([]);
// //   const [services, setServices] = useState<Services[]>([]);
// //   const [items, setItems] = useState<Items[]>([]);

// //   const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false);
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customers | null>(null);
// //   const [selectedService, setSelectedService] = useState<Services | null>(null);
// //   const formatter = selectedDate?.toLocaleDateString();
// //   const URL = process.env.NEXT_PUBLIC_BASE_URL;
// //   const company_id = cookies.get("actualComp");
// //   console.log(company_id);
// //   async function fetchCustomers() {
// //     const { customers, error } = await fetch(
// //       `${URL}/api/company/customers/?actual=${company_id}`
// //     ).then((e) => e.json());
// //     setCustomers(customers);
// //   }

// //   async function fetchEmployees() {
// //     const { employees } = await fetch(
// //       `${URL}/api/employees/?actual=${company_id}`
// //     ).then((e) => e.json());
// //     setEmployees(employees);
// //     return employees;
// //   }

// //   async function fetchEquipment() {
// //     try {
// //       const response = await fetch(`${URL}/api/equipment/?actual=${company_id}`);
      
// //       // Verificar si la respuesta es correcta
// //       if (!response.ok) {
// //         throw new Error(`Error en la solicitud: ${response.statusText}`);
// //       }
  
// //       const data = await response.json();
// //       const equipment = data.equipments; // Asegúrate de que coincida con la respuesta del servidor
      
// //       setEquipment(equipment); // Asumiendo que setEquipment es la función para guardar el estado
// //       return equipment;
// //     } catch (error) {
// //       console.error('Error fetching equipment:', error);
// //       // Manejo de errores adicional, si es necesario
// //     }
// //   }
  

// //   async function fetchServices() {
// //     const { services } = await fetch(
// //       `${URL}/api/services?actual=${company_id}`
// //     ).then((e) => e.json());
// //     setServices(services);
// //     return services;
// //   }

// //   async function fetchItems() {
// //     const { items } = await fetch(
// //       `${URL}/api/services/items/report?actual=${company_id}`
// //     ).then((e) => e.json());
// //     setItems(items);
// //     return items;
// //   }

// //   useEffect(() => {
// //     fetchCustomers();
// //     fetchEmployees();
// //     fetchEquipment();
// //     fetchServices();
// //     fetchItems();
// //   }, [company_id]);
// //   console.log(equipment)

// //   const addRow = () => {
// //     setRows([
// //       ...rows,
// //       {
// //         date: "",
// //         customer: "",
// //         employee: [""],
// //         equipment: "",
// //         service: "",
// //         item: "",
// //         start_time: "",
// //         end_time: "",
// //       },
// //     ]);
// //     setCheckedRows([...checkedRows, false]);
// //   };
// //   const removeRow = (index: number) => {
// //     const newRows = rows.filter((_, i) => i !== index);
// //     const newCheckedRows = checkedRows.filter((_, i) => i !== index);
// //     setRows(newRows);
// //     setCheckedRows(newCheckedRows);
// //   };
  
// //   console.log(rows)
// //   return (
// //     <div>
// //       <h1 className="align-middle text-center">
// //         Parte diario del día: {formatter}
// //       </h1>
// //       <Table>
// //         <TableHeader>
// //           <TableRow>
// //             <TableHead className="w-32">Cliente</TableHead>
// //             <TableHead className="w-32">Servicio</TableHead>
// //             <TableHead className="w-32">Item</TableHead>
// //             <TableHead className="w-32">Empleado</TableHead>
// //             <TableHead className="w-32">Equipo</TableHead>
// //             <TableHead className="w-32">Hora Inicio</TableHead>
// //             <TableHead className="w-32">Hora Fin</TableHead>
// //             <TableHead className="w-32">Acciones</TableHead>
// //           </TableRow>
// //         </TableHeader>
// //         <TableBody>
// //           {rows.map((row, index) => (
// //             <TableRowWithForm
// //               key={index}
// //               index={index}
// //               row={row as any}
// //               handleInputChange={(index, field, value) => {
// //                 setRows(prevRows => {
// //                   const newRows = [...prevRows];
// //                   newRows[index] = {
// //                     ...newRows[index],
// //                     [field]: value,
// //                     date: formatter as string,
// //                   };
// //                   return newRows;
// //                 });
// //               }}
// //               customers={customers}
// //               employees={employees}
// //               equipment={equipment}
// //               services={services}
// //               items={items}
// //               checkedRows={checkedRows}
// //               setCheckedRows={setCheckedRows}
// //               removeRow={removeRow}
// //               setSelectedCustomer={setSelectedCustomer}
// //               setSelectedService={setSelectedService}
// //             />
// //           ))}
// //         </TableBody>
// //       </Table>
// //       {checkedRows.length > 0 && (
// //         <div className="flex justify-center mt-4">
// //           <Button
// //             onClick={addRow}
// //             className="mt-4"
// //             variant="outline"
// //             disabled={!checkedRows[checkedRows.length - 1]}
// //           >
// //             <MdAddCircleOutline size={30} />
// //           </Button>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default DynamicTableWithForm;
// "use client";
// import React, { useState, useEffect } from "react";
// import TableRowWithForm from "./TableRowWithForm";
// import {
//   Table,
//   TableBody,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import cookies from "js-cookie";
// import { Button } from "@/components/ui/button";
// import { MdAddCircleOutline, MdSave } from "react-icons/md";

// interface Customers {
//   id: string;
//   name: string;
//   is_active: boolean;
// }

// interface Employee {
//   id: string;
//   firstname: string;
//   lastname: string;
//   allocated_to: string[];
//   is_active: boolean;
// }

// interface Equipment {
//   id: string;
//   name: string;
//   description: string;
//   serial_number: string;
//   model: string;
//   brand: string;
//   status: string;
//   company_id: string;
//   created_at: string;
//   updated_at: string;
//   domain: string;
//   intern_number: number;
//   allocated_to: string[];
//   is_active: boolean;
// }

// interface Services {
//   id: string;
//   customer_id: string;
//   service_name: string;
//   service_start: Date;
//   service_validity: Date;
//   company_id: string;
//   is_active: boolean;
// }

// interface Items {
//   id: string;
//   service_id: string;
//   item_name: string;
//   item_description: string;
//   item_price: number;
//   company_id: string;
//   is_active: boolean;
//   customer_service_id: { id: string; customer_id: { id: string; name: string } };
// }

// interface DailyReportItem {
//   date: string;
//   customer: string;
//   employee: string[];
//   equipment: string[];
//   service: string;
//   item: string;
//   start_time: string;
//   end_time: string;
// }

// interface DynamicTableWithFormProps {
//   selectedDate: Date | null;
// }

// const DynamicTableWithForm: React.FC<DynamicTableWithFormProps> = ({ selectedDate }) => {
//   const [rows, setRows] = useState<DailyReportItem[]>([
//     {
//       date: "",
//       customer: "",
//       employee: [""],
//       equipment: [""],
//       service: "",
//       item: "",
//       start_time: "",
//       end_time: "",
//     },
//   ]);
//   const [checkedRows, setCheckedRows] = useState<boolean[]>([false]);

//   const [customers, setCustomers] = useState<Customers[]>([]);
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [equipment, setEquipment] = useState<Equipment[]>([]);
//   const [services, setServices] = useState<Services[]>([]);
//   const [items, setItems] = useState<Items[]>([]);

//   const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<Customers | null>(null);
//   const [selectedService, setSelectedService] = useState<Services | null>(null);
//   const formatter = selectedDate?.toLocaleDateString();
//   const URL = process.env.NEXT_PUBLIC_BASE_URL;
//   const company_id = cookies.get("actualComp");
//   console.log("Company ID:", company_id);

//   async function fetchCustomers() {
//     const { customers, error } = await fetch(
//       `${URL}/api/company/customers/?actual=${company_id}`
//     ).then((e) => e.json());
//     setCustomers(customers);
//   }

//   async function fetchEmployees() {
//     const { employees } = await fetch(
//       `${URL}/api/employees/?actual=${company_id}`
//     ).then((e) => e.json());
//     setEmployees(employees);
//     return employees;
//   }

//   async function fetchEquipment() {
//     try {
//       const response = await fetch(`${URL}/api/equipment/?actual=${company_id}`);
      
//       // Verificar si la respuesta es correcta
//       if (!response.ok) {
//         throw new Error(`Error en la solicitud: ${response.statusText}`);
//       }
  
//       const data = await response.json();
//       const equipment = data.equipments; // Asegúrate de que coincida con la respuesta del servidor
      
//       setEquipment(equipment); // Asumiendo que setEquipment es la función para guardar el estado
//       return equipment;
//     } catch (error) {
//       console.error('Error fetching equipment:', error);
//       // Manejo de errores adicional, si es necesario
//     }
//   }
  

//   async function fetchServices() {
//     const { services } = await fetch(
//       `${URL}/api/services?actual=${company_id}`
//     ).then((e) => e.json());
//     setServices(services);
//     return services;
//   }

//   async function fetchItems() {
//     const { items } = await fetch(
//       `${URL}/api/services/items/report?actual=${company_id}`
//     ).then((e) => e.json());
//     setItems(items);
//     return items;
//   }

//   useEffect(() => {
//     fetchCustomers();
//     fetchEmployees();
//     fetchEquipment();
//     fetchServices();
//     fetchItems();
//   }, [company_id]);
//   console.log(equipment)

//   const addRow = () => {
//     setRows([
//       ...rows,
//       {
//         date: "",
//         customer: "",
//         employee: [""],
//         equipment: [""],
//         service: "",
//         item: "",
//         start_time: "",
//         end_time: "",
//       },
//     ]);
//     setCheckedRows([...checkedRows, false]);
//   };

//   const removeRow = (index: number) => {
//     const newRows = rows.filter((_, i) => i !== index);
//     const newCheckedRows = checkedRows.filter((_, i) => i !== index);
//     setRows(newRows);
//     setCheckedRows(newCheckedRows);
//   };

//   const handleInputChange = (index: number, field: string, value: string) => {
//     setRows(prevRows => {
//       const newRows = [...prevRows];
//       newRows[index] = {
//         ...newRows[index],
//         [field]: value,
//         date: formatter as string,
//       };
//       return newRows;
//     });
//   };

//   const saveDailyReport = async () => {
//     try {
//       const dailyReportResponse = await fetch(`${URL}/api/daily-report`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ date: selectedDate, company_id }),
//       });
  
//       if (!dailyReportResponse.ok) {
//         const errorText = await dailyReportResponse.text();
//         throw new Error(`Error al guardar el reporte diario: ${errorText}`);
//       }
  
//       const dailyReport = await dailyReportResponse.json();
//       const dailyReportId = dailyReport.data[0]?.id;
//       console.log("dailyReportId", dailyReportId);
//       for (const row of rows) {
//         const { customer, service, item, start_time, end_time, employee, equipment } = row;
  
//         if (!customer || !service || !item || !start_time || !end_time) {
//           console.error("Campos obligatorios faltantes en la fila:", row);
//           continue;
//         }
  
//         const dailyReportRowResponse = await fetch(`${URL}/api/daily-report/daily-report-row`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             daily_report_id: dailyReportId,
//             customer_id: customer,
//             service_id: service,
//             item_id: item,
//             start_time,
//             end_time,
//           }),
//         });
  
//         if (!dailyReportRowResponse.ok) {
//           const errorText = await dailyReportRowResponse.text();
//           throw new Error(`Error al guardar la fila del reporte diario: ${errorText}`);
//         }
  
//         const dailyReportRow = await dailyReportRowResponse.json();
//         const dailyReportRowId = dailyReportRow.data[0]?.id;
//         console.log("dailyReportRowId", dailyReportRowId);
//         for (const employee_id of employee) {
//           const employeeRelationResponse = await fetch(`${URL}/api/daily-report/dailyreportemployeerelations`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               daily_report_row_id: dailyReportRowId,
//               employee_id,
//             }),
//           });
  
//           if (!employeeRelationResponse.ok) {
//             const errorText = await employeeRelationResponse.text();
//             throw new Error(`Error al guardar la relación con el empleado: ${errorText}`);
//           }
//         }
  
//         for (const equipment_id of equipment) {
//           const equipmentRelationResponse = await fetch(`${URL}/api/daily-report/dailyreportequipmentrelations`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               daily_report_row_id: dailyReportRowId,
//               equipment_id,
//             }),
//           });
  
//           if (!equipmentRelationResponse.ok) {
//             const errorText = await equipmentRelationResponse.text();
//             throw new Error(`Error al guardar la relación con el equipo: ${errorText}`);
//           }
//         }
//       }
  
//       console.log("Datos guardados exitosamente");
//     } catch (error) {
//       console.error("Error al guardar los datos:", error);
//     }
//   };

//   return (
//     <div>
//       <h1 className="align-middle text-center">
//         Parte diario del día: {formatter}
//       </h1>
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead className="w-32">Cliente</TableHead>
//             <TableHead className="w-32">Servicio</TableHead>
//             <TableHead className="w-32">Item</TableHead>
//             <TableHead className="w-32">Empleado</TableHead>
//             <TableHead className="w-32">Equipo</TableHead>
//             <TableHead className="w-32">Hora Inicio</TableHead>
//             <TableHead className="w-32">Hora Fin</TableHead>
//             <TableHead className="w-32">Acciones</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {rows.map((row, index) => (
//             <TableRowWithForm
//               key={index}
//               index={index}
//               row={row as any}
//               handleInputChange={handleInputChange}
//               customers={customers}
//               employees={employees}
//               equipment={equipment}
//               services={services}
//               items={items}
//               checkedRows={checkedRows}
//               setCheckedRows={setCheckedRows}
//               removeRow={removeRow}
//               setSelectedCustomer={setSelectedCustomer}
//               setSelectedService={setSelectedService}
//             />
//           ))}
//         </TableBody>
//       </Table>
//       {checkedRows.length > 0 && (
//         <div className="flex justify-center mt-4">
//           <Button
//             onClick={addRow}
//             className="mt-4"
//             variant="outline"
//             disabled={!checkedRows[checkedRows.length - 1]}
//           >
//             <MdAddCircleOutline size={30} />
//           </Button>
//           <Button
//             onClick={saveDailyReport}
//             className="mt-4 ml-4"
//             variant="outline"
//           >
//             <MdSave size={30} />
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DynamicTableWithForm;
"use client";
import React, { useState, useEffect } from "react";
import TableRowWithForm from "./TableRowWithForm";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { MdAddCircleOutline, MdSave } from "react-icons/md";

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

interface DynamicTableWithFormProps {
  selectedDate: Date | null;
  reportData?: DailyReportItem[];
}

const DynamicTableWithForm: React.FC<DynamicTableWithFormProps> = ({ selectedDate, reportData }) => {
  const [rows, setRows] = useState<DailyReportItem[]>(reportData || [
    {
      date: "",
      customer: "",
      employee: [""],
      equipment: [""],
      service: "",
      item: "",
      start_time: "",
      end_time: "",
    },
  ]);

  console.log("Report data:", reportData);
  const [checkedRows, setCheckedRows] = useState<boolean[]>(new Array(reportData?.length || 1).fill(false));

  const [customers, setCustomers] = useState<Customers[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [services, setServices] = useState<Services[]>([]);
  const [items, setItems] = useState<Items[]>([]);

  const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customers | null>(null);
  const [selectedService, setSelectedService] = useState<Services | null>(null);
  const formatter = selectedDate?.toLocaleDateString();
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const company_id = cookies.get("actualComp");
  console.log("Company ID:", company_id);

  async function fetchCustomers() {
    const { customers, error } = await fetch(
      `${URL}/api/company/customers/?actual=${company_id}`
    ).then((e) => e.json());
    setCustomers(customers);
  }

  async function fetchEmployees() {
    const { employees } = await fetch(
      `${URL}/api/employees/?actual=${company_id}`
    ).then((e) => e.json());
    setEmployees(employees);
    return employees;
  }

  async function fetchEquipment() {
    try {
      const response = await fetch(`${URL}/api/equipment/?actual=${company_id}`);
      
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.statusText}`);
      }
  
      const data = await response.json();
      const equipment = data.equipments; // Asegúrate de que coincida con la respuesta del servidor
      
      setEquipment(equipment); // Asumiendo que setEquipment es la función para guardar el estado
      return equipment;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      // Manejo de errores adicional, si es necesario
    }
  }
  

  async function fetchServices() {
    const { services } = await fetch(
      `${URL}/api/services?actual=${company_id}`
    ).then((e) => e.json());
    setServices(services);
    return services;
  }

  async function fetchItems() {
    const { items } = await fetch(
      `${URL}/api/services/items/report?actual=${company_id}`
    ).then((e) => e.json());
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
  console.log(equipment)

  const addRow = () => {
    setRows([
      ...rows,
      {
        date: "",
        customer: "",
        employee: [""],
        equipment: [""],
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

  const handleInputChange = (index: number, field: keyof DailyReportItem, value: string | string[]) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index] = {
        ...newRows[index],
        [field]: value,
        date: formatter as string,
      };
      return newRows;
    });
  };

  const saveDailyReport = async () => {
    try {
      const dailyReportResponse = await fetch(`${URL}/api/daily-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: selectedDate, company_id }),
      });
  
      if (!dailyReportResponse.ok) {
        const errorText = await dailyReportResponse.text();
        throw new Error(`Error al guardar el reporte diario: ${errorText}`);
      }
  
      const dailyReport = await dailyReportResponse.json();
      const dailyReportId = dailyReport.data[0]?.id;
      console.log("dailyReportId", dailyReportId);
      for (const row of rows) {
        const { customer, service, item, start_time, end_time, employee, equipment } = row;
  
        if (!customer || !service || !item || !start_time || !end_time) {
          console.error("Campos obligatorios faltantes en la fila:", row);
          continue;
        }
  
        const dailyReportRowResponse = await fetch(`${URL}/api/daily-report/daily-report-row`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            daily_report_id: dailyReportId,
            customer_id: customer,
            service_id: service,
            item_id: item,
            start_time,
            end_time,
          }),
        });
  
        if (!dailyReportRowResponse.ok) {
          const errorText = await dailyReportRowResponse.text();
          throw new Error(`Error al guardar la fila del reporte diario: ${errorText}`);
        }
  
        const dailyReportRow = await dailyReportRowResponse.json();
        const dailyReportRowId = dailyReportRow.data[0]?.id;
        console.log("dailyReportRowId", dailyReportRowId);
        for (const employee_id of employee) {
          const employeeRelationResponse = await fetch(`${URL}/api/daily-report/dailyreportemployeerelations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              daily_report_row_id: dailyReportRowId,
              employee_id,
            }),
          });
  
          if (!employeeRelationResponse.ok) {
            const errorText = await employeeRelationResponse.text();
            throw new Error(`Error al guardar la relación con el empleado: ${errorText}`);
          }
        }
  
        for (const equipment_id of equipment) {
          const equipmentRelationResponse = await fetch(`${URL}/api/daily-report/dailyreportequipmentrelations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              daily_report_row_id: dailyReportRowId,
              equipment_id,
            }),
          });
  
          if (!equipmentRelationResponse.ok) {
            const errorText = await equipmentRelationResponse.text();
            throw new Error(`Error al guardar la relación con el equipo: ${errorText}`);
          }
        }
      }
  
      console.log("Datos guardados exitosamente");
    } catch (error) {
      console.error("Error al guardar los datos:", error);
    }
  };
console.log(rows)
  return (
    <div>
      <h1 className="align-middle text-center">
        Parte diario del día: {formatter}
      </h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Cliente</TableHead>
            <TableHead className="w-32">Servicio</TableHead>
            <TableHead className="w-32">Item</TableHead>
            <TableHead className="w-32">Empleado</TableHead>
            <TableHead className="w-32">Equipo</TableHead>
            <TableHead className="w-32">Hora Inicio</TableHead>
            <TableHead className="w-32">Hora Fin</TableHead>
            <TableHead className="w-32">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRowWithForm
              key={index}
              index={index}
              row={rows as any}
              handleInputChange={handleInputChange}
              customers={customers}
              employees={employees}
              equipment={equipment}
              services={services}
              items={items}
              checkedRows={checkedRows}
              setCheckedRows={setCheckedRows}
              removeRow={removeRow}
              setSelectedCustomer={setSelectedCustomer}
              
              setSelectedService={setSelectedService}
              
            />
          ))}
        </TableBody>
      </Table>
      {checkedRows.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={addRow}
            className="mt-4"
            variant="outline"
            disabled={!checkedRows[checkedRows.length - 1]}
          >
            <MdAddCircleOutline size={30} />
          </Button>
          <Button
            onClick={saveDailyReport}
            className="mt-4 ml-4"
            variant="outline"
          >
            <MdSave size={30} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DynamicTableWithForm;