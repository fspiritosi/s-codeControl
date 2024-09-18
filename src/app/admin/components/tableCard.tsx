'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';

type Props = {
  title: string;
  data: any[] | null;
  dbName: string;
};

export default function CardTable({ title, data, dbName }: Props) {
  function createAndDownloadFile(data: any) {
    const dataToDownload = data.map((dato: any) => ({
      id: dato.id,
      estado: dato.is_active ? 'Activo' : 'Inactivo',
      nombre: dato.name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToDownload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dates');

    XLSX.writeFile(workbook, 'data.xlsx', { compression: true });
  }
  return (
    <Card className="md:min-w-[600px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Creado</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((dataType, index) => (
              <TableRow key={crypto.randomUUID()}>
                <TableCell className="hidden sm:table-cell">{index + 1}</TableCell>
                <TableCell className="font-medium">{dataType.name}</TableCell>
                <TableCell>
                  {dataType.is_active ? (
                    <Badge variant="outline">Activo</Badge>
                  ) : (
                    <Badge variant="default">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{format(dataType.created_at, 'yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-center border-t p-4"></CardFooter>
      <Button onClick={() => createAndDownloadFile(data)}>Descargar Data</Button>
    </Card>
  );
}
