import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { supabase } from '../../../../supabase/supabase';
import { CreateDialog } from './createDialog';

export default async function DiagramTable() {
  let { data: diagrams, error } = await supabase.from('work-diagram').select('*');

  return (
    <Card x-chunk="dashboard-06-chunk-0">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Diagramas de Trabajo</CardTitle>
          <CreateDialog />
        </div>
        <CardDescription>
          Crea, edita o elimina los distintos tipos de diagrama de trabajo que tendrán disponibles los usuarios
        </CardDescription>
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
            {diagrams?.map((diagramType, index) => (
              <TableRow key={crypto.randomUUID()}>
                <TableCell className="hidden sm:table-cell">{index + 1}</TableCell>
                <TableCell className="font-medium">{diagramType.name}</TableCell>
                <TableCell>
                  {diagramType.isActive ? (
                    <Badge variant="outline">Activo</Badge>
                  ) : (
                    <Badge variant="default">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{format(diagramType.created_at, 'yyyy')}</TableCell>
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
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Mostrando <strong>1-{diagrams!.length < 10 ? diagrams?.length : '10'}</strong> of{' '}
          <strong>{diagrams?.length}</strong> diagramas
        </div>
      </CardFooter>
    </Card>
  );
}
