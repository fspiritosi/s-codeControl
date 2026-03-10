import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export function CreateDialog({ title, dbName }: any) {
  async function createDiagram(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;

    const tableMap: Record<string, any> = {
      'work-diagram': prisma.work_diagram,
      'industry_type': prisma.industry_type,
      'hierarchy': prisma.hierarchy,
      'types_of_vehicles': prisma.types_of_vehicles,
    };

    const table = tableMap[dbName];
    if (table) {
      await table.create({ data: { name } });
    }
    //TODO falta la notificación y que cierre el dialogo de manera automática
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Añadir nuevo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo {title}</DialogTitle>
          <DialogDescription>Crea un nuevo {title}</DialogDescription>
        </DialogHeader>
        <form action={createDiagram}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Descripción
              </Label>
              <Input id="name" name="name" placeholder="Ingresa un nuevo tipo" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
