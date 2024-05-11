import CompanySelector from '@/app/dashboard/componentDashboard/CompanySelector'
import { ModeToggle } from '@/components/ui/ToogleDarkButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabaseServer } from '@/lib/supabase/server'
import { Database } from '@/types/supabaseTypes'
import { Company } from '@/zodSchemas/schemas'
import cookie from 'js-cookie'
import { UpdateUserPasswordForm } from './UpdateUserPasswordForm'
import { AlertDialogHeader } from './ui/alert-dialog'
import { Separator } from './ui/separator'

export default async function NavBar({
  profile,
}: {
  profile: Database['public']['Tables']['profile']['Row'][] | null
}) {
  const supabase = supabaseServer()

  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(
      `*,
    company(
      *,owner_id(*),
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
  )`,
    )
    .eq('profile_id', profile?.[0].id || '')

  const { data: company, error } = await supabase
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
    .eq('owner_id', profile?.[0].id || '')

  const defectCompany = company?.filter(company => company.by_defect)

  let actualCompany = company?.[0]

  if (company?.length && company?.length > 1) {
    if (defectCompany) {
      //
      // setActualCompany(selectedCompany[0])
      actualCompany = defectCompany[0]
    } else {
      //! set({ showMultiplesCompaniesAlert: true })
    }
  }
  if (company?.length === 1) {
    // set({ showMultiplesCompaniesAlert: false })
    actualCompany = company[0]
  }
  if (company?.length === 0) {
    //! set({ showNoCompanyAlert: true })
  }

  console.log('company', company)

  const handleLogout = async () => {
    // try {
    //   await supabase.auth.signOut()
    //   router.push('/login')
    // } catch (error) {
    //   console.error('Error al cerrar sesión:', error)
    // }
  }

  // const totalCompanies = [
  //   sharedCompanies?.map(company => company.company_id),
  //   allCompanies,
  // ].flat()

  // const [isOpen, setIsOpen] = useState(false)
  // const [selectedCompany, setSelectedCompany] = useState(null)
  // const [isModalOpen, setIsModalOpen] = useState(false)
  // const router = useRouter()
  // const setActualCompany = useLoggedUserStore(state => state.setActualCompany)

  const handleNewCompany = async (company: Company[0]) => {
    // setNewDefectCompany(company)
    // setActualCompany(company)
    // setIsOpen(false)
    // revalidate()
    // router.push('/dashboard')
  }
  // const { control, formState, setValue } = useForm()

  const updateProfileAvatar = async (imageUrl: string) => {
    // try {
    //   // Realiza la actualización en la tabla profile usando Supabase
    //   const { data, error } = await supabase
    //     .from('profile')
    //     .update({ avatar: imageUrl })
    //     .eq('id', actualUser[0].id || '')
    //   if (error) {
    //     throw error
    //   }
    // } catch (error) {
    //   console.error('Error al actualizar la URL de la imagen:', error)
    // }
  }
  // const [open, setOpen] = useState(false)
  // const [showNewTeamDialog, setShowNewTeamDialog] = useState(false)
  const actualCompanyId = cookie.get('actualCompanyId')

  // const markAllAsRead = useLoggedUserStore(state => state.markAllAsRead)
  // const { toast } = useToast()

  const groups = company?.map(companyItem => ({
    label: companyItem?.company_name,
    teams: {
      label: companyItem?.company_name,
      value: companyItem?.id,
      logo: companyItem?.company_logo,
    },
  }))

  // const groups = [
  // {
  //   label: 'Compañia actual propia',
  //   teams: {
  //     label: actualCompany?.company_name,
  //     value: actualCompany?.id,
  //     logo: actualCompany?.company_logo,
  //   },
  // },
  // {
  //   label: 'Otras compañias propias',
  //   teams: totalCompanies
  //     ?.filter(companyItem => companyItem?.id !== actualCompanyId)
  //     ?.map(companyItem => ({
  //       label: companyItem?.company_name,
  //       value: companyItem?.id,
  //       logo: companyItem?.company_logo,
  //     })),
  // },
  // ]
  // const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const actualCompanyProp = {
    company_name: actualCompany?.company_name || '',
    company_logo: actualCompany?.company_logo,
    id: actualCompany?.id,
  }
  const sharedCompanies = share_company_users?.map(company => ({
    company: {
      id: company?.company_id,
      company_name: company?.company?.company_name,
      company_logo: company?.company?.company_logo,
    },
  }))

  return (
    <nav className=" flex flex-shrink items-center justify-end sm:justify-between  text-white p-4 mb-2">
      <div className=" items-center hidden sm:flex">
        <CompanySelector
          actualCompany={actualCompanyProp}
          groups={groups}
          share_company_users={sharedCompanies}
        />
      </div>
      <div className="flex gap-8 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="relative">
              {/* {notifications?.length ? (
                <DotFilledIcon className="text-blue-600 absolute size-7 top-[-8px] right-[-10px] p-0" />
              ) : (
                false
              )}

              <BellIcon className="text-black cursor-pointer size-5 dark:text-white" /> */}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="min-w-[400px] bg-transparent border-none shadow-none"
          >
            <Card className="w-[600px]">
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                {/* {notifications?.length ? (
                  <CardDescription>
                    Tienes {notifications?.length} notificaciones pendientes
                  </CardDescription>
                ) : (
                  false
                )} */}
                <DropdownMenuSeparator className="mb-3" />
              </CardHeader>
              {/* <CardContent className="grid gap-6 max-h-[40vh] overflow-auto">
                {notifications?.length > 0 ? (
                  <div>
                    {notifications?.map((notification, index) => (
                      <div
                        key={index}
                        className="mb-4 grid grid-cols-[25px_1fr] pb-4 last:mb-0 last:pb-0 items-center  gap-2"
                      >
                        {notification?.category === 'rechazado' && (
                          <ExclamationTriangleIcon className="text-yellow-800" />
                        )}
                        {notification?.category === 'aprobado' && (
                          <CheckCircledIcon className="text-green-800" />
                        )}
                        {notification?.category === 'vencimiento' && (
                          <LapTimerIcon className="text-red-800" />
                        )}
                        {notification?.category === 'noticia' && (
                          <EnvelopeOpenIcon className="text-blue-800" />
                        )}
                        {notification?.category === 'advertencia' && (
                          <ExclamationTriangleIcon className="text-yellow-800" />
                        )}

                        <div className="space-y-1 flex justify-between items-center gap-2">
                          <div>
                            <p className="text-sm font-medium leading-none first-letter:uppercase">
                              {notification?.category === 'aprobado' &&
                                `El documento ${
                                  notification?.document?.documentName ||
                                  '(no disponible)'
                                }, del ${
                                  notification.reference === 'employee'
                                    ? 'empleado'
                                    : 'vehiculo con patente'
                                } ${
                                  notification?.document?.resource
                                    ?.split(' ')
                                    .map(
                                      word =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1).toLowerCase(),
                                    )
                                    .join(' ') || '(no disponible)'
                                } ha sido aprobado`}
                              {notification?.category === 'rechazado' &&
                                `El documento ${
                                  notification?.document?.documentName ||
                                  '(no disponible)'
                                }, del ${
                                  notification.reference === 'employee'
                                    ? 'empleado'
                                    : 'vehiculo con patente'
                                } ${
                                  notification.reference === 'employee'
                                    ? notification?.document?.resource
                                        .split(' ')
                                        .map(
                                          word =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1).toLowerCase(),
                                        )
                                        .join(' ') || '(no disponible)'
                                    : notification?.document?.resource
                                        .split(' ')
                                        .map(
                                          word =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1).toUpperCase(),
                                        )
                                        .join(' ') || '(no disponible)'
                                } ha sido rechazado`}
                              {notification?.category === 'vencimiento' &&
                                `El documento ${
                                  notification?.document?.documentName ||
                                  '(no disponible)'
                                }, del ${
                                  notification.reference === 'employee'
                                    ? 'empleado'
                                    : 'vehiculo con patente'
                                } ${
                                  notification?.document?.resource
                                    .split(' ')
                                    .map(
                                      word =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1).toLowerCase(),
                                    )
                                    .join(' ') || '(no disponible)'
                                } ha vencido`}
                            </p>

                            <CardDescription>
                              {notification?.description.length > 50
                                ? notification?.description.substring(0, 50) +
                                  '...'
                                : notification?.description}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground/70 first-letter:">
                              {notification?.created_at &&
                                formatRelative(
                                  new Date(notification?.created_at),
                                  new Date(),
                                  { locale: es },
                                )}
                            </p>
                          </div>
                          <Link
                            className={[
                              buttonVariants({ variant: 'outline' }),
                              'w-20',
                            ].join(' ')}
                            href={`/dashboard/document/${notification?.document?.id}`}
                          >
                            Ver
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CardDescription>
                    No tienes notificaciones pendientes
                  </CardDescription>
                )}
              </CardContent> */}
              <CardFooter>
                {/* <Button onClick={() => markAllAsRead()} className="w-full">
                  <Check
                    className="mr-2 h-4 w-4"
                    onClick={() => markAllAsRead()}
                  />{' '}
                  Marcar todos como leido
                </Button> */}
              </CardFooter>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
        <ModeToggle />
        <div className="flex-shrink justify-center items-center flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer" asChild>
              <Avatar className="size-9">
                {/* <AvatarImage
                  src={typeof avatarUrl === 'object' ? avatarUrl.avatar : ''}
                /> */}
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {/* {typeof avatarUrl === 'object' ? avatarUrl.fullname : ''} */}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {/* {typeof avatarUrl === 'object' ? avatarUrl.email : ''} */}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)}>
                Editar perfil
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Button variant={'destructive'} className="w-full">
                  Cerrar Sesión
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog>
            <DialogContent className="sm:max-w-[500px] ">
              <AlertDialogHeader>
                <DialogTitle>Editar perfil</DialogTitle>
                <DialogDescription>
                  Aqui se haran cambios en tu perfil
                </DialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="w-[300px] flex  gap-2">
                  {/* <FormProvider {...useForm()}>
                    <FormField
                      control={control}
                      name="company_logo"
                      render={({ field }) => (
                        <FormItem className=" max-w-[600px] flex flex-col justify-center">
                          <FormControl>
                            <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                              <UploadImage
                                companyId=""
                                labelInput="Avatar"
                                imageBucket="avatar"
                                desciption="Sube tu avatar"
                                style={{ width: '300px' }}
                                // onImageChange={(imageUrl: string) =>
                                //   setValue('profile', imageUrl)
                                // }
                                onImageChange={async imageUrl => {
                                  setValue('profile', imageUrl)
                                  await updateProfileAvatar(imageUrl) // Llama a la función para actualizar la URL
                                }}
                                // onUploadSuccess={onUploadSuccess}
                                inputStyle={{ width: '150px' }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormProvider> */}
                </div>
                <Separator className="my-4" />
                <UpdateUserPasswordForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  )
}
