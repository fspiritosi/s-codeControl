'use client'
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
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import {
  InfoCircledIcon,
  PlusCircledIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { AnimatePresence, Reorder, motion } from 'framer-motion'
import { ChangeEvent, useState } from 'react'

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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
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
                <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <Label>Observaciones</Label>
                  <Switch
                    checked={campo.observation}
                    onCheckedChange={boolean =>
                      handleObservationChange(index, boolean, sectionIndex)
                    }
                  />
                </Card>
                <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
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
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
            <Label>{campo.tipo}</Label>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={e => handleInputChange(e, index, sectionIndex)}
            />
          </div>
        )
      case 'Radio':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder="Titulo del campo"
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder={campo.placeholder}
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder={campo.placeholder}
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder="Ingresar titulo"
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder="Titulo del campo"
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <CardTitle>{campo.tipo}</CardTitle>
              <TrashIcon
                onClick={() => borrarCampo(index, campo_id)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={e =>
                handleTitleChange(e.target.value, index, campo_id, sectionIndex)
              }
            />
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label>Observaciones</Label>
                <Switch
                  checked={campo.observation}
                  onCheckedChange={boolean =>
                    handleObservationChange(index, boolean, sectionIndex)
                  }
                />
              </Card>
              <Card className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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

            <div className="mt-4">
              <AnimatePresence>
                {campo.sectionCampos?.map((opcion, i) => {
                  return (
                    <motion.div
                      key={opcion.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {renderizarCampo(opcion, i, campo.id, index)}
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
                <Card
                  className={cn(
                    'flex p-2 ',
                    campo.tipo === 'Seccion' ? 'bg-muted/30' : '',
                  )}
                >
                  {renderizarCampo(campo, index)}
                </Card>
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

interface FormDisplayProps {
  campos: Campo[]
}

export function FormDisplay({ campos }: FormDisplayProps) {
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
          <div className="w-full" key={index}>
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
          <div className="w-full" key={index}>
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
          <div className="w-full my-2" key={index}>
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
          <div className="w-full" key={index}>
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
                          .filter(e => e.domain)
                          .map(e => {
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
          <div className="w-full" key={index}>
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
          <div className="w-full" key={index}>
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
            {campo.sectionCampos?.map((opcion, i) => {
              return (
                <div key={i} className="w-full">
                  {renderizarCampo(opcion, i)}
                </div>
              )
            })}
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
      default:
        return null
    }
  }
  const actualCompany = useLoggedUserStore(state => state.actualCompany)

  return (
    <ScrollArea className="h-screen px-8 py-5 overflow-auto  rounded-e-xl rounded ">
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
        {campos.map((campo, index) => (
          <div key={index}>{renderizarCampo(campo, index)}</div>
        ))}
        <Button  disabled={campos.length < 2}>Crear checkList</Button>
      </div>
    </ScrollArea>
  )
}
