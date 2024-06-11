'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useLoggedUserStore } from '@/store/loggedUser'
import { Campo } from '@/types/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { UseFormReturn, useForm } from 'react-hook-form'
import { z } from 'zod'

interface Props {
  campos: any[] | null
}

interface FormField {
  formName: string
  title: string
  value: string
  tipo: string
  opciones?: string[]
  date?: boolean
  id: string
  placeholder: string
  Observaciones?: boolean
}

export function SubmitCustomForm({ campos }: Props) {
  const supabase = supabaseBrowser()
  const vehicles = useLoggedUserStore(state => state.vehicles)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)

  console.log(campos)

  const buildFormData = (campos: any[] | null): FormField[] => {
    const formArray: FormField[] = []
    console.log('campos recibidos:', campos)
    formArray.push({
      formName: 'Nombre del formulario',
      title: 'Nombre del formulario',
      value: campos?.[0].name,
      tipo: 'Nombre del formulario',
      id: '',
      placeholder: '',
    })

    if (campos && campos.length > 0 && campos[0]?.form) {
      campos[0].form.forEach((campo: any) => {
        console.log('campo actual:', campo)

        if (campo.tipo === 'Seccion') {
          campo.sectionCampos.forEach((sectionCampo: any) => {
            console.log(sectionCampo)
            formArray.push({
              formName: `${sectionCampo.title.replace(/ /g, '_')}`,
              title: sectionCampo.title,
              value: sectionCampo.value || '',
              tipo: sectionCampo.tipo,
              opciones: sectionCampo.opciones || [],
              id: sectionCampo.id,
              placeholder: sectionCampo.placeholder,
              date: sectionCampo.date,
              Observaciones: sectionCampo.observation,
            })

            if (sectionCampo.observation) {
              formArray.push({
                formName: `${sectionCampo.title.replace(
                  / /g,
                  '_',
                )}_observaciones`,
                title: `Observacion (${sectionCampo.title}) `,
                value: '',
                tipo: 'Observaciones',
                id: sectionCampo.id,
                placeholder: sectionCampo.placeholder,
              })
            }
            if (sectionCampo.date) {
              formArray.push({
                formName: `${sectionCampo.title.replace(/ /g, '_')}_fecha`,
                title: `Fecha (${sectionCampo.title}) `,
                value: '',
                tipo: 'Fecha',
                id: sectionCampo.id,
                placeholder: sectionCampo.placeholder,
              })
            }
          })

          if (campo.date) {
            formArray.push({
              formName: `${campo.title.replace(/ /g, '_')}_fecha`,
              title: `Fecha (${campo.title}) `,
              value: '',
              tipo: 'Fecha',
              id: campo.id,
              placeholder: campo.placeholder,
            })
          }

          if (campo.observation) {
            formArray.push({
              formName: `${campo.title.replace(/ /g, '_')}_observaciones`,
              title: `Observacion (${campo.title}) `,
              value: '',
              tipo: 'Observaciones',
              id: campo.id,
              placeholder: campo.placeholder,
            })
          }
          formArray.push({
            formName: `fin_seccion_${campo.title.replace(/ /g, '_')}`,
            title: '',
            value: '',
            tipo: 'Separador',
            id: '',
            placeholder: '',
          })
        }
      })
    }

    return formArray
  }

  console.log(campos)

  const formObject = buildFormData(campos)
  console.log(formObject)

  const buildFormSchema = (formObject: any[]) => {
    const formSchema: { [key: string]: any } = {}

    formObject.forEach(campo => {
      const formattedTitle = campo.title.replace(/ /g, '_')
      const displayTitle = campo.title.replace(/_/g, ' ')
      switch (campo.tipo) {
        case 'Si-No':
          formSchema[formattedTitle] = z.enum(campo.opciones, {
            required_error: `El campo "${displayTitle}" es obligatorio`,
            invalid_type_error: `El valor ingresado en "${displayTitle}" no es válido`,
          })
          break
        case 'Texto':
          formSchema[formattedTitle] = z
            .string({
              required_error: `El campo "${displayTitle}" es obligatorio`,
            })
            .min(1, `El campo "${displayTitle}" no puede estar vacío`)
          break
        case 'Área de texto':
          formSchema[formattedTitle] = z
            .string({
              required_error: `El campo "${displayTitle}" es obligatorio`,
            })
            .min(1, `El campo "${displayTitle}" no puede estar vacío`)
          break
        case 'Radio':
          formSchema[formattedTitle] = z.enum(campo.opciones, {
            required_error: `El campo "${displayTitle}" es obligatorio`,
            invalid_type_error: `El valor ingresado en "${displayTitle}" no es válido`,
          })
          break
        case 'Seleccion multiple':
          formSchema[formattedTitle] = z
            .array(
              z.string({
                required_error: `El campo "${displayTitle}" es obligatorio`,
              }),
              {
                required_error: `El campo "${displayTitle}" es obligatorio`,
              },
            )
            .min(1, `El campo "${displayTitle}" no puede estar vacío`)
          break
        case 'Fecha':
          formSchema[formattedTitle] = z.string({
            required_error: `El campo "${displayTitle}" es obligatorio`,
          })
          break
        case 'Seleccion':
          formSchema[formattedTitle] = z.string({
            required_error: `Por favor, selecciona una opción para el campo "${displayTitle}"`,
          })
          break
        case 'Seleccion Predefinida':
          formSchema[formattedTitle] = z.string({
            required_error: `Por favor, selecciona una opción para el campo "${displayTitle}"`,
          })
          break
        case 'Observaciones':
          formSchema[`${formattedTitle}`] = z
            .string()
            .min(
              1,
              `El campo "${displayTitle} - Observaciones" no puede estar vacío`,
            )
        default:
          break
      }
    })

    const finalFormSchema = z.object(formSchema)
    return finalFormSchema
  }

  const FormSchema = buildFormSchema(formObject)
  console.log(FormSchema.shape)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  console.log(form.formState.errors)

  const renderizarCampo = (
    campo: Campo,
    index: number,
    form: UseFormReturn<any>,
  ) => {
    console.log(campo)
    switch (campo.tipo) {
      case 'Seccion':
        return (
          <div key={index}>
            <CardTitle className="mb-2 mt-1 text-xl">{campo.title}</CardTitle>
            {campo.sectionCampos?.map((sectionCampo, sectionIndex) => {
              return (
                <>
                  {sectionCampo.tipo === 'Separador' ? (
                    <div
                      className="col-span-3 w-full px-[20%] bg-red-400"
                      key={sectionIndex}
                    >
                      <Separator>{sectionCampo.value}</Separator>
                    </div>
                  ) : sectionCampo.tipo === 'Titulo' ||
                    sectionCampo.tipo === 'Subtitulo' ? (
                    <div className="col-span-3" key={sectionIndex}>
                      {renderizarCampo(sectionCampo, sectionIndex, form)}
                    </div>
                  ) : (
                    <div key={sectionIndex} className="">
                      {renderizarCampo(sectionCampo, sectionIndex, form)}
                    </div>
                  )}
                </>
              )
            })}

            <div className="col-span-3 w-full">
              <Separator />
            </div>
          </div>
        )
      case 'Si-No':
        return (
          <div className="col-span-1" key={index}>
            <FormField
              key={index}
              control={form.control}
              name={campo.formName!}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{campo.title}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {campo.opciones?.map((opcion, i) => (
                        <FormItem
                          key={i}
                          className="flex items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={opcion} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {opcion}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )
      case 'Texto':
        return (
          <div className="col-span-1" key={index}>
            <FormField
              key={index}
              control={form.control}
              name={campo.formName!}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{campo.title}</FormLabel>
                  <FormControl>
                    <Input placeholder={campo.value} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )
      case 'Área de texto':
        return (
          <div className="col-span-1" key={index}>
            <FormField
              key={index}
              control={form.control}
              name={campo.formName!}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{campo.title}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={campo.value} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )
      case 'Radio':
        return (
          <FormField
            key={index}
            control={form.control}
            name={campo.formName!}
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{campo.title}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    {campo.opciones?.map((opcion, i) => (
                      <FormItem
                        key={i}
                        className="flex items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem value={opcion} />
                        </FormControl>
                        <FormLabel className="font-normal">{opcion}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case 'Seleccion multiple':
        return (
          <FormField
            key={index}
            control={form.control}
            name={campo.formName!}
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{campo.title}</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="multiple"
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex w-full justify-start flex-wrap"
                  >
                    {campo.opciones?.map((opcion, i) => (
                      <ToggleGroupItem
                        key={i}
                        value={opcion}
                        className="flex self-start border-muted-foreground border"
                      >
                        {opcion}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case 'Fecha':
        console.log(campo)
        return (
          <FormField
            key={index}
            control={form.control}
            name={campo.formName!}
            render={({ field }) => {
              console.log(campo)
              return (
                <FormItem className="space-y-3">
                  <FormLabel>{campo.title}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value)?.toISOString().split('T')[0]
                          : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )
      case 'Seleccion':
        return (
          <FormField
            key={index}
            control={form.control}
            name={campo.formName!}
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{campo.title}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {campo.opciones?.map((opcion, i) => (
                        <SelectItem key={i} value={opcion}>
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case 'Seleccion Predefinida':
        console.log(campo)
        return (
          <div className="col-span-1" key={index}>
            <FormItem className="space-y-3">
              <FormLabel>{campo.title}</FormLabel>
              <FormField
                key={index}
                control={form.control}
                name={campo.formName!}
                render={({ field }) => (
                  <FormControl>
                    <>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {campo.opciones?.map((opcion, i) => (
                            <SelectItem key={i} value={opcion}>
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </>
                  </FormControl>
                )}
              />
            </FormItem>
          </div>
        )
      case 'Nombre del formulario':
        return (
          <div className="my-5 col-span-3" key={index}>
            <Label>
              <Badge className="text-xl">
                {' '}
                {campo.value ?? 'Nombre del formulario'}
              </Badge>
            </Label>
          </div>
        )
      case 'Titulo':
        return (
          <div className="col-span-3" key={index}>
            <CardTitle className="mb-2 mt-1 text-xl">
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardTitle>
          </div>
        )
      case 'Subtitulo':
        return (
          <div className="col-span-3" key={index}>
            <CardTitle className="mb-2 mt-1">
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardTitle>
          </div>
        )
      case 'Separador':
        return (
          <div className="col-span-3 w-full px-[20%]" key={index}>
            <Separator>{campo.value}</Separator>
          </div>
        )
      case 'Observaciones':
        return (
          <div className="col-span-1" key={index}>
            <FormField
              key={index}
              control={form.control}
              name={campo.formName!}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{campo.title}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={`${campo.tipo}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )
      default:
        return null
    }
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log('data', data)
  }

  return (
    <div className=" px-8 py-5  rounded-e-xl rounded">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="w-full space-y-6 grid grid-cols-3">
            {formObject?.map((campo: any, index: number) =>
              renderizarCampo(campo, index, form),
            )}
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  )
}
