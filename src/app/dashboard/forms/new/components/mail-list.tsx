'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useLoggedUserStore } from '@/store/loggedUser';
import { InfoCircledIcon, PlusCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import { Reorder } from 'framer-motion';
import { useState } from 'react';

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
}

interface Campo {
  tipo: types;
  placeholder?: string;
  opciones?: string[];
  value?: string;
  id: string;
  title?: string;
}
export function FormularioPersonalizado({
  campos,
  setCampos,
}: {
  campos: Campo[];
  setCampos: (campos: Campo[]) => void;
}) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');

  const [selectKey, setSelectKey] = useState(0);

  // Actualiza la clave del Select cada vez que se agrega un campo
  const agregarCampo = (campo: Campo) => {
    setCampos([...campos, campo]);
    setSelectKey((prevKey) => prevKey + 1); // Incrementa la clave
  };
  const borrarCampo = (index: number) => {
    if (index !== 0) {
      // No permitir borrar el primer campo
      setCampos(campos.filter((_, i) => i !== index));
    }
  };
  const handleNewOption = (index: number) => {
    const newCampos = [...campos];

    // Verificar si el campo tiene ya la propiedad opciones, si no, inicializarla
    if (!newCampos[index].opciones) {
      newCampos[index].opciones = [];
    }

    // Agregar una nueva opción al campo
    newCampos?.[index]?.opciones?.push('');

    setCampos(newCampos);
  };

  const handleOptionsChange = (value: string, index: number, optionIndex: number) => {
    const newCampos = [...campos];
    if (index === 0) {
      newCampos[index].opciones;
    }
    newCampos[optionIndex].opciones?.splice(index, 1, value);
    setCampos(newCampos);
  };

  const handleTitleChange = (value: string, index: number) => {
    const newCampos = [...campos];
    newCampos[index].title = value;
    setCampos(newCampos);
  };

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
            <div className="flex gap-2 flex-col">
              <Input placeholder="Titulo del campo" onChange={(e) => handleTitleChange(e.target.value, index)} />
              <Input placeholder={campo.placeholder} value={campo.value} onChange={handleInputChange(index)} />
            </div>
          </div>
        );
      case 'Área de texto':
        return (
          <div className="w-full cursor-grabbing " key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <div className="flex gap-2 flex-col">
              <Input placeholder="Titulo del campo" onChange={(e) => handleTitleChange(e.target.value, index)} />
              <Textarea placeholder={campo.placeholder} value={campo.value} onChange={handleInputChange(index)} />
            </div>
          </div>
        );
      case 'Separador':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
          </div>
        );
      case 'Nombre del formulario':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <Label>{campo.tipo}</Label>
            <Input placeholder={campo.placeholder} value={campo.value} onChange={handleInputChange(index)} />
          </div>
        );
      case 'Radio':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input placeholder="Titulo del campo" onChange={(e) => handleTitleChange(e.target.value, index)} />
            <div className="flex py-3 items-center gap-2">
              <Label>Opciones</Label>
              <PlusCircledIcon onClick={() => handleNewOption(index)} className="size-5 cursor-pointer text-blue-700" />
            </div>
            <div className="flex gap-2 flex-col">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Input
                    key={i}
                    name={`campo_${index}`}
                    placeholder={`Opcion ${i + 1}`}
                    onChange={(e) => handleOptionsChange(e.target.value, i, index)}
                  />

                  <TrashIcon
                    onClick={() => {
                      const newCampos = [...campos];
                      newCampos[index].opciones?.splice(i, 1);
                      setCampos(newCampos);
                    }}
                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 'Seleccion multiple':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input placeholder={campo.placeholder} onChange={(e) => handleTitleChange(e.target.value, index)} />
            <div className="flex py-3 items-center gap-2">
              <Label>Opciones</Label>
              <PlusCircledIcon onClick={() => handleNewOption(index)} className="size-5 cursor-pointer text-blue-700" />
            </div>
            <div className="flex gap-2 flex-col">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Input
                    key={i}
                    name={`option_${index}`}
                    placeholder={`Opcion ${i + 1}`}
                    onChange={(e) => handleOptionsChange(e.target.value, i, index)}
                  />

                  <TrashIcon
                    onClick={() => {
                      const newCampos = [...campos];
                      newCampos[index].opciones?.splice(i, 1);
                      setCampos(newCampos);
                    }}
                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 'Fecha':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <div className="flex gap-2 flex-col">
              <Input placeholder="Titulo del campo" onChange={(e) => handleTitleChange(e.target.value, index)} />
              <Input
                disabled
                readOnly
                className="w-full"
                type="date"
                placeholder={campo.placeholder}
                onChange={handleInputChange(index)}
              />
            </div>
          </div>
        );
      case 'Seleccion':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input placeholder={campo.placeholder} onChange={(e) => handleTitleChange(e.target.value, index)} />
            <div className="flex py-3 items-center gap-2">
              <Label>Opciones</Label>
              <PlusCircledIcon onClick={() => handleNewOption(index)} className="size-5 cursor-pointer text-blue-700" />
            </div>
            <div className="flex gap-2 flex-col">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Input
                    key={i}
                    name={`select_${index}`}
                    placeholder={`Opcion ${i + 1}`}
                    onChange={(e) => handleOptionsChange(e.target.value, i, index)}
                  />

                  <TrashIcon
                    onClick={() => {
                      const newCampos = [...campos];
                      newCampos[index].opciones?.splice(i, 1);
                      setCampos(newCampos);
                    }}
                    className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 'Seleccion Predefinida':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input placeholder="Ingresar titulo" onChange={(e) => handleTitleChange(e.target.value, index)} />
            <div className="flex gap-2 flex-col py-3">
              <Select
                onValueChange={(e) => {
                  handleOptionsChange(e, 0, index);
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
              <InfoCircledIcon className="mr-2 size-4 " />
              Las opciones solo incluiran los recursos vinculados al cliente
            </CardDescription>
          </div>
        );
      case 'Subtitulo':
        return (
          <div className="w-full cursor-grabbing" key={campo.id}>
            <div className="flex items-center gap-2 mb-3">
              <Label>{campo.tipo}</Label>
              <TrashIcon
                onClick={() => borrarCampo(index)}
                className=" text-red-700 hover:bg-red-700 size-5 hover:text-white rounded-md cursor-pointer"
              />
            </div>
            <Input placeholder="Ingresar titulo" onChange={(e) => handleTitleChange(e.target.value, index)} />
          </div>
        );

      default:
        return null;
    }
  };

  const manejarSeleccion = (tipo: string) => {
    switch (tipo) {
      case 'Texto':
        agregarCampo({
          tipo: types.Texto,
          placeholder: 'Ingresa mensaje de ejemplo',
          id: new Date().getTime().toString(),
        });
        break;
      case 'Área de texto':
        agregarCampo({
          tipo: types.AreaTexto,
          placeholder: 'Ingresa descripción',
          id: new Date().getTime().toString(),
        });
        break;
      case 'Separador':
        agregarCampo({
          tipo: types.Separador,
          placeholder: 'Ingresa Separador',
          id: new Date().getTime().toString(),
        });
        break;
      case 'Radio':
        agregarCampo({
          tipo: types.Radio,
          placeholder: 'Label del grupo de radio',
          id: new Date().getTime().toString(),
          opciones: [],
        });
        break;
      case 'Seleccion multiple':
        agregarCampo({
          tipo: types.SeleccionMultiple,
          placeholder: 'Label del grupo de seleccion multiple',
          id: new Date().getTime().toString(),
          opciones: [],
        });
        break;
      case 'Fecha':
        agregarCampo({
          tipo: types.Date,
          placeholder: 'Ingresa una fecha',
          id: new Date().getTime().toString(),
        });
        break;
      case 'Seleccion':
        agregarCampo({
          tipo: types.Seleccion,
          placeholder: 'Ingresa una opción',
          id: new Date().getTime().toString(),
          opciones: [],
        });
        break;
      case 'Seleccion Predefinida':
        agregarCampo({
          tipo: types.SeleccionPredefinida,
          placeholder: 'Ingresa una opción',
          id: new Date().getTime().toString(),
          opciones: [],
        });
        break;
      case 'Subtitulo':
        agregarCampo({
          tipo: types.Subtitulo,
          placeholder: 'Ingresa un subtitulo',
          id: new Date().getTime().toString(),
        });
        break;
      default:
        break;
    }
    setTipoSeleccionado(''); // Restablecer el tipo seleccionado después de agregar un campo
  };

  const handleInputChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newCampos = [...campos];
    newCampos[index].value = event.target.value;
    setCampos(newCampos);
  };
  return (
    <ScrollArea className="flex flex-col gap-2 p-4 pt-0 space-y-2  max-h-[68vh]">
      <div>
        <CardTitle className="mb-1 text-lg">Edita los campos del formulario</CardTitle>
        <CardDescription className="flex items-center mb-4 text-blue-600">
          <InfoCircledIcon className="text-blue-600 mr-2 size-4" />
          Puedes arrastrarlos para ordenarlos!
        </CardDescription>
      </div>
      <form>
        <Reorder.Group axis="y" className="space-y-2 mb-4 " values={campos} onReorder={setCampos}>
          {campos.map((campo, index) => (
            <Reorder.Item key={campo.id} value={campo}>
              <Card className="flex p-2">{renderizarCampo(campo, index)}</Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </form>
      <Select key={selectKey} onValueChange={(e) => manejarSeleccion(e)}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un tipo de campo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Texto">Texto</SelectItem>
          <SelectItem value="Área de texto">Área de texto</SelectItem>
          <SelectItem value="Separador">Separador</SelectItem>
          <SelectItem value="Radio">Radio</SelectItem>
          <SelectItem value="Seleccion multiple">Seleccion multiple</SelectItem>
          <SelectItem value="Fecha">Fecha</SelectItem>
          <SelectItem value="Subtitulo">Subtitulo</SelectItem>
          <SelectItem value="Seleccion">Seleccion</SelectItem>
          <SelectItem value="Seleccion Predefinida">Seleccion Predefinida</SelectItem>
        </SelectContent>
      </Select>
    </ScrollArea>
  );
}

interface MailDisplayProps {
  campos: Campo[];
}

export function FormDisplay({ campos }: MailDisplayProps) {
  const supabase = supabaseBrowser();

  const vehicles = useLoggedUserStore((state) => state.vehicles);

  const renderizarCampo = (campo: Campo, index: number) => {
    switch (campo.tipo) {
      case 'Nombre del formulario':
        return (
          <div className="w-full my-5" key={crypto.randomUUID()}>
            <Label>
              <Badge className="text-xl"> {campo.value ?? 'Nombre del formulario'}</Badge>
            </Label>
          </div>
        );
      case 'Texto':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2">{campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Input placeholder={campo.value} />
          </div>
        );
      case 'Área de texto':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2">{campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Textarea placeholder={campo.value} />
          </div>
        );
      case 'Separador':
        return (
          <div className="w-full my-2" key={crypto.randomUUID()}>
            <Separator>{campo.value}</Separator>
          </div>
        );
      case 'Radio':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <RadioGroup className="flex gap-2 flex-col mt-2">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center space-x-2 ">
                  <RadioGroupItem value={String(i)} id={String(i)} />
                  <Label htmlFor={String(i)}>{opcion ? opcion : `Opcion ${i + 1}`}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      case 'Seleccion multiple':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <ToggleGroup type="multiple" className="flex w-full justify-start flex-wrap">
              {campo.opciones?.map((opcion, i) => {
                let icon = false;
                return (
                  <ToggleGroupItem className="flex self-start border-muted-foreground border" key={i} value={opcion}>
                    {opcion}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>
        );
      case 'Fecha':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2">{campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Input type="date" value={campo.value} placeholder={campo.placeholder} />
          </div>
        );
      case 'Seleccion':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
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
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        );
      case 'Seleccion Predefinida':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
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
                          .filter((e) => e.domain)
                          .map((e) => {
                            return (
                              <SelectItem key={e.domain} value={e.domain}>
                                {e.domain}
                              </SelectItem>
                            );
                          })}
                      </SelectGroup>
                    );
                  }
                  if (opcion === 'Otros') {
                    return (
                      <SelectGroup key={i}>
                        <SelectLabel>Numero de serie</SelectLabel>
                        {vehicles
                          .filter((e) => e.serie)
                          .map((e) => {
                            return (
                              <SelectItem key={e.serie} value={e.serie}>
                                {e.serie}
                              </SelectItem>
                            );
                          })}
                      </SelectGroup>
                    );
                  }
                  if (opcion === 'Numero interno') {
                    return (
                      <SelectGroup key={i}>
                        <SelectLabel>Numero interno</SelectLabel>
                        {vehicles
                          .filter((e) => e.intern_number)
                          .map((e) => {
                            return (
                              <SelectItem key={e.intern_number} value={e.intern_number}>
                                {e.intern_number}
                              </SelectItem>
                            );
                          })}
                      </SelectGroup>
                    );
                  }
                })}
              </SelectContent>
            </Select>
          </div>
        );
      case 'Subtitulo':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardTitle className="mb-2 mt-1">{campo.title ? campo.title : 'Titulo del campo'}</CardTitle>
          </div>
        );
      default:
        return null;
    }
  };
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);

  return (
    <ScrollArea className="h-screen px-8 py-5 overflow-auto  rounded-e-xl rounded ">
      <div className="flex justify-between items-center">
        <CardTitle className="text-2xl font-bold">Vista previa del formulario</CardTitle>
        <Avatar>
          <AvatarImage
            // src="https://github.com/shadcn.png"
            src={actualCompany?.company_logo ?? ''}
            alt="Logo de la empresa"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-3">
        {campos.map((campo, index) => (
          <div key={crypto.randomUUID()}>{renderizarCampo(campo, index)}</div>
        ))}
        <Button disabled={campos.length < 2}>Crear formulario</Button>
      </div>
    </ScrollArea>
  );
}
