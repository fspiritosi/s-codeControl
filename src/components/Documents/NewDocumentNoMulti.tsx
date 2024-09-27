import { getAllEmployees } from '@/app/server/employeesActions/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UploadDocumentEquipment from './UploadDocumentEquipment';
async function NewDocumentNoMulti() {
  const employees = await getAllEmployees('id, firstname, lastname')
  console.log('employees', employees);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Documento No-Multirecurso</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full">
        <Tabs defaultValue="employees" className="">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="equipment">Equipos</TabsTrigger>
          </TabsList>
          <TabsContent value="employees">{/* <UploadDocumentEmployee employees={employees} /> */}</TabsContent>
          <TabsContent value="equipment">
            <UploadDocumentEquipment />
          </TabsContent>
        </Tabs>
        <AlertDialogFooter>
          <AlertDialogCancel className="hidden" id="close-create-document-modal" />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default NewDocumentNoMulti;
