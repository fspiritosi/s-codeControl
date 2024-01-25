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
import { companySchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader } from './svg/loader'

export function CompanyRegister() {
  const { insertCompany, fetchProvinces, fetchCities, provinces, cities } =
  useCompanyData()
const [selectedCities, setSelectedCities] = useState<any[]>([])
const [selectedProvince, setSelectedProvince] = useState<Province | null>(
  null,)
  const [showLoader, setShowLoader] = useState(false)

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
    city_name: string
    province_id: number
  }

  const handleProvinceChange = (selectedProvinceName: string) => {
    //Buscar el objeto Province correspondiente al selectedProvinceId
    const selectedProvince: Province | undefined = provinces.find(
      p => p.name === selectedProvinceName,
    )
    if (selectedProvince) {
      form.setValue('province_id', selectedProvince.id)
      setSelectedProvince(selectedProvince)
    }
  }

  const handleCityChange = (selectedCityName: string) => {
    // Buscar el objeto City correspondiente al selectedCityName
    const selectedCity: City | undefined = cities.find(
      c => c.city_name === selectedCityName,
    )
    if (selectedCity) {
      form.setValue('city', selectedCity.id)
      setSelectedCities([selectedCity])
      console.log(selectedCity.id, selectedCity.city_name)
    }
  }

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
      const company = await insertCompany(processedCompanyData)
      //const company = await insertCompany(companyData)
      console.log('Resultado de la inserción:', company)
      setShowLoader(true)
    } catch (err) {
      console.error('Ocurrió un error:', err)
    } finally {
      setShowLoader(false)
    }
  }

  useEffect(() => {
    fetchProvinces()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    console.log('Valor de selectedProvince:', selectedProvince)
    if (selectedProvince) {
      fetchCities(selectedProvince.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince])

  const processText = (text: string): string =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la compañia</FormLabel>
              <FormControl>
                <Input placeholder="nombre de la compañia" {...field} />
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
            <FormItem>
              <FormLabel>CUIT de la compañia</FormLabel>
              <FormControl>
                <Input
                  placeholder="CUIT de la compañia xx-xxxxxxxx-x"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción de la compañía" {...field} />
              </FormControl>
              <FormDescription>
                Por favor ingresa la descripción de la compañia.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sitio Web</FormLabel>
              <FormControl>
                <Input placeholder="sitio web" {...field} />
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
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email" autoComplete="email" {...field} />
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
            <FormItem>
              <FormLabel>Número de telefono</FormLabel>
              <FormControl>
                <Input placeholder="número de telefono" {...field} />
              </FormControl>
              <FormDescription>
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
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="dirección" {...field} />
              </FormControl>
              <FormDescription>Por favor ingresa tu dirección</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* <FormField
          control={form.control}
          name="country"
          render={({ field }) => ( */}
        <Select>
          <SelectTrigger className="">
            <SelectValue placeholder="Selecciona un país" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="argentina">Argentina</SelectItem>
          </SelectContent>
        </Select>
        {/* )}
        /> */}
        <FormField
          control={form.control}
          name="province_id"
          render={({ field }) => (
            <Select onValueChange={handleProvinceChange}>
              <SelectTrigger className="">
                <SelectValue placeholder="Selecciona una provincia" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map(province => (
                  <SelectItem key={province.id} value={province.name}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <Select onValueChange={handleCityChange}>
              <SelectTrigger className="">
                <SelectValue placeholder="Selecciona una ciudad" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city.id} value={city.city_name}>
                    {city.city_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industria</FormLabel>
              <FormControl>
                <Input placeholder="industria" {...field} />
              </FormControl>
              <FormDescription>
                Por favor ingresa la Industria de tu compañia
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <UploadImage
                  onImageChange={(imageUrl: string) =>
                    form.setValue('company_logo', imageUrl)
                  }
                  onUploadSuccess={onUploadSuccess}
                />
              </FormControl>
              <FormDescription>
                Por favor ingresa el logo de tu compañia
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={showLoader}>
          {showLoader ? <Loader /> : 'Registrar Compañía'}
        </Button>
      </form>
    </Form>
  )
}

