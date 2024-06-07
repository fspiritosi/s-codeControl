'use client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useLoggedUserStore } from '@/store/loggedUser'
import {
  InfoCircledIcon,
  PlusCircledIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { AnimatePresence, Reorder, motion } from 'framer-motion'
import { ChangeEvent, useState } from 'react'
import { toast } from 'sonner'

enum types {
  Texto = 'Texto',
  AreaTexto = 'Área de texto',
  Separador = 'Separador',
  NombreFormulario = 'Nombre del formulario',
  Radio = 'Radio',
  SeleccionMultiple = 'Seleccion multiple',
  Date = 'Fecha',
  Seleccion = 'Seleccion',
  SeleccionPredefinida = 'Seleccion Predefinida',
  Subtitulo = 'Subtitulo',
  SiNo = 'Si-No',
  Titulo = 'Titulo',
  Seccion = 'Seccion',
}

interface Campo {
  tipo: types
  placeholder?: string
  opciones: string[]
  value?: string
  id: string
  title: string
  observation?: boolean
  date?: boolean
  sectionCampos?: Campo[]
}
export function FormularioPersonalizado({
  campos,
  setCampos,
}: {
  campos: Campo[]
  setCampos: (campos: Campo[]) => void
}) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('')

  const [selectKey, setSelectKey] = useState(0)

  // Actualiza la clave del Select cada vez que se agrega un campo
  const agregarCampo = (campo: Campo, isInSection?: string) => {
    if (isInSection && campo.tipo !== types.Seccion) {
      const newCampos = [...campos]
      const updatedCampo = newCampos.find(campo => campo.id === isInSection)
      updatedCampo?.sectionCampos?.push(campo)
      setCampos(newCampos)
    } else {
      setCampos([...campos, campo])
    }
    setSelectKey(prevKey => prevKey + 1) // Incrementa la clave
  }
  const borrarCampo = (index: number, campo_id?: string) => {
    console.log('index', index)
    if (campo_id !== undefined && index !== undefined) {
      const newCampos = [...campos]
      newCampos
        .find(campo => campo.id === campo_id)
        ?.sectionCampos?.splice(index, 1)
      setCampos(newCampos)
    } else if (index !== 0) {
      // No permitir borrar el primer campo
      setCampos(campos.filter((_, i) => i !== index))
    }
  }
  const handleNewOption = (index: number, sectionIndex: number | undefined) => {
    const newCampos = [...campos]

    if (sectionIndex !== undefined) {
      const sectionCampo = newCampos[sectionIndex]?.sectionCampos?.[index]
      if (sectionCampo) {
        if (!sectionCampo.opciones) {
          sectionCampo.opciones = []
        }
        sectionCampo.opciones.push('')
        setCampos(newCampos)
        return
      }
    }

    // Verificar si el campo tiene ya la propiedad opciones, si no, inicializarla
    if (!newCampos[index].opciones) {
      newCampos[index].opciones = []
    }

    // Agregar una nueva opción al campo
    newCampos[index].opciones.push('')

    setCampos(newCampos)
  }
  const handleOptionsChange = (
    value: string,
    index: number,
    optionIndex: number,
  ) => {
    const newCampos = [...campos]
    if (index === 0) {
      newCampos[index].opciones
    }
    newCampos[optionIndex].opciones?.splice(index, 1, value)
    setCampos(newCampos)
  }

  const handleTitleChange = (
    value: string,
    index: number,
    campo_id?: string,
    option_index?: number,
  ) => {
    if (campo_id && option_index !== undefined) {
      const newCampos = [...campos]
      if (newCampos[option_index]?.sectionCampos?.[index]) {
        const sectionCampo = newCampos[option_index].sectionCampos?.[index]
        if (sectionCampo) {
          if (sectionCampo.title === undefined) {
            sectionCampo.title = 'Titulo del campo'
          }
          sectionCampo.title = value
          setCampos(newCampos)
        }
      }
    } else {
      const newCampos = [...campos]
      if (newCampos[index]) {
        newCampos[index].title = value
        setCampos(newCampos)
      }
    }
  }
  const handleObservationChange = (
    index: number,
    boolean: boolean,
    sectionIndex: number | undefined,
  ) => {
    if (sectionIndex !== undefined) {
      const newCampos = [...campos]
      if (newCampos[sectionIndex]?.sectionCampos?.[index]) {
        const sectionCampo = newCampos?.[sectionIndex].sectionCampos?.[index]
        if (sectionCampo) {
          sectionCampo.observation = boolean
          setCampos(newCampos)
        }
      }
    }

    const newCampos = [...campos]
    if (newCampos[index]) {
      newCampos[index].observation = boolean
      setCampos(newCampos)
    }
  }
  const handleDateChange = (
    index: number,
    boolean: boolean,
    sectionIndex: number | undefined,
  ) => {
    if (sectionIndex !== undefined) {
      const newCampos = [...campos]
      if (newCampos[sectionIndex]?.sectionCampos?.[index]) {
        const sectionCampo = newCampos?.[sectionIndex].sectionCampos?.[index]
        if (sectionCampo) {
          sectionCampo.date = boolean
          setCampos(newCampos)
          return
        }
      }
    }

    const newCampos = [...campos]
    newCampos[index].date = boolean
    setCampos(newCampos)
  }

  const handleOptionDelete = (
    index: number,
    i: number,
    optionIndex: number | undefined,
  ) => {
    if (optionIndex !== undefined && index !== undefined) {
      const newCampos = [...campos]
      newCampos[optionIndex].sectionCampos?.[index].opciones?.splice(i, 1)
      setCampos(newCampos)
    }

    const newCampos = [...campos]
    newCampos[index].opciones?.splice(i, 1)
    setCampos(newCampos)
  }

  const renderizarCampo = (
    campo: Campo,
    index: number,
    campo_id?: string,
    sectionIndex?: number,
  ) => {
    switch (campo.tipo) {
      case 'Texto':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex gap-2 flex-col">
              <Input
                placeholder="Titulo del campo"
                onChange={e =>
                  handleTitleChange(
                    e.target.value,
                    index,
                    campo_id,
                    sectionIndex,
                  )
                }
              />
              <Input
                placeholder={campo.placeholder}
                onChange={e => handleInputChange(e, index, sectionIndex)}
              />
              <Separator className="my-1" />
              <div className="grid grid-cols-2 gap-4">
                <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                  <Label>Observaciones</Label>
                  <Switch
                    checked={campo.observation}
                    onCheckedChange={boolean =>
                      handleObservationChange(index, boolean, sectionIndex)
                    }
                  />
                </Card>
                <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                  <Label>Fecha</Label>
                  <Switch
                    checked={campo.date}
                    onCheckedChange={boolean =>
                      handleDateChange(index, boolean, sectionIndex)
                    }
                  />
                </Card>
              </div>
            </div>
          </div>
        )
      case 'Área de texto':
        return (
          <div className="w-full cursor-grabbing " key={campo.id}>
            <div className="flex gap-2 flex-col">
              <Input
                placeholder="Titulo del campo"
                onChange={e =>
                  handleTitleChange(
                    e.target.value,
                    index,
                    campo_id,
                    sectionIndex,
                  )
                }
              />
              <Textarea
                placeholder={campo.placeholder}
                value={campo.value}
                onChange={e => handleInputChange(e, index, sectionIndex)}
              />
            </div>
            <Separator className="my-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Fecha</Label>
                <Switch
                  checked={campo.date}
                  onCheckedChange={boolean =>
                    handleDateChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
            </div>
          </div>
        )
      case 'Separador':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
          </div>
        )
      case 'Nombre del formulario':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={e => handleInputChange(e, index, sectionIndex)}
              required
            />
          </div>
        )
      case 'Radio':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder="Titulo del campo"
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Fecha</Label>
                <Switch
                  checked={campo.date}
                  onCheckedChange={boolean =>
                    handleDateChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
            </div>
            <div className="flex py-3 items-center gap-2">
              <Label>Opciones</Label>
              <PlusCircledIcon
                onClick={() => handleNewOption(index, sectionIndex)}
                className="size-5 cursor-pointer text-blue-700"
              />
            </div>
            <div className="flex gap-2 flex-col">
              {campo.opciones?.map((opcion, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4"
                >
                  <Input
                    key={i}
                    name={`campo_${index}`}
                    placeholder={`Opcion ${i + 1}`}
                    onChange={e =>
                      handleOptionsChange(e.target.value, i, index)
                    }
                  />

                  <TrashIcon
                    onClick={() => handleOptionDelete(index, i, sectionIndex)}
                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      case 'Seleccion multiple':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder={campo.placeholder}
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Fecha</Label>
                <Switch
                  checked={campo.date}
                  onCheckedChange={boolean =>
                    handleDateChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
            </div>
            <div className="flex py-3 items-center gap-2">
              <Label>Opciones</Label>
              <PlusCircledIcon
                onClick={() => handleNewOption(index, sectionIndex)}
                className="size-5 cursor-pointer text-blue-700"
              />
            </div>
            <div className="flex gap-2 flex-col">
              {campo.opciones?.map((opcion, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4"
                >
                  <Input
                    key={i}
                    name={`option_${index}`}
                    placeholder={`Opcion ${i + 1}`}
                    onChange={e =>
                      handleOptionsChange(e.target.value, i, index)
                    }
                  />

                  <TrashIcon
                    onClick={() => handleOptionDelete(index, i, sectionIndex)}
                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      case 'Fecha':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex gap-2 flex-col">
              <Input
                placeholder="Titulo del campo"
                onChange={e =>
                  handleTitleChange(
                    e.target.value,
                    index,
                    campo_id,
                    sectionIndex,
                  )
                }
              />
              <Input
                disabled
                readOnly
                className="w-full"
                type="date"
                placeholder={campo.placeholder}
                onChange={e => handleInputChange(e, index, sectionIndex)}
              />
            </div>
          </div>
        )
      case 'Seleccion':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder={campo.placeholder}
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Fecha</Label>
                <Switch
                  checked={campo.date}
                  onCheckedChange={boolean =>
                    handleDateChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
            </div>
            <div className="flex py-3 items-center gap-2">
              <Label>Opciones</Label>
              <PlusCircledIcon
                onClick={() => handleNewOption(index, sectionIndex)}
                className="size-5 cursor-pointer text-blue-700"
              />
            </div>
            <div className="flex gap-2 flex-col">
              {campo.opciones?.map((opcion, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4"
                >
                  <Input
                    key={i}
                    name={`select_${index}`}
                    placeholder={`Opcion ${i + 1}`}
                    onChange={e =>
                      handleOptionsChange(e.target.value, i, index)
                    }
                  />

                  <TrashIcon
                    onClick={() => handleOptionDelete(index, i, sectionIndex)}
                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      case 'Seleccion Predefinida':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder="Ingresar titulo"
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Fecha</Label>
                <Switch
                  checked={campo.date}
                  onCheckedChange={boolean =>
                    handleDateChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
            </div>
            <div className="flex gap-2 flex-col py-3">
              <Select
                onValueChange={e => {
                  handleOptionsChange(e, 0, index)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar opciones a mostrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vehiculos">Vehiculos</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                  <SelectItem value="Numero interno">Numero Interno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription className="flex items-center text-blue-600">
              <InfoCircledIcon className="mr-2 size-4" />
              Las opciones solo incluiran los recursos vinculados al cliente
            </CardDescription>
          </div>
        )
      case 'Subtitulo':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder="Ingresar titulo"
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
          </div>
        )
      case 'Si-No':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder="Titulo del campo"
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Fecha</Label>
                <Switch
                  checked={campo.date}
                  onCheckedChange={boolean =>
                    handleDateChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
            </div>
            <div className="flex py-3 items-center gap-2">
              <Label>Opciones</Label>
              <PlusCircledIcon
                onClick={() => handleNewOption(index, sectionIndex)}
                className="size-5 cursor-pointer text-blue-700"
              />
            </div>
            <div className="flex gap-2 flex-col">
              {campo.opciones?.map((opcion, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4"
                >
                  <Input
                    key={i}
                    name={`campo_${index}`}
                    placeholder={`Opcion ${i + 1}`}
                    onChange={e =>
                      handleOptionsChange(e.target.value, i, index)
                    }
                    value={opcion}
                  />

                  <TrashIcon
                    onClick={() => handleOptionDelete(index, i, sectionIndex)}
                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      case 'Titulo':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
          </div>
        )
      case 'Seccion':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:bg-muted/50">
                <Label>Fecha</Label>
                <Switch
                  checked={campo.date}
                  onCheckedChange={boolean =>
                    handleDateChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
            </div>
            <div className="py-2 space-y-2">
              <Label>Agregar campo</Label>
              <Select
                key={selectKey}
                onValueChange={e => manejarSeleccion(e, campo.id)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nuevo Campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Componentes Armados</SelectLabel>
                    <SelectItem value="Si-No">Si / No</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Componentes</SelectLabel>
                    <SelectItem value="Texto">Texto</SelectItem>
                    <SelectItem value="Área de texto">Área de texto</SelectItem>
                    <SelectItem value="Separador">Separador</SelectItem>
                    <SelectItem value="Radio">Radio</SelectItem>
                    <SelectItem value="Seleccion multiple">
                      Seleccion multiple
                    </SelectItem>
                    <SelectItem value="Fecha">Fecha</SelectItem>
                    <SelectItem value="Subtitulo">Subtitulo</SelectItem>
                    <SelectItem value="Seleccion">Seleccion</SelectItem>
                    <SelectItem value="Titulo">Titulo</SelectItem>
                    <SelectItem value="Seleccion Predefinida">
                      Seleccion Predefinida
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 space-y-2">
              <AnimatePresence>
                {campo.sectionCampos?.map((opcion, i) => {
                  return (
                    <motion.div
                      key={opcion.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {opcion.tipo === types.Separador ? (
                        <Card className="p-2">
                          {renderizarCampo(opcion, i, campo.id, index)}
                        </Card>
                      ) : (
                        <Accordion
                          className="w-full bg-muted/40 rounded-lg  dark:border-muted border-2 outline-none overflow-hidden"
                          type="single"
                          collapsible
                        >
                          <AccordionItem value={opcion.id}>
                            <AccordionTrigger className=" dark:border-b-muted pl-2 border">
                              {opcion.tipo !== types.NombreFormulario ? (
                                <div className="flex gap-2">
                                  {opcion.tipo}
                                  <TrashIcon
                                    onClick={() => borrarCampo(i, campo.id)}
                                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                                  />
                                </div>
                              ) : (
                                opcion.tipo
                              )}
                            </AccordionTrigger>
                            <AccordionContent className="border-none p-2 bg-white dark:bg-transparent border-2 dark:border-muted">
                              {renderizarCampo(opcion, i, campo.id, index)}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const manejarSeleccion = (tipo: string, isInSection?: string) => {
    switch (tipo) {
      case 'Texto':
        agregarCampo(
          {
            tipo: types.Texto,
            placeholder: 'Ingresa mensaje de ejemplo',
            id: new Date().getTime().toString(),
            observation: false,
            date: false,
            opciones: [],
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Área de texto':
        agregarCampo(
          {
            tipo: types.AreaTexto,
            placeholder: 'Ingresa descripción',
            id: new Date().getTime().toString(),
            observation: false,
            date: false,
            opciones: [],
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Separador':
        agregarCampo(
          {
            tipo: types.Separador,
            placeholder: 'Ingresa Separador',
            id: new Date().getTime().toString(),
            opciones: [],
            title: '',
          },
          isInSection,
        )
        break
      case 'Radio':
        agregarCampo(
          {
            tipo: types.Radio,
            placeholder: 'Label del grupo de radio',
            id: new Date().getTime().toString(),
            opciones: [],
            observation: false,
            date: false,
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Seleccion multiple':
        agregarCampo(
          {
            tipo: types.SeleccionMultiple,
            placeholder: 'Label del grupo de seleccion multiple',
            id: new Date().getTime().toString(),
            opciones: [],
            observation: false,
            date: false,
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Fecha':
        agregarCampo(
          {
            tipo: types.Date,
            placeholder: 'Ingresa una fecha',
            id: new Date().getTime().toString(),
            opciones: [],
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Seleccion':
        agregarCampo(
          {
            tipo: types.Seleccion,
            placeholder: 'Ingresa una opción',
            id: new Date().getTime().toString(),
            opciones: [],
            observation: false,
            date: false,
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Seleccion Predefinida':
        agregarCampo(
          {
            tipo: types.SeleccionPredefinida,
            placeholder: 'Ingresa una opción',
            id: new Date().getTime().toString(),
            opciones: [],
            observation: false,
            date: false,
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Subtitulo':
        agregarCampo(
          {
            tipo: types.Subtitulo,
            placeholder: 'Ingresa un subtitulo',
            id: new Date().getTime().toString(),
            observation: false,
            date: false,
            opciones: [],
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Si-No':
        agregarCampo(
          {
            tipo: types.SiNo,
            placeholder: 'Ingresa una opción',
            id: new Date().getTime().toString(),
            opciones: ['Si', 'No'],
            observation: false,
            date: false,
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Titulo':
        agregarCampo(
          {
            tipo: types.Titulo,
            placeholder: 'Ingresa un titulo',
            id: new Date().getTime().toString(),
            opciones: [],
            title: 'Titulo del campo',
          },
          isInSection,
        )
        break
      case 'Seccion':
        agregarCampo(
          {
            tipo: types.Seccion,
            placeholder: 'Ingresa el titulo de la seccion',
            id: new Date().getTime().toString(),
            observation: false,
            date: false,
            opciones: [],
            title: 'Titulo de la seccion',
            sectionCampos: [],
          },
          isInSection,
        )
        break
      default:
        break
    }
    setTipoSeleccionado('') // Restablecer el tipo seleccionado después de agregar un campo
  }

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    index: number,
    sectionIndex?: number,
  ) => {
    const newCampos = [...campos]
    if (
      sectionIndex !== undefined &&
      newCampos[sectionIndex]?.sectionCampos?.[index]
    ) {
      const sectionCampo = newCampos[sectionIndex].sectionCampos?.[index]
      if (sectionCampo) {
        sectionCampo.value = event.target.value
        setCampos(newCampos)
      }
    } else {
      newCampos[index].value = event.target.value
      setCampos(newCampos)
    }
  }
  return (
    <ScrollArea className="flex flex-col gap-2 p-4 pt-0 space-y-2  max-h-[68vh]">
      <div>
        <CardTitle className="mb-1 text-lg">
          Edita los campos del formulario
        </CardTitle>
        <CardDescription className="flex items-center mb-4 text-blue-600">
          <InfoCircledIcon className="text-blue-600 mr-2 size-4" />
          Puedes arrastrarlos para ordenarlos!
        </CardDescription>
      </div>
      <form>
        <Reorder.Group
          axis="y"
          className="space-y-2 mb-4 "
          values={campos}
          onReorder={setCampos}
          as="ol"
        >
          <AnimatePresence>
            {campos.map((campo, index) => (
              <Reorder.Item
                key={campo.id}
                value={campo}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {campo.tipo === types.Separador ? (
                  <Card className="p-2">{renderizarCampo(campo, index)}</Card>
                ) : (
                  <Accordion
                    className="w-full bg-muted/50 rounded-lg border-2 dark:border-muted outline-none overflow-hidden"
                    type="single"
                    collapsible
                  >
                    <AccordionItem value={campo.id}>
                      <AccordionTrigger
                        id={
                          campo.tipo === types.NombreFormulario
                            ? 'MissingName'
                            : ''
                        }
                        className=" dark:border-b-muted pl-2 border"
                      >
                        {campo.tipo !== types.NombreFormulario ? (
                          <div className="flex gap-2">
                            {campo.tipo}
                            <TrashIcon
                              onClick={() => borrarCampo(index)}
                              className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                            />
                          </div>
                        ) : (
                          campo.tipo
                        )}
                      </AccordionTrigger>
                      <AccordionContent className="border-none p-2 bg-white dark:bg-muted/10  dark:border-muted border-2">
                        {renderizarCampo(campo, index)}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </form>
      <Select key={selectKey} onValueChange={e => manejarSeleccion(e)}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un tipo de campo" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Componentes Armados</SelectLabel>
            <SelectItem value="Si-No">Si / No</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Componentes</SelectLabel>
            <SelectItem value="Texto">Texto</SelectItem>
            <SelectItem value="Área de texto">Área de texto</SelectItem>
            <SelectItem value="Separador">Separador</SelectItem>
            <SelectItem value="Radio">Radio</SelectItem>
            <SelectItem value="Seccion">Seccion</SelectItem>
            <SelectItem value="Seleccion multiple">
              Seleccion multiple
            </SelectItem>
            <SelectItem value="Fecha">Fecha</SelectItem>
            <SelectItem value="Subtitulo">Subtitulo</SelectItem>
            <SelectItem value="Seleccion">Seleccion</SelectItem>
            <SelectItem value="Titulo">Titulo</SelectItem>
            <SelectItem value="Seleccion Predefinida">
              Seleccion Predefinida
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </ScrollArea>
  )
}