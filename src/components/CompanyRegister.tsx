'use client';
import { company } from '@/types/types';
interface CompanyRegisterProps {
  company?: company | null;
  formEnabled?: boolean;
}
export function CompanyRegister({ company = null, formEnabled = true }: CompanyRegisterProps) {
  // const formEnabledProp = company ? formEnabled : true
  // const supabase = supabaseBrowser()

  // const router = useRouter()
  // const profile = useLoggedUserStore(state => state.profile)
  // const { insertCompany, fetchIndustryType, updateCompany } = useCompanyData()
  // const [showLoader, setShowLoader] = useState(false)
  // const [selectedIndustry, setSelectedIndustry] =
  //   useState<industry_type | null>(null)
  // const [industry, setIndustry] = useState<Industry[]>([])
  // const uploadImageRef = useRef()
  // const provincesValues = useCountriesStore(state => state.provinces)
  // const citiesValues = useCountriesStore(state => state.cities)
  // const fetchCityValues = useCountriesStore(state => state.fetchCities)
  // const { uploadImage, loading } = useImageUpload()
  // // const { toast } = useToast()

  // const form = useForm<z.infer<typeof editCompanySchema>>({
  //   resolver: zodResolver(editCompanySchema),
  //   defaultValues: company
  //     ? {
  //         ...company,
  //         province_id: company.province_id.id,
  //         city: company.city.id?.toString(),
  //       }
  //     : {
  //         company_name: '',
  //         company_cuit: '',
  //         description: '',
  //         website: '',
  //         contact_email: '',
  //         contact_phone: '',
  //         address: '',
  //         city: 0,
  //         country: 'argentina',
  //         province_id: 0,
  //         industry: '',
  //         by_defect: false,
  //       },
  // })

  // const onImageChange = (imageUrl: string) => {
  //   form.setValue('company_logo', imageUrl)
  // }

  // type Industry = {
  //   id: number
  //   name: string
  // }

  // const handleProvinceChange = (selectedProvinceName: string) => {
  //   //Buscar el objeto Province correspondiente al selectedProvinceId
  //   const selectedProvince = provincesValues.find(
  //     p => p.name === selectedProvinceName,
  //   )
  //   if (selectedProvince) {
  //     fetchCityValues(selectedProvince?.id)
  //     form.setValue('province_id', selectedProvince?.id.toString())
  //   }
  // }

  // const handleCityChange = (selectedCityName: string) => {
  //   // Buscar el objeto City correspondiente al selectedCityName
  //   const selectedCity = citiesValues.find(c => c.name === selectedCityName)
  //   if (selectedCity) {
  //     form.setValue('city', selectedCity?.id.toString())
  //   }
  // }

  // const handleIndustryChange = (selectedIndustryType: string) => {
  //   const selectedIndustry = industry.find(
  //     ind => ind.name === selectedIndustryType,
  //   )
  //   if (selectedIndustry) {
  //     form.setValue('industry', selectedIndustry.name)
  //   }
  // }

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const fetchedIndustry = await fetchIndustryType()
  //       if (fetchedIndustry) {
  //         setIndustry(fetchedIndustry)
  //       } else {
  //         console.error('La función fetchIndustryType() devolvió null.')
  //       }
  //     } catch (error) {
  //       console.error('Error al obtener las industrias:', error)
  //     }
  //   }

  //   fetchData()
  // }, [])

  // const onSubmit = async (companyData: z.infer<typeof editCompanySchema>) => {
  //   try {
  //     //Procesa los valores antes de enviarlos a la base de datos
  //     const processedCompanyData = {
  //       ...companyData,
  //       company_name: processText(companyData.company_name),
  //       company_cuit: processText(companyData.company_cuit),
  //       website: processText(companyData.website),
  //       country: processText(companyData.country),
  //       province_id: companyData.province_id?.id
  //         ? companyData.province_id?.id
  //         : companyData.province_id,
  //       city: companyData.city?.id ? companyData.city?.id : companyData.city,
  //       contact_email: processText(companyData.contact_email),
  //       contact_phone: processText(companyData.contact_phone),
  //       address: processText(companyData.address),
  //       industry: processText(companyData.industry),
  //     }

  //     //Insertar la compañía con los datos procesados
  //     let updatedCompany

  //     if (company && company?.id) {
  //       toast.promise(
  //         async () => {
  //           updatedCompany = await updateCompany(company?.id || '', {
  //             ...processedCompanyData,
  //             company_logo: processedCompanyData.company_logo || '',
  //             owner_id: profile?.[0]?.id,
  //             by_defect: false,
  //           })
  //           await handleUpload()
  //           router.push('/dashboard')
  //         },
  //         {
  //           loading: 'Actualizando compañía...',
  //           success: 'Compañía actualizada correctamente',
  //           error: 'Ocurrió un error al actualizar la compañía',
  //         },
  //       )
  //     } else {
  //       toast.promise(
  //         async () => {
  //           //Verificar si existe una compañía con el mismo CUIT
  //           const { data: existingCompany } = await supabase
  //             .from('company')
  //             .select('*')
  //             .eq('company_cuit', processedCompanyData.company_cuit)

  //           if (existingCompany?.length) {
  //             throw new Error('Ya existe una compañía con ese CUIT')
  //           }

  //           updatedCompany = await insertCompany({
  //             ...processedCompanyData,
  //             company_logo: processedCompanyData.company_logo || '',
  //             owner_id: profile?.[0]?.id,
  //             by_defect: false,
  //           })
  //           await handleUpload()
  //           router.push('/dashboard')
  //         },
  //         {
  //           loading: 'Registrando compañía...',
  //           success: success => {
  //             router.push('/dashboard')
  //             // redirect('/dashboard')
  //             return 'Compañía registrada correctamente'
  //           },
  //           error: error => {
  //             return error
  //           },
  //         },
  //       )
  //     }
  //     router.push('/dashboard')
  //   } catch (err) {
  //     console.error('Ocurrió un error:', err)
  //   } finally {
  //     setShowLoader(false)
  //   }
  // }
  // const url = process.env.NEXT_PUBLIC_PROJECT_URL
  // const processText = (text: string): string | any => {
  //   if (text === undefined) {
  //     // Puedes decidir qué hacer aquí si text es undefined.
  //     // Por ejemplo, podrías devolver una cadena vacía, lanzar un error, etc.
  //     return ''
  //   }
  //   return text
  //     .normalize('NFD')
  //     .replace(/[\u0300-\u036f'"]/g, '')
  //     .trim()
  //     .toLowerCase()
  // }
  // const [imageFile, setImageFile] = useState<File | null>(null)
  // const [base64Image, setBase64Image] = useState<string>('')
  // const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0]

  //   if (file) {
  //     setImageFile(file)
  //     // Convertir la imagen a base64
  //     const reader = new FileReader()
  //     reader.onload = e => {
  //       if (e.target && typeof e.target.result === 'string') {
  //         setBase64Image(e.target.result)
  //       }
  //     }
  //     reader.readAsDataURL(file)
  //   }
  // }

  // const handleUpload = async () => {
  //   const company_cuit = form.getValues('company_cuit')

  //   const fileExtension = imageFile?.name.split('.').pop()
  //   if (imageFile) {
  //     try {
  //       const renamedFile = new File(
  //         [imageFile],
  //         `${company_cuit}.${fileExtension}`,
  //         { type: `image/${fileExtension?.replace(/\s/g, '')}` },
  //       )
  //       await uploadImage(renamedFile, 'logo')
  //       const employeeImage =
  //         `${url}/logo/${company_cuit}.${fileExtension}?timestamp=${Date.now()}`
  //           .trim()
  //           .replace(/\s/g, '')
  //       const { data, error } = await supabase
  //         .from('company')
  //         .update({ company_logo: employeeImage })
  //         .eq('company_cuit', company_cuit)
  //     } catch (error: any) {
  //       // toast({
  //       //   variant: 'destructive',
  //       //   title: 'Error al subir la imagen',
  //       //   description:
  //       //     'No pudimos registrar la imagen, pero el ususario fue registrado correctamente',
  //       // })
  //     }
  //   }
  // }

  return (
    // <Form {...form}>
    //   <form onSubmit={form.handleSubmit(onSubmit)}>
    //     <div className=" flex flex-wrap gap-8 items-center w-full">
    //       <FormField
    //         control={form.control}
    //         name="company_name"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <FormLabel>Nombre de la compañía</FormLabel>
    //             <FormControl>
    //               <Input
    //                 disabled={!formEnabledProp}
    //                 className="max-w-[350px] w-[300px]"
    //                 placeholder="nombre de la compañía"
    //                 {...field}
    //               />
    //             </FormControl>
    //             <FormDescription>
    //               Por favor ingresa el nombre de la compañía.
    //             </FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="company_cuit"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center max-w-[300px]">
    //             <FormLabel>CUIT de la compañía</FormLabel>
    //             <FormControl>
    //               <Input
    //                 disabled={!formEnabledProp}
    //                 placeholder="xxxxxxxxxxx"
    //                 className="max-w-[400px] w-[300px]"
    //                 maxLength={13}
    //                 {...field}
    //               />
    //             </FormControl>
    //             <FormDescription>Por favor ingresa el CUIT .</FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="website"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <FormLabel>Sitio Web</FormLabel>
    //             <FormControl>
    //               <Input
    //                 disabled={!formEnabledProp}
    //                 className="max-w-[350px]  w-[300px]"
    //                 placeholder="sitio web"
    //                 {...field}
    //               />
    //             </FormControl>
    //             <FormDescription>
    //               Por favor ingresa el sitio web de la compañía.
    //             </FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="contact_email"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center ">
    //             <FormLabel>Email</FormLabel>
    //             <FormControl>
    //               <Input
    //                 disabled={!formEnabledProp}
    //                 className="max-w-[350px]  w-[300px]"
    //                 placeholder="email"
    //                 autoComplete="email"
    //                 {...field}
    //               />
    //             </FormControl>
    //             <FormDescription>Por favor ingresa tu email.</FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="contact_phone"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center max-w-[300px]">
    //             <FormLabel>Número de teléfono</FormLabel>
    //             <FormControl>
    //               <Input
    //                 disabled={!formEnabledProp}
    //                 className="max-w-[350px]  w-[300px]"
    //                 placeholder="número de teléfono"
    //                 {...field}
    //               />
    //             </FormControl>
    //             <FormDescription className="max-w-[300px]">
    //               Por favor ingresa el número de teléfono de la compañía.
    //             </FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="address"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <FormLabel>Dirección</FormLabel>
    //             <FormControl>
    //               <Input
    //                 disabled={!formEnabledProp}
    //                 className="max-w-[350px]  w-[300px]"
    //                 placeholder="dirección"
    //                 {...field}
    //               />
    //             </FormControl>
    //             <FormDescription className="max-w-[300px]">
    //               Por favor ingresa tu dirección
    //             </FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="country"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <FormLabel>Seleccione un país</FormLabel>
    //             <Select disabled={!formEnabledProp}>
    //               <SelectTrigger className="max-w-[350px]  w-[300px]">
    //                 <SelectValue placeholder="Seleccionar país" />
    //               </SelectTrigger>
    //               <SelectContent>
    //                 <SelectItem value="argentina">Argentina</SelectItem>
    //               </SelectContent>
    //             </Select>
    //             <FormDescription className="max-w-[300px]">
    //               Por favor ingresa tu país
    //             </FormDescription>
    //           </FormItem>
    //         )}
    //       />
    //       <FormField
    //         control={form.control}
    //         name="province_id"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <FormLabel>Seleccione una provincia</FormLabel>
    //             <Select
    //               disabled={!formEnabledProp}
    //               onValueChange={handleProvinceChange}
    //             >
    //               <SelectTrigger className="max-w-[350px]  w-[300px]">
    //                 <SelectValue placeholder="Seleccionar Provincia" />
    //               </SelectTrigger>
    //               <SelectContent>
    //                 {provincesValues?.map(province => (
    //                   <SelectItem key={province?.id} value={province?.name}>
    //                     {province.name}
    //                   </SelectItem>
    //                 ))}
    //               </SelectContent>
    //             </Select>
    //             <FormDescription className="max-w-[300px]">
    //               Por favor selecciona tu provincia
    //             </FormDescription>
    //           </FormItem>
    //         )}
    //       />
    //       <FormField
    //         control={form.control}
    //         name="city"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <FormLabel>Seleccione una ciudad</FormLabel>
    //             <Select
    //               disabled={!formEnabledProp}
    //               onValueChange={handleCityChange}
    //             >
    //               <SelectTrigger className="max-w-[350px] w-[300px]">
    //                 <SelectValue placeholder="Seleccionar Ciudad" />
    //               </SelectTrigger>
    //               <SelectContent>
    //                 {citiesValues?.map(city => (
    //                   <SelectItem key={city?.id} value={city?.name}>
    //                     {city.name}
    //                   </SelectItem>
    //                 ))}
    //               </SelectContent>
    //             </Select>
    //             <FormDescription className="max-w-[300px]">
    //               Por favor selecciona tu ciudad
    //             </FormDescription>
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="industry"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center max-w-[300px]">
    //             <FormLabel>Seleccione una Industria</FormLabel>
    //             <Select
    //               disabled={!formEnabledProp}
    //               onValueChange={handleIndustryChange}
    //             >
    //               <SelectTrigger className="max-w-[350px] w-[300px]">
    //                 <SelectValue placeholder="Seleccionar Industria" />
    //               </SelectTrigger>
    //               <SelectContent>
    //                 {industry?.map(ind => (
    //                   <SelectItem key={ind?.id} value={ind?.name}>
    //                     {ind?.name}
    //                   </SelectItem>
    //                 ))}
    //               </SelectContent>
    //             </Select>
    //             <FormDescription className="max-w-[300px]">
    //               Por favor selecciona tu Industria
    //             </FormDescription>
    //           </FormItem>
    //         )}
    //       />

    //       {/* <FormField
    //         control={form.control}
    //         name="company_logo"
    //         render={({ field }) => (
    //           <FormItem className=" max-w-[600px] flex flex-col justify-center">
    //             <FormControl>
    //               <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
    //                 <UploadImage
    //                   companyId={company?.id as string}
    //                   labelInput="Logo"
    //                   imageBucket="logo"
    //                   desciption="Sube el logo de tu compañía"
    //                   style={{ width: '100px' }}
    //                   onImageChange={(imageUrl: string) =>
    //                     form.setValue('company_logo', imageUrl)
    //                   }
    //                   // onUploadSuccess={onUploadSuccess}
    //                   inputStyle={{ width: '300px' }}
    //                 />
    //               </div>
    //             </FormControl>

    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       /> */}

    //       <FormField
    //         control={form.control}
    //         name="company_logo"
    //         render={({ field }) => (
    //           <FormItem className="">
    //             <FormControl>
    //               <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
    //                 <ImageHander
    //                   labelInput="Subir foto"
    //                   handleImageChange={handleImageChange}
    //                   base64Image={base64Image} //nueva
    //                   disabled={!formEnabledProp}
    //                   inputStyle={{
    //                     width: '400px',
    //                     maxWidth: '300px',
    //                   }}
    //                 />
    //               </div>
    //             </FormControl>

    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       <FormField
    //         control={form.control}
    //         name="description"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <FormLabel>Descripción</FormLabel>
    //             <FormControl>
    //               <Textarea
    //                 disabled={!formEnabledProp}
    //                 className="max-w-[350px] w-[300px]"
    //                 placeholder="Descripción de la compañía"
    //                 {...field}
    //               />
    //             </FormControl>
    //             <FormDescription className="max-w-[300px]">
    //               Por favor ingresa la descripción de la compañía.
    //             </FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />
    //       <FormField
    //         control={form.control}
    //         name="by_defect"
    //         render={({ field }) => (
    //           <FormItem className="flex flex-col justify-center">
    //             <div className="flex flex-row-reverse gap-2 justify-center items-center">
    //               <FormLabel>
    //                 Marcar para seleccionar Compañia por defecto
    //               </FormLabel>
    //               <FormControl>
    //                 <Checkbox
    //                   disabled={!formEnabledProp}
    //                   defaultChecked={company ? company.by_defect : false}
    //                   onCheckedChange={field.onChange}
    //                 />
    //               </FormControl>
    //             </div>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />
    //     </div>

    //     <Button
    //       disabled={!formEnabledProp}
    //       type="submit"
    //       className="mt-5"
    //       //disabled={showLoader}
    //     >
    //       {/* {showLoader ? (
    //         <Loader />
    //       ) :  */}
    //       {company ? 'Editar Compañia' : 'Registrar Compañía'}
    //     </Button>
    //   </form>
    // </Form>
    <></>
  );
}
