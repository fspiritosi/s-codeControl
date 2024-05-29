'use client'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TrashIcon } from '@radix-ui/react-icons'
import { Reorder } from 'framer-motion'
import { useState } from 'react'

enum types {
  Texto = 'Texto',
  AreaTexto = 'Área de texto',
  Etiqueta = 'Etiqueta',
  NombreFormulario = 'Nombre del formulario'
}

interface Campo {
  tipo: types
  placeholder?: string
  opciones?: string[]
  value?: string
  id: string
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
  const agregarCampo = (campo: Campo) => {
    setCampos([...campos, campo])
    setSelectKey(prevKey => prevKey + 1) // Incrementa la clave
  }
  const borrarCampo = (index: number) => {
    if (index !== 0) {
      // No permitir borrar el primer campo
      setCampos(campos.filter((_, i) => i !== index))
    }
  }
  const renderizarCampo = (campo: Campo, index: number) => {
    switch (campo.tipo) {
      case 'Texto':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={handleInputChange(index)}
            />
          </div>
        )
      case 'Área de texto':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Textarea
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={handleInputChange(index)}
            />
          </div>
        )
      case 'Etiqueta':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={handleInputChange(index)}
            />
          </div>
        )
      case 'Nombre del formulario':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Label>{campo.tipo}</Label>
            <Input
              placeholder={campo.placeholder}
              value={campo.value}
              onChange={handleInputChange(index)}
            />
          </div>
        )
      // Agrega aquí más casos para otros tipos de campos
      default:
        return null
    }
  }

  const manejarSeleccion = (tipo: string) => {
    switch (tipo) {
      case 'Texto':
        agregarCampo({
          tipo: types.Texto,
          placeholder: 'Ingresa texto',
          id: new Date().getTime().toString(),
        })
        break
      case 'Área de texto':
        agregarCampo({
          tipo:  types.AreaTexto,
          placeholder: 'Ingresa descripción',
          id: new Date().getTime().toString(),
        })
        break
      case 'Etiqueta':
        agregarCampo({
          tipo:  types.Etiqueta,
          placeholder: 'Ingresa etiqueta',
          id: new Date().getTime().toString(),
        })
        break
      default:
        break
    }
    setTipoSeleccionado('') // Restablecer el tipo seleccionado después de agregar un campo
  }

  const handleInputChange =
    (index: number) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newCampos = [...campos]
      newCampos[index].value = event.target.value
      setCampos(newCampos)
    }
  return (
    <ScrollArea className="flex flex-col gap-2 p-4 pt-0 space-y-2 mb-4 max-h-[68vh]">
      <p>Edita los campos del formulario</p>
      <form>
        <Reorder.Group
          axis="y"
          className="space-y-2 mb-4"
          values={campos}
          onReorder={setCampos}
        >
          {campos.map((campo, index) => (
            <Reorder.Item key={campo.id} value={campo}>
              <Card className="flex p-2">{renderizarCampo(campo, index)}</Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </form>
      <Select key={selectKey} onValueChange={e => manejarSeleccion(e)}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un tipo de campo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Texto">Texto</SelectItem>
          <SelectItem value="Área de texto">Área de texto</SelectItem>
          <SelectItem value="Etiqueta">Etiqueta</SelectItem>
        </SelectContent>
      </Select>
    </ScrollArea>
  )
}

interface MailDisplayProps {
  campos: Campo[]
}

export function FormDisplay({ campos }: MailDisplayProps) {
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
            <Input
              readOnly
              disabled
              value={campo.value}
              placeholder={campo.placeholder}
            />
          </div>
        )
      case 'Área de texto':
        return (
          <div className="w-full" key={index}>
            <Textarea
              readOnly
              disabled
              value={campo.value}
              placeholder={campo.placeholder}
            />
          </div>
        )
      case 'Etiqueta':
        return (
          <div className="w-full my-2" key={index}>
            <CardDescription>{campo.value}</CardDescription>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ScrollArea className="h-screen px-8 my-5 overflow-auto">
      <CardTitle className="text-xl font-bold">
        Preview del formulario
      </CardTitle>
      {/* <CardDescription>
        Crear un nuevo CheckList para el mantenimiento de los equipos.
      </CardDescription> */}
      <div>
        {campos.map((campo, index) => (
          <div key={index}>{renderizarCampo(campo, index)}</div>
        ))}
      </div>
    </ScrollArea>
  )
}
