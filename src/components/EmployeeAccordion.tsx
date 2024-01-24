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
      label: 'País de nacimiento',
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
      label: 'Nivel de instrucción',
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
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="personal-data">
        <AccordionTrigger className="text-2xl">
          Datos Personales
        </AccordionTrigger>
        <AccordionContent className="w-full ">
          <div className="min-w-full max-w-sm flex flex-wrap gap-8">
            {PERSONALDATA.map((data, index) => {
              if (data.type === 'select') {
                return (
                  <div key={index} className="w-[300px] flex flex-col gap-2">
                    <SelectWithData
                      label={data.label}
                      placeholder={data.placeholder}
                      options={data.options}
                    />
                  </div>
                )
              } else {
                return (
                  <div key={index} className="w-[300px] flex flex-col gap-2">
                    <Label htmlFor={data.label} className="ml-2">
                      {data.label}
                    </Label>
                    <Input
                      type={data.type}
                      id={data.label}
                      placeholder={data.placeholder}
                      className="w-[300px] bg-white"
                    />
                  </div>
                )
              }
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="contact-data">
        <AccordionTrigger className="text-2xl">
          Datos de contacto
        </AccordionTrigger>
        <AccordionContent>
          <div className="min-w-full max-w-sm flex flex-wrap gap-8">
            {CONTACTDATA.map((data, index) => {
              if (data.type === 'select') {
                return (
                  <div key={index} className="w-[300px] flex flex-col gap-2">
                    <SelectWithData
                      key={index}
                      label={data.label}
                      placeholder={data.placeholder}
                      options={data.options}
                    />
                  </div>
                )
              } else {
                return (
                  <div key={index} className="w-[300px] flex flex-col gap-2">
                    <Label htmlFor={data.label} className="ml-2">
                      {data.label}{' '}
                    </Label>
                    <Input
                      type={data.type}
                      id={data.label}
                      placeholder={data.placeholder}
                    />
                  </div>
                )
              }
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="laboral-data">
        <AccordionTrigger className="text-2xl">
          Datos laborales
        </AccordionTrigger>
        <AccordionContent>
          <div className="min-w-full max-w-sm flex flex-wrap gap-8">
            {LABORALDATA.map((data, index) => {
              if (data.type === 'select') {
                return (
                  <div key={index} className="w-[300px] flex flex-col gap-2">
                    <SelectWithData
                      key={index}
                      label={data.label}
                      placeholder={data.placeholder}
                      options={data.options}
                    />
                  </div>
                )
              } else {
                return (
                  <div key={index} className="w-[300px] flex flex-col gap-2">
                    <Label htmlFor={data.label} className="ml-2">{data.label}</Label>
                    <Input
                      type={data.type}
                      id={data.label}
                      placeholder={data.placeholder}
                    />
                  </div>
                )
              }
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
