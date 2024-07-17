'use client';
import NewDocumentType from '@/components/NewDocumentType';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';

function TypesDocumentAction({ optionChildrenProp }: { optionChildrenProp: string }) {
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const role = useLoggedUserStore((state) => state.roleActualCompany);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild className="mr-4">
        {role !== 'Invitado' && <Button>Crear nuevo</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent>
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
