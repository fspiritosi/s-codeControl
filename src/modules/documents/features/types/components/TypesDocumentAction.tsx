'use client';
import NewDocumentType from '@/modules/documents/features/types/components/NewDocumentType';
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
import { useCountriesStore } from '@/shared/store/countries';
import { useLoggedUserStore } from '@/shared/store/loggedUser';

function TypesDocumentAction({ optionChildrenProp }: { optionChildrenProp: string }) {
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const role = useLoggedUserStore((state) => state.roleActualCompany);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild className="mr-4">
        {role !== 'Invitado' && <Button>Crear nuevo</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent className='max-w-[40vw] max-h-[80vh] overflow-auto'>
        <AlertDialogHeader>
          <AlertDialogTitle>Nuevo tipo de documento</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <NewDocumentType codeControlClient optionChildrenProp={optionChildrenProp} />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            onClick={() => {
              document.getElementById('create_new_document')?.click();
              fetchDocumentTypes(actualCompany?.id);
            }}
          >
            Crear documento
          </Button>
          <AlertDialogCancel id="close_document_modal">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default TypesDocumentAction;
