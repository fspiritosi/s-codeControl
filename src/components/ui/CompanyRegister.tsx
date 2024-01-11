'use client'
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
import { Textarea } from '@/components/ui/textarea'

import { useCompanyData } from '@/hooks/useCompanyData'
import { companySchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

export function CompanyRegister() {
  const { insertCompany } = useCompanyData()

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
      city: '',
      country: '',
      industry: '',
      company_logo: '',
    },
  })

  const onSubmit = async (companyData: any) => {
    try {
      const company = await insertCompany(companyData)
    } catch (err) {
      console.error('Ocurrió un error:', err)
    }
  }

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
          name="company_cuit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CUIT de la compañia</FormLabel>
              <FormControl>
                <Input
                  placeholder="CUIT de la compañia"
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
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <FormControl>
                <Input placeholder="ciudad" {...field} />
              </FormControl>
              <FormDescription>
                Por favor ingresa la ciudad de tu compañia
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pais</FormLabel>
              <FormControl>
                <Input placeholder="Pais" {...field} />
              </FormControl>
              <FormDescription>
                Por favor ingresa el Pais de tu compañia
              </FormDescription>
              <FormMessage />
            </FormItem>
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
                <Input placeholder="logo" {...field} />
              </FormControl>
              <FormDescription>
                Por favor ingresa el logo de tu compañia
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Registrar Compañía</Button>
      </form>
    </Form>
  )
}
