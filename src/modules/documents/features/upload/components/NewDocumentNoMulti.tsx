import { fetchCurrentCompany } from '@/modules/company/features/detail/actions.server';
import { fetchAllDocumentTypes } from '@/modules/documents/features/list/actions.server';
import { fetchAllEmployees } from '@/modules/employees/features/list/actions.server';
import { fetchAllEquipment } from '@/modules/equipment/features/list/actions.server';
import { fetchCurrentUser } from '@/shared/actions/auth';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/lib/utils';
import InfoComponent from '@/shared/components/common/InfoComponent';
import UploadDocumentEmployee from './UploadDocumentEmployee';
import UploadDocumentEquipment from './UploadDocumentEquipment';
async function NewDocumentNoMulti({
  onlyEquipment,
  onlyEmployees,
  id_user,
}: {
  onlyEquipment?: boolean;
  onlyEmployees?: boolean;
  id_user?: string;
}) {
  const employees = (await fetchAllEmployees()).map((employee: any) => ({
    label: `${employee.firstname} ${employee.lastname}`,
    value: employee.id,
    cuit: employee.cuil,
  }));

  const equipments = (await fetchAllEquipment()).map((equipment: any) => ({
    label: equipment.domain
      ? `${equipment.domain} - ${equipment.intern_number}`
      : `${equipment.serie} - ${equipment.intern_number}`,
    value: equipment.id,
  }));

  const allDocumentTypes = await fetchAllDocumentTypes();
  const currentCompany = await fetchCurrentCompany();

  const user = await fetchCurrentUser();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Documento No Multirecurso</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full">
        <AlertDialogHeader>
          <AlertDialogTitle>Cargar documento</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Subir un documento no multirecurso</AlertDialogDescription>
        </AlertDialogHeader>
        <InfoComponent
          iconSize="lg"
          size="sm"
          message={
            'Desde aqui solo podras subir documentos faltantes, si deseas reemplazar o eliminar un documento, dirigete al documento en cuestion y realiza la accion deseada.'
          }
        />
        <Tabs defaultValue={onlyEmployees ? 'employees' : onlyEquipment ? 'equipment' : 'employees'} className="">
          <TabsList
            className={cn('w-full grid grid-cols-2', onlyEmployees && onlyEquipment ? 'grid-cols-2' : 'grid-cols-1')}
          >
            {onlyEmployees && <TabsTrigger value="employees">Empleados</TabsTrigger>}
            {onlyEquipment && <TabsTrigger value="equipment">Equipos</TabsTrigger>}
          </TabsList>
          <TabsContent value="employees">
            <UploadDocumentEmployee
              default_id={id_user}
              employees={employees}
              allDocumentTypes={allDocumentTypes?.filter(
                (document: any) => document.applies === 'Persona' && !document.multiresource
              ) as any}
              currentCompany={currentCompany as any}
              user_id={user?.id}
            />
          </TabsContent>
          <TabsContent value="equipment">
            <UploadDocumentEquipment
              default_id={id_user}
              currentCompany={currentCompany as any}
              allDocumentTypes={allDocumentTypes?.filter(
                (document: any) => document.applies === 'Equipos' && !document.multiresource
              ) as any}
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
