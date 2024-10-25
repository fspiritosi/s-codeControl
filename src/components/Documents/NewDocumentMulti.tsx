import {
  fetchAllDocumentTypes,
  fetchAllEmployees,
  fetchAllEquipment,
  fetchCurrentCompany,
  fetchCurrentUser,
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
import { cn } from '@/lib/utils';
import InfoComponent from '../InfoComponent';
import UploadDocumentMultiEmployee from './UploadDocumentMultiEmployee';
import UploadDocumentMultiEquipment from './UploadDocumentMultiEquipment';
async function NewDocumentMulti({
  onlyEmployees,
  onlyEquipment,
}: {
  onlyEmployees?: boolean;
  onlyEquipment?: boolean;
}) {
  // const cookiesStore = cookies();
  const employees = (await fetchAllEmployees()).map((employee) => ({
    label: `${employee.firstname} ${employee.lastname}`,
    value: employee.id,
    cuit: employee.cuil,
  }));

  const equipments = (await fetchAllEquipment()).map((equipment) => ({
    label: equipment.domain
      ? `${equipment.domain} - ${equipment.intern_number}`
      : `${equipment.serie} - ${equipment.intern_number}`,
    value: equipment.id,
  }));

  const allDocumentTypes = await fetchAllDocumentTypes();
  const currentCompany = await fetchCurrentCompany();
  const user = await fetchCurrentUser();
  //console.log(onlyEmployees, 'onlyEmployees');
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Documento Multirecurso</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full">
        <InfoComponent
          iconSize="lg"
          size="sm"
          message={
            'Desde aqui solo podras subir documentos faltantes, si deseas reemplazar o eliminar un documento, dirigete al documento en cuestion y realiza la accion deseada.'
          }
        />
        <Tabs defaultValue={onlyEmployees ? 'employees' : onlyEquipment ? 'equipment' : 'employees'}>
          <TabsList
            className={cn('w-full grid grid-cols-2', onlyEmployees && onlyEquipment ? 'grid-cols-2' : 'grid-cols-1')}
          >
            {onlyEmployees && <TabsTrigger value="employees">Empleados</TabsTrigger>}
            {onlyEquipment && <TabsTrigger value="equipment">Equipos</TabsTrigger>}
          </TabsList>
          <TabsContent value="employees">
            <UploadDocumentMultiEmployee
              employees={employees}
              allDocumentTypes={allDocumentTypes?.filter(
                (document) => document.applies === 'Persona' && document.multiresource
              )}
              currentCompany={currentCompany}
              user_id={user?.id}
            />
          </TabsContent>
          <TabsContent value="equipment">
            <UploadDocumentMultiEquipment
              currentCompany={currentCompany}
              allDocumentTypes={allDocumentTypes?.filter(
                (document) => document.applies === 'Equipos' && document.multiresource
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

export default NewDocumentMulti;
