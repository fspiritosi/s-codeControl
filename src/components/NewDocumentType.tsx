'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
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
import { toast } from '@/components/ui/use-toast'
import { handleSupabaseError } from '@/lib/errorHandler'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '../../supabase/supabase'

export default function NewDocumentType() {
  const [special, setSpecial] = useState(false)
  const router = useRouter()

  const FormSchema = z.object({
    name: z
      .string({ required_error: 'Este campo es requerido' })
      .min(3, { message: 'El nombre debe contener mas de 3 caracteres' })
      .max(50, { message: 'El nombre debe contener menos de 50 caracteres' }),
    applies: z.enum(['Persona', 'Equipos'], {
      required_error: 'Este campo es requerido',
    }),
    multiresource: z.boolean({
      required_error: 'Se debe seleccionar una opcion',
    }),
    mandatory: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    explired: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    special: z.boolean({ required_error: 'Este campo es requerido' }),
    description: special
      ? z.string({ required_error: 'Este campo es requerido' })
      : z.string().optional(),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      multiresource: undefined,
      mandatory: undefined,
      explired: undefined,
      special: undefined,
    },
  })

  const items = [
    { id: 'multiresource', label: 'Es multirecurso?' },
    { id: 'mandatory', label: 'Es mandatorio?' },
    { id: 'explired', label: 'Expira?' },
    { id: 'special', label: 'Es especial?' },
  ]

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const formattedValues = {
      ...values,
      name: formatName(values.name),
      description: formatDescription(values.description),
    };

    const { data, error } = await supabase
      .from('document_types')
      .insert(formattedValues)
      .select();

    if (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: handleSupabaseError(error),
      });
      return;
    }
    toast({
      title: 'Documento creado con exito',
      variant: 'default',
    });
    router.push('/auditor');
  }

  function formatName(name: string): string {
    // Capitalize first letter and convert the rest to lowercase
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  function formatDescription(description: string | undefined): string | undefined {
    if (description) {
      // Capitalize first letter and convert the rest to lowercase
      return description.charAt(0).toUpperCase() + description.slice(1).toLowerCase();
    }
    return description;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full rounded-md border p-4 shadow"
                  placeholder="Nombre del documento"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="applies"
          render={({ field }) => (
            <FormItem>
              <div>
                <FormLabel>Aplica a</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Personas o Equipos" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Persona">Persona</SelectItem>
                    <SelectItem value="Equipos">Equipos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 grid-cols-1 gap-6 items-stretch justify-between">
          {items.map(item => (
            <FormField
              key={item.id}
              control={form.control}
              name={
                item.id as
                  | 'name'
                  | 'applies'
                  | 'multiresource'
                  | 'mandatory'
                  | 'explired'
                  | 'special'
              }
              render={({ field }) => (
                <FormItem>
                  <div className="">
                    <FormLabel>{item.label}</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-x-2">
                        <div className="flex gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={value => {
                                field.onChange(value ? true : false)
                                if (item.id === 'special') {
                                  setSpecial(true)
                                }
                              }}
                            />
                            <span>Sí</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={field.value === false}
                              onCheckedChange={value => {
                                field.onChange(value ? false : true)
                                if (item.id === 'special') {
                                  setSpecial(false)
                                }
                              }}
                            />
                            <span>No</span>
                          </div>
                        </div>
                        <FormMessage />
                      </div>
                    </FormControl>
                    <div className="space-y-1 leading-none"></div>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
        {special && (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div>
                  <FormLabel>Documentacion Especial</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar documento especial" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Maneja">Maneja</SelectItem>
                      <SelectItem value="Habilitacion especial">
                        Habilitacion especial
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit">Crear tipo de documento</Button>
      </form>
    </Form>
  )
}
