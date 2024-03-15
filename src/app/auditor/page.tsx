import Link from 'next/link'
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { Separator } from "@/components/ui/separator"



import { buttonVariants } from "@/components/ui/button"
import { supabase } from '../../../supabase/supabase'


export default async function Auditor() {



let { data: document_types, error } = await supabase
.from('document_types')
.select('*')

let doc_personas = document_types?.filter(doc => doc.applies === "Persona")
let doc_equipos = document_types?.filter(doc => doc.applies === "Equipos")


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
                  {doc_personas?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>{doc.multiresource ? "Si" : "No"}</TableCell>
                      <TableCell>{doc.explired ? "Si" : "No"}</TableCell>
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
                <TableCell>{doc.multiresource ? "Si" : "No"}</TableCell>
                <TableCell>{doc.explired ? "Si" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table> 
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter>
        <Link href="/auditor/new-document-type" className={buttonVariants({ variant: "outline" })}>
        Crear Nuevo
      </Link>
        </CardFooter>
      </Card>
      <Separator />
      <Table>
      <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Nombre del Documento</TableHead>
                    <TableHead className="w-[100px]">Multirecurso</TableHead>
                    <TableHead className="w-[100px]">Vence</TableHead>
                    <TableHead className="w-[100px]">Auditar</TableHead>
                  </TableRow>
                </TableHeader>
      </Table>
    </section>
  )
}
