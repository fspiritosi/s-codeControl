'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useLoggedUserStore } from '@/store/loggedUser'
import { Campo, FormField, types } from '@/types/types'
import { Dispatch, SetStateAction, useState } from 'react'
import { toast } from 'sonner'
import FieldRenderer from '../formUtils/fieldRenderer'
import { buildFormData } from '../formUtils/formUtils'

interface FormDisplayProps {
  campos: Campo[]
  selectedForm?: Campo[] | undefined
  setSelectedTab: Dispatch<SetStateAction<'created' | 'new'>>
  setCampos: Dispatch<SetStateAction<Campo[]>>
  fetchForms: () => void
}

export function FormDisplay({
  campos,
  selectedForm,
  setSelectedTab,
  setCampos,
  fetchForms,
}: FormDisplayProps) {
  const supabase = supabaseBrowser()
  const vehicles = useLoggedUserStore(state => state.vehicles)

  const renderizarCampo = (campo: Campo, index: number) => {
    switch (campo.tipo) {
      case 'Nombre del formulario':
        return (
          <div className="w-full my-5" key={index}>
            <Label>
              <Badge className="text-xl">
                {' '}
                {campo.value ?? 'Nombre del formulario'}
              </Badge>
            </Label>
          </div>
        )
      case 'Texto':
        return (
          <div className="col-span-3" key={index}>
            <CardDescription className="mb-2">
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <Input placeholder={campo.value} />
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        )
      case 'Área de texto':
        return (
          <div className="col-span-3" key={index}>
            <CardDescription className="mb-2">
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <Textarea placeholder={campo.value} />
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        )
      case 'Separador':
        return (
          <div className="col-span-3 w-full px-[20%]" key={index}>
            <Separator>{campo.value}</Separator>
          </div>
        )
      case 'Radio':
        return (
          <div className="w-full" key={index}>
            <CardDescription className="mb-2">
              {' '}
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <RadioGroup className="flex gap-2 flex-col mt-2">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center space-x-2 ">
                  <RadioGroupItem value={String(i)} id={String(i)} />
                  <Label htmlFor={String(i)}>
                    {opcion ? opcion : `Opcion ${i + 1}`}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        )
      case 'Seleccion multiple':
        return (
          <div className="w-full" key={index}>
            <CardDescription className="mb-2">
              {' '}
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <ToggleGroup
              type="multiple"
              className="flex w-full justify-start flex-wrap"
            >
              {campo.opciones?.map((opcion, i) => {
                return (
                  <ToggleGroupItem
                    className="flex self-start border-muted-foreground border"
                    key={i}
                    value={opcion}
                  >
                    {opcion}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        )
      case 'Fecha':
        return (
          <div className="w-full" key={index}>
            <CardDescription className="mb-2">
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <Input
              type="date"
              value={campo.value}
              placeholder={campo.placeholder}
            />
          </div>
        )
      case 'Seleccion':
        return (
          <div className="col-span-2" key={index}>
            <CardDescription className="mb-2">
              {' '}
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {campo.opciones?.map((opcion, i) => {
                  return (
                    <SelectItem key={i} value={opcion || `Opcion ${i + 1}`}>
                      {opcion || `Opcion ${i + 1}`}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        )
      case 'Seleccion Predefinida':
        return (
          <div className="w-full" key={index}>
            <CardDescription className="mb-2">
              {' '}
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar opcion" />
              </SelectTrigger>
              <SelectContent>
                {campo.opciones?.map((opcion, i) => {
                  if (opcion === 'Vehiculos') {
                    return (
                      <SelectGroup key={i}>
                        <SelectLabel>Dominios</SelectLabel>

                        {vehicles
                          ?.filter(e => e.domain)
                          ?.map(e => {
                            return (
                              <SelectItem key={e.domain} value={e.domain}>
                                {e.domain}
                              </SelectItem>
                            )
                          })}
                      </SelectGroup>
                    )
                  }
                  if (opcion === 'Otros') {
                    return (
                      <SelectGroup key={i}>
                        <SelectLabel>Numero de serie</SelectLabel>
                        {vehicles
                          .filter(e => e.serie)
                          .map(e => {
                            return (
                              <SelectItem key={e.serie} value={e.serie}>
                                {e.serie}
                              </SelectItem>
                            )
                          })}
                      </SelectGroup>
                    )
                  }
                  if (opcion === 'Numero interno') {
                    return (
                      <SelectGroup key={i}>
                        <SelectLabel>Numero interno</SelectLabel>
                        {vehicles
                          .filter(e => e.intern_number)
                          .map(e => {
                            return (
                              <SelectItem
                                key={e.intern_number}
                                value={e.intern_number}
                              >
                                {e.intern_number}
                              </SelectItem>
                            )
                          })}
                      </SelectGroup>
                    )
                  }
                })}
              </SelectContent>
            </Select>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
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
      case 'Si-No':
        return (
          <div className="w-full" key={index}>
            <CardDescription className="mb-2">
              {' '}
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <RadioGroup className="flex gap-2  mt-2">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center space-x-2 ">
                  <RadioGroupItem value={String(i)} id={String(i)} />
                  <Label htmlFor={String(i)}>
                    {opcion ? opcion : `Opcion ${i + 1}`}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
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
      case 'Seccion':
        return (
          <div className="w-full" key={index}>
            <CardTitle className="mb-2 mt-1 text-xl">
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardTitle>
            <div className="grid grid-cols-3 gap-y-4 gap-x-4">
              {campo.sectionCampos?.map((opcion, i) => {
                return (
                  // <div key={i} className='grid bg-blue-500'>
                  renderizarCampo(opcion, i)
                  // </div>
                )
              })}
            </div>

            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
            <Separator className="my-2" />
          </div>
        )
      case 'Archivo':
        return (
          <div className="w-full" key={index}>
            <CardDescription className="mb-2">
              {' '}
              {campo.title ? campo.title : 'Titulo del campo'}
            </CardDescription>
            <Input type="file" />
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }
  const actualCompany = useLoggedUserStore(state => state.actualCompany)

  const handleCreateCheckList = async () => {
    toast.promise(
      async () => {
        setDisabled(true)

        if (!campos.find(e => e.tipo === types.NombreFormulario)?.value) {
          document
            .getElementById('MissingName')
            ?.style.setProperty('color', 'red')
          setDisabled(false)

          throw new Error('El formulario debe tener un nombre')
        } else {
          document
            .getElementById('MissingName')
            ?.style.setProperty('color', 'black')
        }
        const { data, error } = await supabase.from('custom_form').insert({
          company_id: actualCompany?.id,
          form: campos,
          name: campos.find(e => e.tipo === types.NombreFormulario)?.value,
        })

        if (error) {
          throw new Error(error.message)
        } else {
          fetchForms()
          setSelectedTab('created')
          setCampos([
            {
              tipo: types.NombreFormulario,
              placeholder: 'Ingresa el nombre del formulario',
              id: '1',
              title: 'Nombre del formulario',
              opciones: [],
            },
          ])
        }
      },
      {
        loading: 'Creando formulario...',
        success: 'Formulario creado exitosamente',
        error: (error: string) => `Error al crear el formulario: ${error}`,
        finally: () => setDisabled(false),
      },
    )
  }
  const [disabled, setDisabled] = useState(false)

  const formObject = campos.length ? buildFormData(campos, true) : []
  return (
    <ScrollArea className="h-screen px-8 py-5 overflow-auto  rounded-e-xl rounded max-h-[85vh]">
      <div className="flex justify-between items-center">
        <CardTitle className="text-2xl font-bold">
          Vista previa del formulario
        </CardTitle>
        <Avatar>
          <AvatarImage
            src={actualCompany?.company_logo ?? ''}
            alt="Logo de la empresa"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-3">
        {selectedForm ? (
          <div className="grid grid-cols-3 gap-y-4 gap-x-4">
            {formObject?.map((campo: FormField, index: number) => (
              <FieldRenderer
                key={index}
                campo={campo}
                form={null}
                index={index}
                completObjet={formObject}
              />
            ))}
          </div>
        ) : (
          campos.map((campo, index) => (
            <div key={index}>{renderizarCampo(campo, index)}</div>
          ))
        )}
        <div className="flex w-full">
          {!selectedForm ? (
            <Button
              disabled={campos.length < 2 || disabled}
              onClick={handleCreateCheckList}
            >
              Crear checkList
            </Button>
          ) : (
            <Button
              onClick={() => toast.message('Proximamente!')}
              className="ml-auto mt-2"
            >
              Editar formulario
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}