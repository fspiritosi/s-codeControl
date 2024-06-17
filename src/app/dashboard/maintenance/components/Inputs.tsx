'use client'
import { Badge } from '@/components/ui/badge'
import { CardDescription, CardTitle } from '@/components/ui/card'
import {
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLoggedUserStore } from '@/store/loggedUser'
import { FormField as TypeFormField } from '@/types/types'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import FieldRenderer from '../formUtils/fieldRenderer'

interface FieldComponentProps {
  campo: TypeFormField
  form: UseFormReturn<any> | null
  index: number
  completObjet: TypeFormField[] | null
}

interface FieldComponentPropsDecorative {
  campo: TypeFormField
  index: number
}

export const SectionField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div key={index}>
        <CardTitle className="mb-2 mt-1 text-xl">
          {campo.title
            ? campo.title.replaceAll('_', ' ')
            : 'Titulo de la seccion'}
        </CardTitle>
        {completObjet?.map((sectionCampo, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            <FieldRenderer
              campo={sectionCampo}
              form={null}
              index={sectionIndex}
              completObjet={completObjet}
            />
          </React.Fragment>
        ))}
        {campo.date && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Fecha</CardDescription>
            <Input type="date" />
          </div>
        )}
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }
  const dateInputSection = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInputSection = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )

  return (
    <div key={index}>
      <CardTitle className="mb-2 mt-1 text-xl">{campo.title}</CardTitle>
      {completObjet?.map((sectionCampo, sectionIndex) => (
        <React.Fragment key={sectionIndex}>
          <FieldRenderer
            campo={sectionCampo}
            form={form}
            index={sectionIndex}
            completObjet={completObjet}
          />
        </React.Fragment>
      ))}
      {dateInputSection && (
        <DateInput
          completObjet={completObjet}
          campo={dateInputSection}
          form={form}
          index={index}
        />
      )}
      {observationInputSection && (
        <ObservationInput
          completObjet={completObjet}
          campo={observationInputSection}
          form={form}
          index={index}
        />
      )}
      <div className="col-span-3 w-full">
        <Separator />
      </div>
    </div>
  )
}

