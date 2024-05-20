'use client'
import { Button } from '@/components/ui/button'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useLoggedUserStore } from '@/store/loggedUser'
import { Company, companySchema } from '@/zodSchemas/schemas'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AddCompany } from '../accions'

export default function CreateCompanyButton() {
  const router = useRouter()
  const supabase = supabaseBrowser()
  const clientAccion = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries())
    const result = await companySchema.safeParseAsync(values)

    if (!result.success) {
      result.error.issues.forEach(issue => {
        console.log(issue, 'issue')
        const element = document.getElementById(`${issue.path}_error`)
        if (element) {
          element.innerText = issue.message
          element.style.color = 'red'
        }
      })

      Object.keys(values).forEach(key => {
        if (!result.error.issues.some(issue => issue.path.includes(key))) {
          const element = document.getElementById(`${key}_error`)
          if (element) {
            element.innerText = ''
          }
        }
      })

      return
    }

    toast.promise(
      async () => {
        const { data, error } = await AddCompany(formData)

        console.log(data, 'data')
        console.log(error, 'error')

        if (data && data?.length > 0) {
          const { data: company, error: companyError } = await supabase
            .from('company')
            .select(
              `
            *,
            owner_id(*),
            share_company_users(*,
              profile(*)
            ),
            city (
              name,
              id
            ),
            province_id (
              name,
              id
            ),
            companies_employees (
              employees(
                *,
                city (
                  name
                ),
                province(
                  name
                ),
                workflow_diagram(
                  name
                ),
                hierarchical_position(
                  name
                ),
                birthplace(
                  name
                ),
                contractor_employee(
                  contractors(
                    *
                  )
                )
              )
            )
          `,
            )
            .eq('owner_id', data?.[0]?.owner_id)

          const actualCompany = company?.filter(
            company => company.id === data?.[0]?.id,
          )

          useLoggedUserStore.setState({
            actualCompany: actualCompany?.[0] as Company[0],
          })
          useLoggedUserStore.setState({ allCompanies: company as Company })

          router.push('/dashboard')
        }
      },
      {
        loading: 'Registrando Compañía',
        success: 'Compañía Registrada',
        error: 'Error al registrar Compañía',
      },
    )
  }

  return (
    <Button
      type="submit"
      formAction={formData => clientAccion(formData)}
      className="mt-5"
    >
      Registrar Compañía
    </Button>
  )
}
