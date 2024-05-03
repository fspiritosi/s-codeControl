'use client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useLoggedUserStore } from '@/store/loggedUser'
import { DotFilledIcon, PersonIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CarIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge } from './ui/badge'
import { buttonVariants } from './ui/button'
export const MissingDocumentList = () => {
  const allValuesToShow = [
    useLoggedUserStore(state => state.allDocumentsToShow),
  ].reduce(
    (acc: { employees: Document[][]; vehicles: Document[][] }, current) => {
      const employeesDocuments = current?.employees.filter(
        item =>
          item.document_path !== null &&
          item.state.toLocaleLowerCase() === 'pendiente',
      )
      const companyDocuments = current?.vehicles.filter(
        item =>
          item.document_path !== null &&
          item.state.toLocaleLowerCase() === 'pendiente',
      )

      const groupedEmployees: { [key: string]: any[] } =
        employeesDocuments?.reduce(
          (grouped: { [key: string]: any[] }, item) => {
            ;(grouped[item.resource] = grouped[item.resource] || []).push(item)
            return grouped
          },
          {},
        )

      const groupedVehicles: { [key: string]: any[] } =
        companyDocuments?.reduce((grouped: { [key: string]: any[] }, item) => {
          ;(grouped[item.resource] = grouped[item.resource] || []).push(item)
          return grouped
        }, {})

      return {
        employees: groupedEmployees ? Object.values(groupedEmployees) : [],
        vehicles: groupedVehicles ? Object.values(groupedVehicles) : [],
      }
    },
    {
      employees: [[]],
      vehicles: [[]],
    },
  )

  console.log(allValuesToShow)

  //   const channels = supabase
  //     .channel('custom-update-channel')
  //     .on(
  //       'postgres_changes',
  //       { event: 'UPDATE', schema: 'public', table: 'documents_employees' },
  //       payload => {
  //         console.log('Change received!', payload)
  //       },
  //     )
  //     .subscribe()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start bg-muted dark:bg-muted/50 border-b-2">
        <div className="grid gap-1">
          <CardTitle className="flex items-center text-lg ">
            Documentos Pendientes{' '}
            {(allValuesToShow?.employees?.length > 0 ||
              allValuesToShow?.vehicles?.length > 0) && (
              <DotFilledIcon className="text-red-500 p-0 m-0 size-6 animate-pulse" />
            )}
          </CardTitle>
          <CardDescription className="capitalize">
            <time dateTime={format(new Date(), 'PPPP', { locale: es })}>
              {format(new Date(), 'PPPP', { locale: es })}
            </time>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm flex flex-col gap-4">
        <Card className="flex flex-col overflow-hidden text-muted-foreground">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-2 text-white border-b-2 bg-muted dark:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-5">
                  <div className="flex">
                    Empleados <PersonIcon className="stroke-1  ml-2" />
                  </div>
                  {allValuesToShow?.employees?.length > 0 && (
                    <Badge className="ml-2" variant="destructive">
                      {allValuesToShow.employees.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="h-fit bg-muted dark:bg-muted/50">
                {allValuesToShow?.employees?.length > 0 &&
                  allValuesToShow.employees.map((item: any, index) => {
                    return (
                      <Accordion
                        key={index}
                        type="single"
                        className="bg-slate-950"
                        collapsible
                      >
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="px-2 text-white">
                            {item[0].resource}
                          </AccordionTrigger>
                          <AccordionContent>
                            {item.map((document: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center h-14 px-2"
                              >
                                <p>{document.documentName}</p>
                                <Link
                                  href={`/dashboard/employee/action?action=view&document=${document.document_number}`}
                                  className={buttonVariants({
                                    variant: 'default',
                                  })}
                                >
                                  Subir
                                </Link>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )
                  })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
        <Card className="flex flex-col overflow-hidden text-muted-foreground">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-2 text-white border-b-2 bg-muted dark:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-5">
                  <div className="flex">
                    Vehículos <CarIcon className="stroke-1  ml-2" />
                  </div>
                  {allValuesToShow?.vehicles?.length > 0 && (
                    <Badge className="ml-2" variant="destructive">
                      {allValuesToShow.vehicles.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="h-fit bg-muted dark:bg-muted/50">
                {allValuesToShow?.vehicles?.length > 0 &&
                  allValuesToShow.vehicles.map((item: any, index) => {
                    return (
                      <Accordion
                        key={index}
                        type="single"
                        className="bg-slate-950"
                        collapsible
                      >
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="px-2 text-white">
                            {item[0].resource}
                          </AccordionTrigger>
                          <AccordionContent>
                            {item.map((document: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center h-14 px-2"
                              >
                                <p>{document.documentName}</p>
                                <Link
                                  href={`/dashboard/equipment/action?action=view&id=${document.vehicle_id}`}
                                  className={buttonVariants({
                                    variant: 'default',
                                  })}
                                >
                                  Subir
                                </Link>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )
                  })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
    </Card>
  )
}
