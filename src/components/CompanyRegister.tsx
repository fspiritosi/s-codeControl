'use client'
import { UploadImage } from '@/components/UploadImage'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCompanyData } from '@/hooks/useCompanyData'
import { useCountriesStore } from '@/store/countries'
import { companySchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader } from './svg/loader'
import { useLoggedUserStore } from '@/store/loggedUser'

export function CompanyRegister() {
  const profile = useLoggedUserStore(state => state.profile)
  const { insertCompany, fetchIndustryType, industry } = useCompanyData()
  const [showLoader, setShowLoader] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(
    null,
  )
  const provincesValues = useCountriesStore(state => state.provinces)
  const citiesValues = useCountriesStore(state => state.cities)
  const fetchCityValues = useCountriesStore(state => state.fetchCities)

  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      company_cuit: '',
      description: '',
      website: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      city: 0,
      country: 'argentina',
      province_id: 0,
      industry: '',
      employees: null,
    },
  })

  const onImageChange = (imageUrl: string) => {
    form.setValue('company_logo', imageUrl)
  }

  const onUploadSuccess = (imageUrl: string) => {}

  interface Province {
    id: number
    name: string
  }

  interface City {
    id: number
    name: string
    province_id: number
  }

  interface Industry {
    id: number
    name: string
  }

  const handleProvinceChange = (selectedProvinceName: string) => {
    //Buscar el objeto Province correspondiente al selectedProvinceId
    const selectedProvince = provincesValues.find(
      p => p.name === selectedProvinceName,
    )
    if (selectedProvince) {
      fetchCityValues(selectedProvince.id)
      form.setValue('province_id', selectedProvince.id)
    }
  }

  const handleCityChange = (selectedCityName: string) => {
    // Buscar el objeto City correspondiente al selectedCityName
    const selectedCity = citiesValues.find(c => c.name === selectedCityName)
    if (selectedCity) {
      form.setValue('city', selectedCity.id)
    }
  }

  const handleIndustryChange = (selectedIndustryType: string) => {
    if (selectedIndustryType !== selectedIndustry?.name) {
      const selectedIndustry: Industry | undefined = industry.find(
        p => p.name === selectedIndustryType,
      )
      if (selectedIndustry) {
        form.setValue('industry', selectedIndustry.name)
        setSelectedIndustry(selectedIndustry)
        console.log('industria: ', selectedIndustry)
      }
    }
  }

  useEffect(() => {
    fetchIndustryType()
  }, [])

  const onSubmit = async (companyData: z.infer<typeof companySchema>) => {
    try {
      //Procesa los valores antes de enviarlos a la base de datos
      const processedCompanyData = {
        ...companyData,
        company_name: processText(companyData.company_name),
        company_cuit: processText(companyData.company_cuit),
        website: processText(companyData.website),
        country: processText(companyData.country),
        province_id: companyData.province_id,
        city: companyData.city,
        contact_email: processText(companyData.contact_email),
        contact_phone: processText(companyData.contact_phone),
        address: processText(companyData.address),
        industry: processText(companyData.industry),
        employees: companyData.employees,
      }

      //Insertar la compañía con los datos procesados
      const company = await insertCompany({
        ...processedCompanyData,
        company_logo: processedCompanyData.company_logo || '',
        owner_id: profile?.[0].id,
      })

      setShowLoader(true)
    } catch (err) {
      console.error('Ocurrió un error:', err)
    } finally {
      setShowLoader(false)
    }
  }

  const processText = (text: string): string | any => {
    if (text === undefined) {
      // Puedes decidir qué hacer aquí si text es undefined.
      // Por ejemplo, podrías devolver una cadena vacía, lanzar un error, etc.
      return ''
    }
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className=" flex flex-wrap gap-8 items-center w-full">
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center">
                <FormLabel>Nombre de la compañia</FormLabel>
                <FormControl>
                  <Input
                    className="max-w-[350px] w-[300px]"
                    placeholder="nombre de la compañia"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Por favor ingresa el nombre de la compañia.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_cuit"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center max-w-[300px]">
                <FormLabel>CUIT de la compañia</FormLabel>
                <FormControl>
                  <Input
                    placeholder="xx-xxxxxxxx-x"
                    className="max-w-[400px] w-[300px]"
                    maxLength={13}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Por favor ingresa el CUIT .</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center">
                <FormLabel>Sitio Web</FormLabel>
                <FormControl>
                  <Input
                    className="max-w-[350px]  w-[300px]"
                    placeholder="sitio web"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Por favor ingresa el sitio web de la compañia.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center ">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    className="max-w-[350px]  w-[300px]"
                    placeholder="email"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Por favor ingresa tu email.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center max-w-[300px]">
                <FormLabel>Número de telefono</FormLabel>
                <FormControl>
                  <Input
                    className="max-w-[350px]  w-[300px]"
                    placeholder="número de telefono"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="max-w-[300px]">
                  Por favor ingresa el número de telefono de la compañia.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    className="max-w-[350px]  w-[300px]"
                    placeholder="dirección"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="max-w-[300px]">
                  Por favor ingresa tu dirección
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center">
                <FormLabel>Seleccione un pais</FormLabel>
                <Select>
                  <SelectTrigger className="max-w-[350px]  w-[300px]">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argentina">Argentina</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="max-w-[300px]">
                  Por favor ingresa tu Pais
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="province_id"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center">
                <FormLabel>Seleccione una provincia</FormLabel>
                <Select onValueChange={handleProvinceChange}>
                  <SelectTrigger className="max-w-[350px]  w-[300px]">
                    <SelectValue placeholder="Selecciona una provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {provincesValues?.map(province => (
                      <SelectItem key={province.id} value={province.name}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="max-w-[300px]">
                  Por favor selecciona tu provincia
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center">
                <FormLabel>Seleccione una ciudad</FormLabel>
                <Select onValueChange={handleCityChange}>
                  <SelectTrigger className="max-w-[350px] w-[300px]">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {citiesValues?.map(city => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="max-w-[300px]">
                  Por favor selecciona tu ciudad
                </FormDescription>
              </FormItem>
            )}
          />
          {/* <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center max-w-[300px]">
                <FormLabel>Industria</FormLabel>
                <FormControl>
                  <Input
                    className="max-w-[350px]  w-[300px]"
                    placeholder="industria"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="max-w-[300px]">
                  Por favor ingresa la Industria de tu compañia
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center max-w-[300px]">
                <FormLabel>Seleccione una Industria</FormLabel>
                <Select onValueChange={handleIndustryChange}>
                  <SelectTrigger className="max-w-[350px] w-[300px]">
                    <SelectValue placeholder="Selecciona una Industria" />
                  </SelectTrigger>
                  <SelectContent>
                    {industry.map(industry => (
                      <SelectItem key={industry.id} value={industry.name}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="max-w-[300px]">
                  Por favor selecciona tu Industria
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_logo"
            render={({ field }) => (
              <FormItem className=" max-w-[600px] flex flex-col justify-center">
                <FormControl>
                  <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                    <UploadImage
                      labelInput="Logo"
                      desciption="Sube el logo de tu compañia"
                      style={{ width: '100px' }}
                      onImageChange={(imageUrl: string) =>
                        form.setValue('company_logo', imageUrl)
                      }
                      onUploadSuccess={onUploadSuccess}
                      inputStyle={{ width: '300px' }}
                    />
                  </div>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    className="max-w-[350px] w-[300px]"
                    placeholder="Descripción de la compañía"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="max-w-[300px]">
                  Por favor ingresa la descripción de la compañia.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="mt-5" disabled={showLoader}>
          {showLoader ? <Loader /> : 'Registrar Compañía'}
        </Button>
      </form>
    </Form>
  )
}
