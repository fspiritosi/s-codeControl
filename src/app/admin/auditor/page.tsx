'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { AuditorDocument } from '@/types/types';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { AuditorColums } from './columns';
import { AuditorDataTable } from './data-table';

export default function Auditor() {
  const supabase = supabaseBrowser();
  const [document_types, setDocumentTypes] = useState<any[] | null>([]);
  const [documents_employees, setDocumentsEmployees] = useState<any[] | null>([]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No vence';
    const [day, month, year] = dateString.split('/');
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate || 'No vence';
  };

  const fetchDocumentTypes = async () => {
    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      ?.filter('is_active', 'eq', true)
      ?.filter('company_id', 'is', null);
    // .or(`company_id.eq.${actualCompany?.id},company_id.is.null`)

    if (error) {
      console.error('Error fetching document types:', error.message);
      return;
    }

    setDocumentTypes(document_types);
  };

  const fetchDocumentsEmployees = async () => {
    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `
    *,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*),company_id(*))
    `
      )
      .eq('state', 'presentado')
      .order('created_at', { ascending: false });

    const mapVehicle = (doc: any) => {
      const formattedDate = formatDate(doc.validity);
      return {
        date: doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : 'No vence',
        allocated_to: doc.applies?.type_of_vehicle?.name,
        documentName: doc.document_types?.name,
        state: doc.state,
        multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
        validity: formattedDate,
        id: doc.id,
        resource: doc.applies?.domain || doc.applies?.intern_number,
        companyName: doc.applies?.company_id?.company_name,
      };
    };
    const mappedVehicles = equipmentData?.map(mapVehicle);

    let { data: documents_employees, error } = await supabase
      .from('documents_employees')
      .select(
        `
      *,
      document_types(*),
      applies(*,
        contractor_employee(
          customers(
            *
          )
        ),
        company_id(*)
      )
    `
      )
      .eq('state', 'presentado')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const mapEmployee = (doc: any) => {
      const formattedDate = formatDate(doc.validity);
      return {
        date: doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : 'No vence',
        companyName: doc.applies?.company_id?.company_name,
        allocated_to: doc.applies?.contractor_employee?.map((doc: any) => doc.contractors?.name).join(', '),
        documentName: doc.document_types?.name,
        state: doc.state,
        multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
        validity: formattedDate || 'No vence',
        id: doc.id,
        resource: `${doc.applies?.lastname} ${doc.applies?.firstname}`,
      };
    };
    const mappedEmployees = documents_employees?.map(mapEmployee);

    if (error) {
      console.error('Error fetching document types:', error.message);
      return;
    }

    setDocumentsEmployees([...(mappedVehicles || []), ...(mappedEmployees || [])]);
  };

  let doc_personas = document_types?.filter((doc) => doc.applies === 'Persona');
  let doc_equipos = document_types?.filter((doc) => doc.applies === 'Equipos');

  const channels = supabase
    .channel('custom-update-channel')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'documents_employees' }, (payload) => {
      fetchDocumentsEmployees();
    })
    .subscribe();

  useEffect(() => {
    fetchDocumentTypes();
    fetchDocumentsEmployees();
  }, []);

  const filteredData = documents_employees as AuditorDocument[];

  return (
    <div className="min-h-screen w-full bg-muted/40 md:px-8">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
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
                        {doc_personas?.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
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
                        {doc_equipos?.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
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
              <Link href="/admin/auditor/new-document-type" className={buttonVariants({ variant: 'outline' })}>
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
    </div>
  );
}
