'use client'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AuditorDocument } from '@/types/types'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { supabase } from '../../../supabase/supabase'
import { AuditorColums } from './columns'
import { AuditorDataTable } from './data-table'

export default function Auditor() {
  const [document_types, setDocumentTypes] = useState<any[] | null>([])
  const [documents_employees, setDocumentsEmployees] = useState<any[] | null>(
    [],
  )

  const fetchDocumentTypes = async () => {
    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching document types:', error.message)
      return
    }

    setDocumentTypes(document_types)
  }

  const fetchDocumentsEmployees = async () => {
    let { data: documents_employees, error } = await supabase
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
      .eq('state', 'presentado')

    if (error) {
      console.error('Error fetching document types:', error.message)
      return
    }

    setDocumentsEmployees(documents_employees)
  }

  let doc_personas = document_types?.filter(doc => doc.applies === 'Persona')
  let doc_equipos = document_types?.filter(doc => doc.applies === 'Equipos')

  const channels = supabase
    .channel('custom-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'documents_employees' },
      payload => {
        fetchDocumentsEmployees()
      },
    )
    .subscribe()

  useEffect(() => {
    fetchDocumentTypes()
    fetchDocumentsEmployees()
  }, [])

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
      validity: doc.validity
        ? format(new Date(doc.validity), 'dd/MM/yyyy')
        : 'No vence',
      id: doc.id,
      resource: `${doc.applies?.firstname} ${doc.applies?.lastname}`,
    }
  }) as AuditorDocument[]

  return (
    <div>
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
                        <TableHead className="w-[100px]">
                          Multirecurso
                        </TableHead>
                        <TableHead className="w-[100px]">Vence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doc_personas?.map(doc => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            {doc.name}
                          </TableCell>
                          <TableCell>
                            {doc.multiresource ? 'Si' : 'No'}
                          </TableCell>
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
                        <TableHead className="w-[100px]">
                          Multirecurso
                        </TableHead>
                        <TableHead className="w-[100px]">Vence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doc_equipos?.map(doc => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            {doc.name}
                          </TableCell>
                          <TableCell>
                            {doc.multiresource ? 'Si' : 'No'}
                          </TableCell>
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
      </section>
      <section>
        <AuditorDataTable data={filteredData || []} columns={AuditorColums} />
      </section>
    </div>
  )
}
