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
import { Company } from '@/zodSchemas/schemas'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

export const AlertComponent = () => {
  const showAlert = useLoggedUserStore(state => state.showNoCompanyAlert)
  const showMultipleAlert = useLoggedUserStore(
    state => state.showMultiplesCompaniesAlert,
  )
  const setActualCompany = useLoggedUserStore(state => state.setActualCompany)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const allCompanies = useLoggedUserStore(state => state.allCompanies)
  const router = useRouter()

  const handleAlertClose = async (company: Company[0]) => {
    await supabase
      .from('company')
      .update({ by_defect: true })
      .eq('id', company.id)
    setActualCompany(company)

    router.push('/dashboard')
  }

  //si actualCompany no es null, no mostrar alerta
  //si actualCompany es null, mostrar alerta
  //si actualCompany es null y allCompanies tiene mas de 1, mostrar alerta
  //si actualCompany es null y allCompanies tiene 1, no mostrar alerta

  return (
    (showMultipleAlert && (
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Parece que tienes varias compañías creadas
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para poder administrar tu empresa debes seleccionar una compañía.
              ¿Deseas seleccionar una?
            </AlertDialogDescription>
            {allCompanies.map((company, index) => (
              <div key={index}>
                <AlertDialogAction
                  onClick={() => handleAlertClose(company)}
                  key={index}
                  className="w-full"
                >
                  {company.company_name}
                </AlertDialogAction>
                {/* <AlertDialogDescription>
                  <span className="flex items-center p-2 gap-2 justify-center">
                    <input
                      type="checkbox"
                      id={`company-${index}`}
                      value={company.company_name}
                      checked={selectedCompany === company.company_name}
                      onChange={handleCheckboxChange}
                    />
                    <label
                      htmlFor={`company-${index}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 p-0"
                    >
                      Usar como compañía principal
                    </label>
                  </span>
                </AlertDialogDescription> */}
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
            <AlertDialogTitle>
              Parece que no tienes ninguna compañía creada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para poder administrar tu empresa debes crear una compañía
              primero. ¿Deseas crear una?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              <Link href="/dashboard/company/new">Crear compañía</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ))
  )
}
