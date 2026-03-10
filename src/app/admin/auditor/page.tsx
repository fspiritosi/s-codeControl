'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { fetchActiveDocumentTypesGlobal, fetchPresentedDocumentsForAuditor } from '@/app/server/shared/queries';
import { AuditorDocument } from '@/types/types';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { AuditorColums } from './columns';
import { AuditorDataTable } from './data-table';

export default function Auditor() {
  const [document_types, setDocumentTypes] = useState<any[] | null>([]);
  const [documents_employees, setDocumentsEmployees] = useState<any[] | null>([]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No vence';
    const [day, month, year] = dateString.split('/');
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate || 'No vence';
  };

  const fetchDocumentTypes = async () => {
    const data = await fetchActiveDocumentTypesGlobal();
    setDocumentTypes(data as any);
  };

  const fetchDocumentsEmployees = async () => {
    const { equipmentDocs, employeeDocs } = await fetchPresentedDocumentsForAuditor();

    const mapVehicle = (doc: any) => {
      const formattedDate = formatDate(doc.validity);
      return {
        date: doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : 'No vence',
        allocated_to: doc.vehicle?.type_of_vehicle_rel?.name,
        documentName: doc.document_type?.name,
        state: doc.state,
        multiresource: doc.document_type?.multiresource ? 'Si' : 'No',
        validity: formattedDate,
        id: doc.id,
        resource: doc.vehicle?.domain || doc.vehicle?.intern_number,
        companyName: doc.vehicle?.company?.company_name,
      };
    };
    const mappedVehicles = equipmentDocs?.map(mapVehicle);

    const mapEmployee = (doc: any) => {
      const formattedDate = formatDate(doc.validity);
      return {
        date: doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : 'No vence',
        companyName: doc.employee?.company?.company_name,
        allocated_to: doc.employee?.contractor_employee?.map((ce: any) => ce.customers?.name).join(', '),
        documentName: doc.document_type?.name,
        state: doc.state,
        multiresource: doc.document_type?.multiresource ? 'Si' : 'No',
        validity: formattedDate || 'No vence',
        id: doc.id,
        resource: `${doc.employee?.lastname} ${doc.employee?.firstname}`,
      };
    };
    const mappedEmployees = employeeDocs?.map(mapEmployee);

    setDocumentsEmployees([...(mappedVehicles || []), ...(mappedEmployees || [])]);
  };

  let doc_personas = document_types?.filter((doc) => doc.applies === 'Persona');
  let doc_equipos = document_types?.filter((doc) => doc.applies === 'Equipos');

  useEffect(() => {
    fetchDocumentTypes();
    fetchDocumentsEmployees();
    const interval = setInterval(fetchDocumentsEmployees, 30000);
    return () => clearInterval(interval);
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
