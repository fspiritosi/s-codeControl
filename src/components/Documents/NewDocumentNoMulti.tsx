import {
  getActualCompany,
  getAllDocumentTypes,
  getAllEmployees,
  getAllEquipment,
  getCurrentUser,
} from '@/app/server/GET/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UploadDocumentEmployee from './UploadDocumentEmployee';
import UploadDocumentEquipment from './UploadDocumentEquipment';
async function NewDocumentNoMulti() {
  const employees = (await getAllEmployees()).map((employee) => ({
    label: `${employee.firstname} ${employee.lastname}`,
    value: employee.id,
    cuit: employee.cuil,
  }));

  const equipments = (await getAllEquipment('id, firstname, lastname')).map((equipment) => ({
    label: equipment.domain
      ? `${equipment.domain} - ${equipment.intern_number}`
      : `${equipment.serie} - ${equipment.intern_number}`,
    value: equipment.id,
  }));

  const allDocumentTypes = await getAllDocumentTypes();
  const currentCompany = await getActualCompany();

  const user = await getCurrentUser();

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
          <TabsContent value="employees">
            <UploadDocumentEmployee
              employees={employees}
              allDocumentTypes={allDocumentTypes?.filter(
                (document) => document.applies === 'Persona' && !document.multiresource
              )}
              currentCompany={currentCompany}
              user_id={user?.id}
            />
          </TabsContent>
          <TabsContent value="equipment">
            <UploadDocumentEquipment
              currentCompany={currentCompany}
              allDocumentTypes={allDocumentTypes?.filter(
                (document) => document.applies === 'Equipos' && !document.multiresource
              )}
              user_id={user?.id}
              equipments={equipments}
            />
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
