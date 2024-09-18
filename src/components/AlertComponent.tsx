'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLoggedUserStore } from '@/store/loggedUser';
import { Company } from '@/zodSchemas/schemas';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '../../supabase/supabase';

export const AlertComponent = () => {
  const showAlert = useLoggedUserStore((state) => state.showNoCompanyAlert);
  const showMultipleAlert = useLoggedUserStore((state) => state.showMultiplesCompaniesAlert);
  const setActualCompany = useLoggedUserStore((state) => state.setActualCompany);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const allCompanies = useLoggedUserStore((state) => state.allCompanies);
  const router = useRouter();
  router.prefetch('/dashboard/company/new');

  const handleAlertClose = async (company: Company[0]) => {
    await supabase.from('company').update({ by_defect: true }).eq('id', company.id);
    setActualCompany(company);

    router.push('/dashboard');
  };

  const handleCompanyCreation = () => {
    toast.promise(
      async () => {
        router.push('/dashboard/company/new');
        useLoggedUserStore.setState({ showNoCompanyAlert: false });
      },
      {
        loading: 'Creando empresa',
        success: 'Empresa creada',
        error: 'Error al crear empresa',
      }
    );
  };
  //si actualCompany no es null, no mostrar alerta
  //si actualCompany es null, mostrar alerta
  //si actualCompany es null y allCompanies tiene mas de 1, mostrar alerta
  //si actualCompany es null y allCompanies tiene 1, no mostrar alerta

  return (
    (showMultipleAlert && (
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parece que tienes varias compañías creadas</AlertDialogTitle>
            <AlertDialogDescription>
              Para poder administrar tu empresa debes seleccionar una compañía. ¿Deseas seleccionar una?
            </AlertDialogDescription>
            {allCompanies?.map((company, index) => (
              <div key={crypto.randomUUID()}>
                <AlertDialogAction
                  onClick={() => handleAlertClose(company)}
                  key={crypto.randomUUID()}
                  className="w-full"
                >
                  {company.company_name}
                </AlertDialogAction>
              </div>
            ))}
          </AlertDialogHeader>
          <AlertDialogFooter></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )) ||
    (showAlert && (
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parece que no tienes ninguna compañía creada</AlertDialogTitle>
            <AlertDialogDescription>
              Para poder administrar tu empresa debes crear una compañía primero. ¿Deseas crear una?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCompanyCreation}>Crear compañía</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ))
  );
};
