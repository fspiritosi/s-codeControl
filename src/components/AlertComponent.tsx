'use client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
export const AlertComponent = () => {
   const showAlert = useLoggedUserStore(state => state.showAlert);
  return (
    showAlert && (
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Parece que no tienes ninguna compañia creada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para poder administrar tu empresa debes crear una compañia primero.
              ¿Deseas crear una?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              <Link href="/dashboard/company">Crear compañia</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  );
}
