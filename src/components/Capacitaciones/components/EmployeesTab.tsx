import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sendEmail } from '@/lib/renderEmail';
import { BaseDataTable } from '@/shared/components/data-table/base/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/base/data-table-column-header';
import { createFilterOptions } from '@/shared/components/utils/utils';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { toast } from 'sonner';
import { fetchTrainingById } from '../actions/actions';

type Employee = {
  id: string;
  name: string;
  cuil: string;
  department: string | null;
  status: string;
  email: string;
  lastAttempt?: {
    date: string;
    score: string;
    result: string;
  } | null;
}[];

interface EmployeesTabProps {
  training: Awaited<ReturnType<typeof fetchTrainingById>>;
}

//   <TableHead>Nombre</TableHead>
//   <TableHead>CUIL</TableHead>
//   <TableHead>Posición</TableHead>
//   <TableHead>Fecha</TableHead>
//   <TableHead>Resultado</TableHead>
//   <TableHead>Acciones</TableHead>
export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800">Desaprobado</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};
export function getAreaColums(handleEdit: (email: string) => Promise<void>): ColumnDef<Employee[number]>[] {
  return [
    {
      accessorKey: 'name',
      id: 'Nombre',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'cuil',
      id: 'CUIL',
      header: ({ column }) => <DataTableColumnHeader column={column} title="CUIL" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'department',
      id: 'Posición',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Posición" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'lastAttempt.date',
      id: 'Fecha',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'lastAttempt.result',
      id: 'Resultado',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Resultado" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'lastAttempt.score',
      id: 'Puntaje',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Puntaje" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },

    {
      accessorKey: 'actions',
      id: 'Acciones',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
      cell: ({ row }) => {
        const handleSelectArea = () => {
          handleEdit((row.original as any).area_full);
        };
        return (
          <Button size="sm" variant="link" className="hover:text-blue-400" onClick={handleSelectArea}>
            Editar
          </Button>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
  ];
}
export function getPendingColums(handleEdit: (email: string) => Promise<void>): ColumnDef<Employee[number]>[] {
  return [
    {
      accessorKey: 'name',
      id: 'Nombre',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'cuil',
      id: 'CUIL',
      header: ({ column }) => <DataTableColumnHeader column={column} title="CUIL" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'department',
      id: 'Posición',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Posición" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'status',
      id: 'Estado',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      cell: ({ row }) => getStatusBadge(row.original.status),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'actions',
      id: 'Acciones',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
      cell: ({ row }) => {
        const handleSelectArea = () => {
          handleEdit(row.original.email);
        };
        return (
          <Button variant="outline" onClick={() => handleSelectArea()} size="sm">
            Enviar Recordatorio
          </Button>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
  ];
}

function EmployeesTab({ training }: EmployeesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Combinar empleados completados y pendientes para filtrado
  const allEmployees: {
    id: string;
    name: string;
    cuil: string;
    department: string | null;
    status: string;
    lastAttempt?: {
      date: string;
      score: string;
      result: string;
    } | null;
  }[] = [...(training?.employees.completed || []), ...(training?.employees.pending || [])];

  // Filter employees by status and search term
  const filteredEmployees = allEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.cuil.includes(searchTerm) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const completedEmployees = filteredEmployees.filter((e: { status: string }) => e.status === 'completed');
  const pendingEmployees = filteredEmployees.filter(
    (e: { status: string }) => e.status === 'pending' || e.status === 'failed'
  );

  const handleSendInvitation = async (email: string) => {
    toast.promise(
      sendEmail({
        subject: 'Invitación a capacitación',
        to: email,
        html: `
        <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recordatorio de Capacitación</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #2563eb;
              padding: 20px;
              text-align: center;
              color: white;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #fff;
              padding: 20px;
              border-left: 1px solid #e5e7eb;
              border-right: 1px solid #e5e7eb;
            }
            .footer {
              background-color: #f3f4f6;
              padding: 15px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-radius: 0 0 5px 5px;
              border: 1px solid #e5e7eb;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .training-details {
              background-color: #f9fafb;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
            }
            .importance {
              display: inline-block;
              background-color: #ef4444;
              color: white;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 12px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recordatorio de Capacitación</h1>
            </div>
            <div class="content">
              <p>Estimado/a colaborador/a,</p>
              <p>Le recordamos que tiene una <strong>capacitación pendiente</strong> que requiere su atención.</p>
              
              <div class="training-details">
                <span class="importance">Importante</span>
                <h2>${training?.title}</h2>

                ${training?.description ? `<p><strong>Descripción:</strong> ${training?.description}</p>` : ''}
              </div>
              
              <p>Por favor complete esta capacitación a la brevedad posible. El conocimiento adquirido es fundamental para su seguridad y desempeño laboral.</p>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/hse/detail/${training?.id}" class="button">Ver Capacitación</a>
              </center>
              
              <p>Si tiene alguna duda o inconveniente, no dude en contactar a su supervisor.</p>
              
              <p>Saludos cordiales,<br>El equipo de HSE</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático, por favor no responda a este correo.</p>
              <p> ${new Date().getFullYear()} Code Control - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
      </html>
      `,
      }),
      {
        loading: 'Enviando invitación...',
        success: 'Invitación enviada correctamente',
        error: 'Error al enviar invitación',
      }
    );
  };
  const namesCompleted = createFilterOptions(completedEmployees, (area) => area.name);
  const cuilCompleted = createFilterOptions(completedEmployees, (area) => area.cuil);
  const departmentCompleted = createFilterOptions(completedEmployees, (area) => area.department);

  const namesPending = createFilterOptions(pendingEmployees, (area) => area.name);
  const cuilPending = createFilterOptions(pendingEmployees, (area) => area.cuil);
  const departmentPending = createFilterOptions(pendingEmployees, (area) => area.department);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <CardTitle>Empleados</CardTitle>
            <CardDescription>Seguimiento de empleados que completaron y están pendientes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="completed">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="completed">Completados ({completedEmployees.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({pendingEmployees.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="pt-4">
            <div className="">
              <BaseDataTable
                columns={getAreaColums(handleSendInvitation) as any}
                data={completedEmployees}
                savedVisibility={{}}
                tableId="areaTable"
                toolbarOptions={{
                  initialVisibleFilters: [],
                  filterableColumns: [
                    {
                      columnId: 'Nombre',
                      title: 'Nombre',
                      options: namesCompleted,
                    },
                    {
                      columnId: 'cuil',
                      title: 'CUIL',
                      options: cuilCompleted,
                    },
                    {
                      columnId: 'Posición',
                      title: 'Posición',
                      options: departmentCompleted,
                    },
                  ],
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="pending" className="pt-4">
            <div className="">
              <BaseDataTable
                columns={getPendingColums(handleSendInvitation) as any}
                data={pendingEmployees}
                savedVisibility={{}}
                tableId="areaTable"
                toolbarOptions={{
                  initialVisibleFilters: ['Nombre', 'CUIL', 'Posición', 'Estado'],
                  filterableColumns: [
                    {
                      columnId: 'Nombre',
                      title: 'Nombre',
                      options: namesPending,
                    },
                    {
                      columnId: 'CUIL',
                      title: 'CUIL',
                      options: cuilPending,
                    },
                    {
                      columnId: 'Posición',
                      title: 'Posición',
                      options: departmentPending,
                    },
                  ],
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EmployeesTab;
