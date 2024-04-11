'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../../../supabase/supabase'

import ApproveDocModal from '@/components/ApproveDocModal'
import DenyDocModal from '@/components/DenyDocModal'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'

export default function page({ params }: { params: { id: string } }) {
  const [documents_employees, setDocumentsEmployees] = useState<any[] | null>(
    [],
  )
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const fetchDocument = async () => {
    let { data: documents_employee } = await supabase
      .from('documents_employees')
      .select(
        `
    *,
    document_types(*),
    applies(*,
      city(name),
      province(name),
      contractor_employee(
        contractors(
          *
          )
          ),
          company_id(*,province_id(name))
          )
          `,
      )
      .eq('id', params.id)

    const document_type_name = documents_employee?.[0]?.document_types?.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '')
      .toLowerCase()
      .replace('/', '-')

    const resorceId = documents_employee?.[0]?.applies?.id
    const { data } = await supabase.storage
      .from('document_files')
      .list('documentos-empleados', {
        search: `document-${document_type_name}-${resorceId}`,
      })

    const fileExtension = data?.[0]?.name.split('.').pop()

    const { data: url } = supabase.storage
      .from('document_files')
      .getPublicUrl(
        `documentos-empleados/document-${document_type_name}-${resorceId}.${fileExtension}`,
      )

    // console.log(url)

    setDocumentUrl(url.publicUrl)
    setDocumentsEmployees(documents_employee)
  }

  // console.log(documentUrl)

  useEffect(() => {
    fetchDocument()
  }, [])

  return (
    <section>
      <div className="grid grid-cols-3 gap-col-3 ">
        <div className="max-w-[30vw] col-span-1">
          <Tabs defaultValue="Documento" className="w-full px-2">
            <TabsList className="w-full justify-evenly">
              <TabsTrigger className="hover:bg-white/30" value="Empresa">
                Empresa
              </TabsTrigger>
              <TabsTrigger className="hover:bg-white/30" value="Empleado">
                Empleado
              </TabsTrigger>
              <TabsTrigger className="hover:bg-white/30" value="Documento">
                Documento
              </TabsTrigger>
              <TabsTrigger className="hover:bg-white/30" value="Auditar">
                Auditar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="Empresa">
              <Card>
                <div className="space-y-3 p-3">
                  <CardDescription>
                    Datos de la empresa que solicita el documento
                  </CardDescription>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-24">
                      <AvatarImage
                        src={
                          documents_employees?.[0]?.applies?.company_id
                            ?.company_logo
                        }
                        alt="Logo de la empresa"
                        className="rounded-full object-cover"
                      />
                      <AvatarFallback>Logo</AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-bold">
                      {
                        documents_employees?.[0]?.applies?.company_id
                          ?.company_name
                      }
                    </CardTitle>
                  </div>
                  <div className="space-y-3">
                    <CardDescription>
                      <span className="font-bold">CUIT:</span>{' '}
                      {documents_employees?.[0]?.applies?.company_id?.company_cuit?.replace(
                        /(\d{2})(\d{8})(\d{1})/,
                        '$1-$2-$3',
                      )}
                    </CardDescription>
                    <CardDescription className="capitalize">
                      <span className="font-bold capitalize">Dirección:</span>{' '}
                      {documents_employees?.[0]?.applies?.company_id?.address}
                    </CardDescription>
                    <CardDescription className="capitalize">
                      <span className="font-bold">País:</span>{' '}
                      {documents_employees?.[0]?.applies?.company_id?.country}
                    </CardDescription>
                    <CardDescription className="capitalize">
                      <span className="font-bold">Provincia:</span>{' '}
                      {
                        documents_employees?.[0]?.applies?.company_id
                          ?.province_id.name
                      }
                    </CardDescription>
                    <CardDescription>
                      <span className="font-bold">Teléfono de contacto:</span>{' '}
                      {
                        documents_employees?.[0]?.applies?.company_id
                          ?.contact_phone
                      }
                    </CardDescription>
                    <CardDescription>
                      <span className="font-bold">Email de contacto:</span>{' '}
                      {
                        documents_employees?.[0]?.applies?.company_id
                          ?.contact_email
                      }
                    </CardDescription>
                    <CardDescription>
                      <span className="font-bold">Fecha de alta:</span>{' '}
                      {documents_employees?.[0]?.applies?.date_of_admission &&
                        formatDate(
                          documents_employees?.[0]?.applies?.date_of_admission,
                          'dd/MM/yyyy',
                          {
                            locale: es,
                          },
                        )}
                    </CardDescription>
                    {documents_employees?.[0]?.applies?.company_id
                      ?.description && (
                      <CardDescription className="capitalize">
                        <span className="font-bold">Descripción:</span>{' '}
                        {
                          documents_employees?.[0]?.applies?.company_id
                            ?.description
                        }
                      </CardDescription>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="Empleado">
              <Card>
                <div className="p-3">
                  <div className="space-y-3">
                    <CardDescription>
                      Datos del empleado al que se le solicita el documento
                    </CardDescription>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-24">
                        <AvatarImage
                          src={documents_employees?.[0]?.applies?.picture}
                          className="rounded-full object-cover"
                          alt="Logo de la empresa"
                        />
                        <AvatarFallback>LOGO</AvatarFallback>
                      </Avatar>
                      <CardTitle className="font-bold">
                        {documents_employees?.[0]?.applies.firstname +
                          ' ' +
                          documents_employees?.[0]?.applies.lastname}
                      </CardTitle>
                    </div>
                    <div className="space-y-3">
                      <CardDescription>
                        <span className="font-bold">CUIT:</span>{' '}
                        {documents_employees?.[0]?.applies?.cuil?.replace(
                          /(\d{2})(\d{8})(\d{1})/,
                          '$1-$2-$3',
                        )}
                      </CardDescription>
                      <CardDescription className="capitalize">
                        <span className="font-bold">Dirección:</span>{' '}
                        {documents_employees?.[0]?.applies?.street +
                          ' ' +
                          documents_employees?.[0]?.applies?.street_number +
                          ', ' +
                          documents_employees?.[0]?.applies?.city.name}
                      </CardDescription>
                      <CardDescription className="capitalize">
                        <span className="font-bold">Provincia:</span>{' '}
                        {documents_employees?.[0]?.applies?.province.name}
                      </CardDescription>
                      <CardDescription className="capitalize">
                        <span className="font-bold">Naciodalidad:</span>{' '}
                        {documents_employees?.[0]?.applies?.nationality}
                      </CardDescription>
                      <CardDescription>
                        <span className="font-bold">Teléfono de contacto:</span>{' '}
                        {documents_employees?.[0]?.applies?.phone}
                      </CardDescription>
                      <CardDescription>
                        <span className="font-bold">Email de contacto:</span>{' '}
                        {documents_employees?.[0]?.applies?.email}
                      </CardDescription>
                      <CardDescription>
                        <span className="font-bold">Fecha de alta:</span>{' '}
                        {documents_employees?.[0]?.applies?.date_of_admission &&
                          formatDate(
                            documents_employees?.[0]?.applies
                              ?.date_of_admission,
                            'dd/MM/yyyy',
                            {
                              locale: es,
                            },
                          )}
                      </CardDescription>
                      <div>
                        <CardDescription>
                          <span className="font-bold">Afectaciones:</span>{' '}
                        </CardDescription>
                        <ul>
                          <CardDescription>
                            {documents_employees?.[0]?.applies?.contractor_employee.map(
                              (contractor: any) => {
                                return (
                                  <li key={contractor.contractors.name}>
                                    {contractor.contractors.name}
                                  </li>
                                )
                              },
                            )}
                          </CardDescription>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="Documento" className="space-y-3">
              <Card>
                <div className="p-3">
                  <CardDescription>
                    Datos del documento que se le solicita al empleado
                  </CardDescription>
                  <CardTitle>
                    {documents_employees?.[0]?.document_types?.name}
                  </CardTitle>
                  <CardDescription>
                    {documents_employees?.[0]?.document_types?.mandatory
                      ? 'Es mandatorio'
                      : 'No es mandatorio'}
                  </CardDescription>
                  <CardDescription>
                    {documents_employees?.[0]?.document_types?.multiresource
                      ? 'Es multirecurso'
                      : 'No es multirecurso'}
                  </CardDescription>
                  <CardDescription>
                    {documents_employees?.[0]?.document_types?.expired
                      ? 'Tiene vencimiento'
                      : 'No tiene vencimiento'}
                  </CardDescription>
                  <CardDescription>
                    Documento aplica a{' '}
                    {documents_employees?.[0]?.document_types?.applies}
                  </CardDescription>
                  <CardDescription>
                    Subido el{' '}
                    {documents_employees?.[0]?.created_at &&
                      formatDate(
                        documents_employees?.[0]?.created_at,
                        'dd/MM/yyyy',
                        {
                          locale: es,
                        },
                      )}{' '}
                    a las{' '}
                    {documents_employees?.[0]?.created_at &&
                      formatDate(documents_employees?.[0]?.created_at, 'p', {
                        locale: es,
                      })}
                  </CardDescription>
                  {documents_employees?.[0]?.document_types?.special && (
                    <CardDescription>
                      Este documento tiene consideraciones especiales a tener en
                      cuenta{' '}
                      {documents_employees?.[0]?.document_types?.description}
                    </CardDescription>
                  )}
                  <h2></h2>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="Auditar">
              <Card>
                <div className="p-3 text-center space-y-3">
                  <CardDescription>
                    Aqui podras auditar el documento que se le solicita al
                    empleado
                  </CardDescription>
                  <div className="w-full flex justify-evenly">
                    <ApproveDocModal id={params.id} />
                    <DenyDocModal id={params.id} />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div className="max-w-[70vw]  col-span-2 p-7">
          {documentUrl ? (
            <Card>
              <CardDescription className="p-3">
                <embed
                  src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-screen rounded-xl"
                />
              </CardDescription>
            </Card>
          ) : (
            <Skeleton className="bg-black w-full h-screen" />
          )}
        </div>
      </div>
    </section>
  )
}
