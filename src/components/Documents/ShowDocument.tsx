import DownloadButton from '@/app/dashboard/document/documentComponents/DownloadButton';
import BackButton from '@/components/BackButton';
import DeleteDocument from '@/components/DeleteDocument';
import ReplaceDocument from '@/components/ReplaceDocument';
import UpdateDocuments from '@/components/UpdateDocuments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDate } from 'date-fns';
import { es } from 'date-fns/locale';
import moment from 'moment';
import { Suspense } from 'react';

type EntityType = 'employee' | 'equipment';

interface ShowDocumentProps {
  documents_employees: EmployeeDocumentDetailed[] | EquipmentDocumentWithCompany[];
  role: string | never[] | null;
  resource: string;
  id: string;
  documentName: string;
  documentUrl: string;
  entityType: EntityType;
}

function EmployeeEntityTab({ data }: { data: EmployeeDocumentDetailed }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell className="flex  items-center gap-3">
            {' '}
            <Avatar className="size-24">
              <AvatarImage
                src={data?.applies?.picture}
                className="rounded-full object-cover"
                alt="Imagen del recurso"
              />
              <AvatarFallback>recurso</AvatarFallback>
            </Avatar>
            <CardTitle className="font-bold text-lg">
              {data?.applies.lastname + ' ' + data?.applies.firstname}
            </CardTitle>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">DNI:</span> {data?.applies?.document_number}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">CUIL:</span>{' '}
              {data?.applies?.cuil?.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Direccion:</span>{' '}
              {data?.applies?.street + ' ' + data?.applies?.street_number + ', ' + data?.applies?.city.name}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <>
                <span className="font-bold">Provincia:</span> {data?.applies?.province?.name}
              </>
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <>
                <span className="font-bold">Telefono de contacto:</span> {data?.applies?.phone}
              </>
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <>
                <span className="font-bold">Email de contacto:</span> {data?.applies?.email}
              </>
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Fecha de alta:</span>{' '}
              {data?.applies?.created_at &&
                formatDate(data?.applies?.created_at, 'dd/MM/yyyy', {
                  locale: es,
                })}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <div>
              <CardDescription>
                <span className="font-bold">Afectaciones:</span>{' '}
              </CardDescription>
              <ul>
                <CardDescription>
                  {data?.applies?.contractor_employee?.map((contractor: any) => {
                    return <li key={contractor?.contractors?.name}>{contractor?.contractors?.name}</li>;
                  })}
                </CardDescription>
              </ul>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function EquipmentEntityTab({ data, resource }: { data: EquipmentDocumentWithCompany; resource: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell className="flex  items-center gap-3">
            {' '}
            <Avatar className="size-24">
              <AvatarImage
                src={data?.applies?.picture}
                className="rounded-full object-cover"
                alt="Imagen del recurso"
              />
              <AvatarFallback>recurso</AvatarFallback>
            </Avatar>
            <CardTitle className="font-bold text-lg">
              {data?.applies.domain ?? data?.applies.intern_number}
            </CardTitle>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Dominio:</span> {data?.applies?.domain}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Numero interno:</span> {data?.applies?.intern_number}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Marca:</span> {data?.applies?.brand?.name}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Modelo:</span> {data?.applies?.model?.name}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Fecha de alta:</span>{' '}
              {data?.applies?.created_at &&
                formatDate(data?.applies?.created_at, 'dd/MM/yyyy', {
                  locale: es,
                })}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Motor:</span> {data?.applies?.engine}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              {resource === 'employee' ? (
                <>
                  <span className="font-bold">Fecha de alta:</span>{' '}
                  {data?.applies?.created_at &&
                    formatDate(data?.applies?.created_at, 'dd/MM/yyyy', {
                      locale: es,
                    })}
                </>
              ) : (
                <>
                  <span className="font-bold">Chasis:</span> {data?.applies?.chassis}
                </>
              )}
            </CardDescription>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <CardDescription>
              <span className="font-bold">Tipo de vehiculo:</span> {data?.applies?.type_of_vehicle?.name}
            </CardDescription>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function ShowDocument({
  documents_employees,
  role,
  resource,
  id,
  documentName,
  documentUrl,
  entityType,
}: ShowDocumentProps) {
  const doc = documents_employees?.[0];
  const entityTabLabel = entityType === 'employee' ? 'Empleado' : 'Equipo';
  const companyDateField =
    entityType === 'employee'
      ? (doc as EmployeeDocumentDetailed)?.applies?.date_of_admission
      : (doc as EquipmentDocumentWithCompany)?.applies?.created_at;

  return (
    <section className="md:mx-7">
      <Card className="p-4">
        <div className="grid lg:grid-cols-3 grid-cols-1 gap-col-3 ">
          <div className="lg:max-w-[30vw] col-span-1">
            <div className="flex  flex-col ">
              <div>
                <CardHeader>
                  <CardTitle className=" text-2xl">{doc?.id_document_types?.name}</CardTitle>

                  {doc?.state && (
                    <div className="flex flex-col">
                      <Badge
                        variant={
                          doc?.state === 'rechazado'
                            ? 'destructive'
                            : doc?.state === 'aprobado'
                              ? 'success'
                              : doc?.state === 'vencido'
                                ? 'yellow'
                                : 'default'
                        }
                        className={'mb-3 capitalize w-fit'}
                      >
                        {doc?.state}
                      </Badge>
                      {doc?.deny_reason && (
                        <Badge
                          variant={
                            doc?.state === 'rechazado' || doc?.state === 'vencido'
                              ? 'destructive'
                              : doc?.state === 'aprobado'
                                ? 'success'
                                : 'default'
                          }
                          className="mb-3 capitalize w-fit"
                        >
                          {doc?.deny_reason}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>
              </div>
              <div className="flex justify-between mb-5 px-2">
                <DownloadButton
                  fileName={doc?.id_document_types?.name}
                  path={doc?.document_path || ''}
                />
                <BackButton />
              </div>
            </div>
            <Tabs defaultValue="Documento" className="w-full px-2">
              <TabsList className="w-full justify-evenly">
                <TabsTrigger className={cn('hover:bg-white/30', resource === 'company' && 'hidden')} value="Empresa">
                  Empresa
                </TabsTrigger>
                <TabsTrigger className={cn('hover:bg-white/30', resource === 'company' && 'hidden')} value="Empleado">
                  {entityTabLabel}
                </TabsTrigger>
                <TabsTrigger className="hover:bg-white/30" value="Documento">
                  Documento
                </TabsTrigger>
                {role === 'Invitado' ? null : (
                  <TabsTrigger className="hover:bg-white/30" value="Auditar">
                    Actualizar
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="Empresa">
                <Card>
                  <div className="space-y-3 p-3">
                    <CardDescription>Datos de la empresa</CardDescription>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell className="flex  items-center gap-3">
                            {' '}
                            <Avatar className="size-24">
                              <AvatarImage
                                src={doc?.applies?.company_id?.company_logo || ''}
                                alt="Logo de la empresa"
                                className="rounded-full object-cover"
                              />
                              <AvatarFallback>Logo</AvatarFallback>
                            </Avatar>
                            <CardTitle className="font-bold text-lg">
                              {doc?.applies?.company_id?.company_name}
                            </CardTitle>
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              <span className="font-bold">CUIT:</span>{' '}
                              {doc?.applies?.company_id?.company_cuit?.replace(
                                /(\d{2})(\d{8})(\d{1})/,
                                '$1-$2-$3'
                              )}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription className="capitalize">
                              <span className="font-bold capitalize">Direccion:</span>{' '}
                              {doc?.applies?.company_id?.address}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription className="capitalize">
                              <span className="font-bold">Pais:</span>{' '}
                              {doc?.applies?.company_id?.country}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription className="capitalize">
                              <span className="font-bold">Provincia:</span>{' '}
                              {doc?.applies?.company_id?.province_id?.name}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              <span className="font-bold">Telefono de contacto:</span>{' '}
                              {doc?.applies?.company_id?.contact_phone}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              <span className="font-bold">Email de contacto:</span>{' '}
                              {doc?.applies?.company_id?.contact_email}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              <span className="font-bold">Fecha de alta:</span>{' '}
                              {companyDateField &&
                                (entityType === 'employee'
                                  ? moment(companyDateField).format('DD/MM/YYYY')
                                  : formatDate(companyDateField, 'dd/MM/yyyy', { locale: es }))}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        {doc?.applies?.company_id?.description && (
                          <TableRow>
                            <TableCell>
                              <CardDescription className="capitalize">
                                <span className="font-bold">Descripcion:</span>{' '}
                                {doc?.applies?.company_id?.description}
                              </CardDescription>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="Empleado">
                <Card>
                  <div className="p-3">
                    <div className="space-y-3">
                      <CardDescription>
                        Datos del {resource === 'employee' ? 'empleado' : 'equipo'} al que se le solicita el documento
                      </CardDescription>
                      <div className="flex items-center gap-3">
                        {entityType === 'employee' ? (
                          <EmployeeEntityTab data={doc as EmployeeDocumentDetailed} />
                        ) : (
                          <EquipmentEntityTab data={doc as EquipmentDocumentWithCompany} resource={resource} />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="Documento" className="space-y-3">
                <Card>
                  <div className="p-3">
                    <CardTitle className="pb-3">Datos del documento que se le solicita al empleado</CardTitle>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell>
                            {' '}
                            <CardTitle className="pb-3">{doc?.id_document_types?.name}</CardTitle>
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              {doc?.id_document_types?.mandatory
                                ? 'Es mandatorio'
                                : 'No es mandatorio'}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              {doc?.id_document_types?.multiresource
                                ? 'Es multirecurso'
                                : 'No es multirecurso'}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              {doc?.id_document_types?.explired
                                ? resource === 'company'
                                  ? `Vence el ${moment(doc?.validity).format('DD/MM/YYYY')}`
                                  : `Vence el ${moment(doc?.validity).format('DD/MM/YYYY')}`
                                : 'No tiene vencimiento'}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              Documento aplica a {doc?.id_document_types?.applies}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <CardDescription>
                              Subido el{' '}
                              {doc?.created_at &&
                                formatDate(doc?.created_at, 'dd/MM/yyyy', {
                                  locale: es,
                                })}{' '}
                              a las{' '}
                              {doc?.created_at &&
                                formatDate(doc?.created_at, 'p', {
                                  locale: es,
                                })}
                            </CardDescription>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {doc?.id_document_types?.special && (
                              <CardDescription>
                                Este documento tiene consideraciones especiales a tener en cuenta (
                                {doc?.id_document_types?.description})
                              </CardDescription>
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="Auditar">
                <Card>
                  <div className="p-3 text-center space-y-3">
                    <CardDescription>
                      Si el documento es rechazado, vencido o necesita ser actualizado puedes hacerlo desde aqui, una
                      vez aprobado el documento no podra ser modificado
                    </CardDescription>
                    <div className="w-full flex justify-evenly flex-wrap">
                      <UpdateDocuments
                        id={id}
                        resource={resource}
                        documentName={documentName}
                        expires={doc?.id_document_types?.explired}
                        montly={doc?.id_document_types?.is_it_montlhy ?? false}
                      />
                      <ReplaceDocument
                        id={id}
                        resource={resource}
                        documentName={documentName}
                        expires={doc?.validity}
                        montly={doc?.period}
                        appliesId={doc?.id}
                      />
                      <DeleteDocument
                        id={id}
                        resource={resource}
                        documentName={documentName}
                        expires={doc?.id_document_types?.explired}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <Suspense fallback={<Skeleton className="w-full h-full mt-5" />}>
            <div className="max-w-[70vw] col-span-2 px-7 pb-7">
              <Card className="mt-4">
                <CardDescription className="p-3 flex justify-center">
                  <embed
                    src={`${documentUrl}#&navpanes=0&scrollbar=0&zoom=110`}
                    className={cn(
                      'max-w-full max-h-screen rounded-xl aspect-auto',
                      documentUrl.split('.').pop()?.toLocaleLowerCase() === 'pdf' ? 'w-full min-h-screen' : ''
                    )}
                  />
                </CardDescription>
              </Card>
            </div>
          </Suspense>
        </div>
      </Card>
    </section>
  );
}

export default ShowDocument;
