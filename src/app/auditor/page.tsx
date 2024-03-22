import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

const data = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
]

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { supabase } from '../../../supabase/supabase'
import { AuditorColums } from './columns'
import { AuditorDataTable } from './data-table'
import { revalidatePath } from 'next/cache'

type AuditorDocument = {
  date: string
  companyName: string
  allocated_to: string
  documentName: string
  multiresource: string
  validity: string
  id: string
  resource: string
  state: string
}

export default async function Auditor() {
  let { data: document_types, error } = await supabase
    .from('document_types')
    .select('*')
    .eq('is_active', true)

  let doc_personas = document_types?.filter(doc => doc.applies === 'Persona')
  let doc_equipos = document_types?.filter(doc => doc.applies === 'Equipos')
  revalidatePath('/auditor')

  let { data: documents_employees } = await supabase
    .from('documents_employees')
    .select(
      `
    *,
    document_types(*),
    applies(*,
      contractor_employee(
        contractors(
          *
        )
      ),
      company_id(*)
    )
  `,
    )
    .eq('is_active', true)


  const filteredData = documents_employees?.map(doc => {
    return {
      date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
      companyName: doc.applies?.company_id?.company_name,
      allocated_to: doc.applies?.contractor_employee
        ?.map((doc: any) => doc.contractors.name)
        .join(', '),
      documentName: doc.document_types?.name,
      state: doc.state,
      multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
      validity: format(new Date(doc.validity), 'dd/MM/yyyy') || 'No vence',
      id: doc.id,
      resource: `${doc.applies?.firstname} ${doc.applies?.lastname}`,
    }
  }) as AuditorDocument[]

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Tipos de documentos</CardTitle>
          <CardDescription>Tipos de documentos auditables</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Personas</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Documento</TableHead>
                      <TableHead className="w-[100px]">Multirecurso</TableHead>
                      <TableHead className="w-[100px]">Vence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doc_personas?.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.name}
                        </TableCell>
                        <TableCell>{doc.multiresource ? 'Si' : 'No'}</TableCell>
                        <TableCell>{doc.explired ? 'Si' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Equipos</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Documento</TableHead>
                      <TableHead className="w-[100px]">Multirecurso</TableHead>
                      <TableHead className="w-[100px]">Vence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doc_equipos?.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.name}
                        </TableCell>
                        <TableCell>{doc.multiresource ? 'Si' : 'No'}</TableCell>
                        <TableCell>{doc.explired ? 'Si' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter>
          <Link
            href="/auditor/new-document-type"
            className={buttonVariants({ variant: 'outline' })}
          >
            Crear Nuevo
          </Link>
        </CardFooter>
      </Card>
      <Separator />
      <AuditorDataTable data={filteredData} columns={AuditorColums} />
    </section>
  )
}
