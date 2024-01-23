import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  fetchCitys,
  fetchContractors,
  fetchCountrys,
  fetchHierarchy,
  fetchProvinces,
  fetchworkDiagram,
} from '@/lib/utils'
import {
  civilStateOptions,
  documentOptions,
  genderOptions,
  instrutionsOptions,
  nacionaliOptions,
  typeOfContract,
} from '@/types/enums'
import React from 'react'
import { SelectWithData } from './SelectWithData'
import { Input } from './ui/input'
import { Label } from './ui/label'

export const EmployeeAccordion = async () => {
  const countryOptions = await fetchCountrys()
  const provincesOptions = await fetchProvinces()
  const citysOptions = await fetchCitys()
  const hierarchyOptions = await fetchHierarchy()
  const workDiagramOptions = await fetchworkDiagram()
  const contractorCompanies = await fetchContractors()

  const PERSONALDATA = [
    {
      label: 'Nombre',
      type: 'text',
      placeholder: 'Nombre',
    },
    {
      label: 'Apellido',
      type: 'text',
      placeholder: 'Apellido',
    },
    {
      label: 'Nacionalidad',
      type: 'select',
      placeholder: 'Nacionalidad',
      options: nacionaliOptions,
    },
    {
      label: 'CUIL',
      type: 'text',
      placeholder: 'CUIL',
    },
    {
      label: 'Tipo de documento',
      type: 'select',
      placeholder: 'Tipo de documento',
      options: documentOptions,
    },
    {
      label: 'Numero de documento',
      type: 'text',
      placeholder: 'Numero de documento',
    },
    {
      label: 'Pais de nacimiento',
      type: 'select',
      placeholder: 'Pais de nacimiento',
      options: countryOptions,
    },
    {
      label: 'Sexo',
      type: 'select',
      placeholder: 'Sexo',
      options: genderOptions,
    },
    {
      label: 'Estado civil',
      type: 'select',
      placeholder: 'Estado civil',
      options: civilStateOptions,
    },
    {
      label: 'Nivel de instruccion',
      type: 'select',
      placeholder: 'Nivel de instruccion',
      options: instrutionsOptions,
    },
    {
      label: 'Foto',
      type: 'file',
      placeholder: 'Foto',
    },
  ]
  const CONTACTDATA = [
    {
      label: 'Calle',
      type: 'text',
      placeholder: 'Calle',
    },
    {
      label: 'Altura',
      type: 'text',
      placeholder: 'Altura',
    },
    {
      label: 'Provincia',
      type: 'select',
      placeholder: 'Provincia',
      options: provincesOptions,
    },
    {
      label: 'Ciudad',
      type: 'select',
      placeholder: 'Ciudad',
      options: citysOptions,
    },
    {
      label: 'Codigo postal',
      type: 'text',
      placeholder: 'Codigo postal',
    },
    {
      label: 'Telefono',
      type: 'text',
      placeholder: 'Telefono',
    },
    {
      label: 'Email',
      type: 'text',
      placeholder: 'Email',
    },
  ]
  const LABORALDATA = [
    {
      label: 'Legajo', //!Number
      type: 'text',
      placeholder: 'Legajo',
    },
    {
      label: 'Puesto Jerarquico',
      type: 'select',
      placeholder: 'Puesto Jerarquico',
      options: hierarchyOptions,
    },
    {
      label: 'Puesto en la empresa',
      type: 'text',
      placeholder: 'Puesto en la empresa',
    },
    {
      label: 'Diagrama de trabajo',
      type: 'select',
      placeholder: 'Diagrama de trabajo',
      options: workDiagramOptions,
    },
    {
      label: 'Horas normales', //!Number
      type: 'text',
      placeholder: 'Horas normales',
    },
    {
      label: 'Tipo de contrato',
      type: 'select',
      placeholder: 'Tipo de contrato',
      options: typeOfContract,
    },
    {
      label: 'Afectado A',
      type: 'select',
      placeholder: 'Afectado A',
      options: contractorCompanies,
    },
  ]

  return (
    <Accordion type="multiple" className="w-1/2">
      <AccordionItem value="personal-data">
        <AccordionTrigger>Datos Personales</AccordionTrigger>
        <AccordionContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            {PERSONALDATA.map((data, index) => {
              if (data.type === 'select') {
                return (
                  <SelectWithData
                    key={index}
                    label={data.label}
                    placeholder={data.placeholder}
                    options={data.options}
                  />
                )
              } else {
                return (
                  <React.Fragment key={index}>
                    <Label htmlFor={data.label}>{data.label}</Label>
                    <Input
                      type={data.type}
                      id={data.label}
                      placeholder={data.placeholder}
                    />
                  </React.Fragment>
                )
              }
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="contact-data">
        <AccordionTrigger>Datos de contacto</AccordionTrigger>
        <AccordionContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            {CONTACTDATA.map((data, index) => {
              if (data.type === 'select') {
                return (
                  <SelectWithData
                    key={index}
                    label={data.label}
                    placeholder={data.placeholder}
                    options={data.options}
                  />
                )
              } else {
                return (
                  <React.Fragment key={index}>
                    <Label htmlFor={data.label}>{data.label}</Label>
                    <Input
                      type={data.type}
                      id={data.label}
                      placeholder={data.placeholder}
                    />
                  </React.Fragment>
                )
              }
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="laboral-data">
        <AccordionTrigger>Datos laborales</AccordionTrigger>
        <AccordionContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            {LABORALDATA.map((data, index) => {
              if (data.type === 'select') {
                return (
                  <SelectWithData
                    key={index}
                    label={data.label}
                    placeholder={data.placeholder}
                    options={data.options}
                  />
                )
              } else {
                return (
                  <React.Fragment key={index}>
                    <Label htmlFor={data.label}>{data.label}</Label>
                    <Input
                      type={data.type}
                      id={data.label}
                      placeholder={data.placeholder}
                    />
                  </React.Fragment>
                )
              }
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