export const RadioField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="col-span-3 md:col-span-1" key={index}>
        <CardDescription className="mb-2">
          {' '}
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
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
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }

  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )

  return (
    <div className="col-span-3 md:col-span-1" key={index}>
      <FormField
        key={campo.id}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
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
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const TextField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="col-span-3 md:col-span-1" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Input placeholder={campo.value} />
        {campo.date && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Fecha</CardDescription>
            <Input type="date" />
          </div>
        )}
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }

  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )

  return (
    <div className="col-span-3 md:col-span-1" key={index}>
      <FormField
        key={campo.id || index}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
            <FormControl>
              <Input placeholder={campo.value} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const TextAreaField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="col-span-3 md:col-span-1" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Textarea placeholder={campo.value} />
        {campo.date && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Fecha</CardDescription>
            <Input type="date" />
          </div>
        )}
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }

  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )

  return (
    <div className="col-span-3 md:col-span-1" key={index}>
      <FormField
        key={campo.id || index}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
            <FormControl>
              <Textarea placeholder={campo.value} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const RadioGroupField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="w-full" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
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
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }

  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )

  return (
    <div className="col-span-3 md:col-span-1" key={index}>
      <FormField
        key={campo.id || index}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
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
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const MultiSelectField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="w-full" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <ToggleGroup
          type="multiple"
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
        {campo.date && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Fecha</CardDescription>
            <Input type="date" />
          </div>
        )}
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }
  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )
  return (
    <div className="col-span-3 md:col-span-1" key={index}>
      <FormField
        key={campo.id || index}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
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
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const DateField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
}) => {
  if (!form) {
    if (campo.formName !== 'Fecha') return null
    return (
      <div className="col-span-3 md:col-span-1" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Input
          type="date"
          value={campo.value}
          placeholder={campo.placeholder}
        />
      </div>
    )
  }

  if (campo.formName !== 'Fecha') return null

  return (
    <div className="col-span-3 md:col-span-1" key={index}>
      <FormField
        key={campo.id}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => {
          return (
            <FormItem className="space-y-3">
              <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
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
    </div>
  )
}

export const FileField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="col-span-3 md:col-span-1" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Input type="file" placeholder={campo.value} />
        {campo.date && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Fecha</CardDescription>
            <Input type="date" />
          </div>
        )}
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }

  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )

  return (
    <div className="col-span-3 md:col-span-1" key={index}>
      <FormField
        key={campo.id || index}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
            <FormControl>
              <Input type="file" placeholder={campo.value} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const SelectField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="col-span-3 md:col-span-1" key={index}>
        <CardDescription className="mb-2">
          {' '}
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Select>
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
        {campo.date && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Fecha</CardDescription>
            <Input type="date" />
          </div>
        )}
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }
  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )
  return (
    <div className="col-span-3 md:col-span-1 space-y-8" key={index}>
      <FormField
        key={campo.id || index}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const PredefinedSelectField: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    const vehicles = useLoggedUserStore(state => state.vehicles)
    return (
      <div className="w-full" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
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
        {(campo.observation || campo.Observaciones) && (
          <div className="flex flex-col gap-2 mt-2">
            <CardDescription>Observaciones</CardDescription>
            <Textarea placeholder="..." />
          </div>
        )}
      </div>
    )
  }
  const dateInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_fecha`),
  )
  const observationInput = completObjet?.find(e =>
    e.title.includes(`${campo.title}_observaciones`),
  )
  return (
    <div className="col-span-3 md:col-span-1 space-y-8" key={index}>
      <FormItem className="space-y-3">
        <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
        <FormField
          key={campo.id || index}
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
      {dateInput && (
        <DateInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
      {observationInput && (
        <ObservationInput
          completObjet={completObjet}
          campo={campo}
          form={form}
          index={index}
        />
      )}
    </div>
  )
}

export const FormNameField: React.FC<FieldComponentPropsDecorative> = ({
  campo,
  index,
}) => {
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
}

export const TitleField: React.FC<FieldComponentPropsDecorative> = ({
  campo,
  index,
}) => {
  return (
    <div className="col-span-3" key={index}>
      <CardTitle className="mb-2 mt-1 text-xl">
        {campo.title
          ? campo?.title?.replaceAll('_', ' ')
          : campo?.value?.replaceAll('_', ' ')}
      </CardTitle>
    </div>
  )
}

export const SubtitleField: React.FC<FieldComponentPropsDecorative> = ({
  campo,
  index,
}) => {
  return (
    <div className="col-span-3" key={index}>
      <CardTitle className="mb-2 mt-1">
        {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
      </CardTitle>
    </div>
  )
}

export const SeparatorField: React.FC<FieldComponentPropsDecorative> = ({
  campo,
  index,
}) => {
  if (campo.formName) {
    return (
      <div className="col-span-3 w-full " key={index}>
        <Separator>{campo.value}</Separator>
      </div>
    )
  }
  return (
    <div className="col-span-3 w-full px-[20%]" key={index}>
      <Separator>{campo.value}</Separator>
    </div>
  )
}

export const DateInput: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
}) => {
  if (!form)
    return (
      <div className="col-span-3 md:col-span-1 space-y-8 w-full" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Input
          type="date"
          value={campo.value}
          placeholder={campo.placeholder}
        />
      </div>
    )

  return (
    <div className="col-span-3 md:col-span-1 space-y-8 w-full" key={index}>
      <FormField
        key={`${campo.formName}_fecha`}
        control={form.control}
        name={`${campo.formName}_fecha`}
        render={({ field }) => {
          return (
            <FormItem className="space-y-3">
              <FormLabel>{`${campo.title.replaceAll(
                '_',
                ' ',
              )} Fecha`}</FormLabel>
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
    </div>
  )
}

export const ObservationInput: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
}) => {
  if (!form) {
    return (
      <div className="col-span-3 md:col-span-1 space-y-8 w-full" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Textarea placeholder="Ingrese observaciones" />
      </div>
    )
  }
  return (
    <FormField
      key={`${campo.formName}_observaciones`}
      control={form.control}
      name={`${campo.formName}_observaciones`}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>{`${campo.title.replaceAll(
            '_',
            ' ',
          )} Observaciones`}</FormLabel>
          <FormControl>
            <Textarea placeholder="Ingrese observaciones" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const SeccionDate: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="col-span-3" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Input
          type="date"
          value={campo.value}
          placeholder={campo.placeholder}
        />
      </div>
    )
  }
  return (
    <div className="col-span-3" key={index}>
      <FormField
        key={campo.id}
        control={form.control}
        name={campo.formName!}
        render={({ field }) => {
          return (
            <FormItem className="space-y-3">
              <FormLabel>{campo.title.replaceAll('_', ' ')}</FormLabel>
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
    </div>
  )
}
export const SeccionObservaciones: React.FC<FieldComponentProps> = ({
  campo,
  form,
  index,
  completObjet,
}) => {
  if (!form) {
    return (
      <div className="col-span-3" key={index}>
        <CardDescription className="mb-2">
          {campo.title ? campo.title.replaceAll('_', ' ') : 'Titulo del campo'}
        </CardDescription>
        <Textarea placeholder="Ingrese observaciones" />
      </div>
    )
  }
  return (
    <div className="col-span-3" key={index}>
      <FormField
        key={campo.id}
        control={form.control}
        name={campo?.formName!}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{campo?.title.replaceAll('_', ' ')}</FormLabel>
            <FormControl>
              <Textarea placeholder={`${campo?.tipo}`} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}