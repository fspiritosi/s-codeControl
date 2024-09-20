'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { handleSupabaseError } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { CheckIcon, ClockIcon, ExclamationTriangleIcon, FileTextIcon } from '@radix-ui/react-icons';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../supabase/supabase';
import SimpleDocument from './SimpleDocument';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTrigger } from './ui/alert-dialog';
import { Button, buttonVariants } from './ui/button';
import { CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

type Props = { resource: string; document?: string; id?: string };

export const DocumentationDrawer = ({ resource, document, id }: Props) => {
  const [open, setOpen] = useState(false);
  const employeesData = useLoggedUserStore((state) => state.DrawerEmployees)?.sort((a, b) => {
    if (a.state === 'pendiente' && b.state !== 'pendiente') {
      return 1;
    } else if (a.state !== 'pendiente' && b.state === 'pendiente') {
      return -1;
    } else {
      return a.id_document_types.name.localeCompare(b.id_document_types.name);
    }
  });
  const vehiclesData = useLoggedUserStore((state) => state.DrawerVehicles)
    ?.sort((a, b) => {
      if (a.state === 'pendiente' && b.state !== 'pendiente') {
        return 1;
      } else if (a.state !== 'pendiente' && b.state === 'pendiente') {
        return -1;
      } else {
        return a?.id_document_types.name?.localeCompare(b.id_document_types.name);
      }
    })
    .map((e) => {
      return {
        ...e,
        id_document_types: {
          name: e.document_types.name,
          id: e.document_types.id,
          applies: e.document_types.applies,
          created_at: e.document_types.created_at,
          explired: e.document_types.explired,
          is_active: e.document_types.is_active,
          mandatory: e.document_types.mandatory,
          multiresource: e.document_types.multiresource,
          special: e.document_types.special,
          description: e.document_types.description,
          company_id: e.document_types.company_id,
        },
      };
    });
  const props = resource === 'empleado' ? employeesData : vehiclesData;
  const documentDrawerEmployees = useLoggedUserStore((state) => state.documentDrawerEmployees);
  const documentDrawerVehicles = useLoggedUserStore((state) => state.documentDrawerVehicles);

  useEffect(() => {
    if (document) {
      documentDrawerEmployees(document);
    }
    if (id) {
      documentDrawerVehicles(id);
    }
  }, [document, id]);

  const handleOpen = () => setOpen(!open);
  const profile = useLoggedUserStore((state) => state);
  let role = '';
  if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
    role = profile?.actualCompany?.owner_id?.role as string;
  } else {
    role = profile?.actualCompany?.share_company_users?.[0]?.role as string;
  }

  const documentToDownload = props?.filter((e) => e.state !== 'pendiente');

  const handleDownloadAll = async () => {
    toast.promise(
      async () => {
        const zip = new JSZip();

        const files = await Promise.all(
          documentToDownload?.map(async (doc) => {
            const { data, error } = await supabase.storage.from('document_files').download(doc.document_path);

            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }

            // Extrae la extensión del archivo del document_path
            const extension = doc.document_path.split('.').pop();

            return {
              data,
              name: `${doc?.id_document_types?.name}.${extension}`,
            };
          }) || []
        );

        files.forEach((file) => {
          zip.file(file.name, file.data);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'documents.zip');
      },
      {
        loading: 'Descargando documentos...',
        success: 'Documentos descargados',
        error: (error) => {
          return error;
        },
      }
    );
  };

  const [defaultDocumentId, setDefaultDocumentId] = useState('');

  return (
    <aside className="mb-8 flex flex-col  h-full">
      <CardHeader className="h-[152px] flex flex-row  justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight ">Documentos</CardTitle>
          <CardDescription>Aquí puedes ver los documentos del recurso</CardDescription>
        </div>

        <Dialog>
          <DialogTrigger asChild disabled={documentToDownload?.length === 0}>
            <Button variant="primary" className="text-wrap">
              Descargar todos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className=" text-xl">Se descargaran los siguientes documentos:</DialogTitle>
              <DialogDescription className="pb-6">Solo se descargaran los documentos aprobados</DialogDescription>
              <DialogDescription asChild>
                <div>
                  <div className="flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
                    {documentToDownload?.map((doc, index) => (
                      <p className="text-lg" key={crypto.randomUUID()}>
                        <FileTextIcon className="inline mr-2 size-5" />
                        {doc?.id_document_types?.name}
                      </p>
                    ))}
                  </div>
                  <div className="w-full flex justify-end">
                    <Button
                      className="mt-5"
                      onClick={() => handleDownloadAll()}
                      disabled={documentToDownload?.length === 0}
                    >
                      Descargar
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </CardHeader>
      {props?.length && (
        <>
          {' '}
          <div className=" flex flex-col gap-5 p-4">
            {props?.map((doc, index) => (
              <div key={crypto.randomUUID()} className="flex justify-between items-center h-14 px-2 text-nowrap">
                <div className="flex  w-[75%]">
                  <div className="">
                    {doc.state === 'pendiente' && (
                      <ExclamationTriangleIcon className="inline mr-2 text-red-400 size-5" />
                    )}{' '}
                    {doc.state !== 'aprobado' && doc.state !== 'pendiente' && (
                      <ClockIcon className="inline mr-2 text-orange-400 size-5" />
                    )}
                    {doc.state === 'aprobado' && <CheckIcon className="inline mr-2 text-green-400 size-5" />}
                  </div>
                  <p
                    className={cn(
                      'text-nowrap overflow-hidden overflow-ellipsis',
                      doc.state === 'pendiente' && 'text-muted-foreground/60'
                    )}
                  >
                    {doc?.id_document_types?.name}
                  </p>
                </div>
                {doc.state === 'pendiente' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      {role !== 'Invitado' && (
                        <Button
                          onClick={() => {
                            setDefaultDocumentId(doc?.id_document_types?.id);
                          }}
                        >
                          Subir
                        </Button>
                      )}
                    </AlertDialogTrigger>
                    <AlertDialogContent asChild>
                      <AlertDialogHeader>
                        <div className="max-h-[90vh] overflow-y-auto">
                          <div className="space-y-3">
                            <div>
                              <SimpleDocument
                                resource={resource}
                                handleOpen={() => handleOpen()}
                                defaultDocumentId={defaultDocumentId}
                                document={document}
                              />
                            </div>
                          </div>
                        </div>
                      </AlertDialogHeader>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {doc.state !== 'pendiente' && (
                  <Link className={buttonVariants({ variant: 'default' })} href={`/dashboard/document/${doc.id}`}>
                    Ver
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {!props?.length && (
        <div className=" flex flex-col gap-5 p-4 justify-evenly min-h-full overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => {
            return <Skeleton key={crypto.randomUUID()} className="w-full h-8" style={{ borderRadius: '8px' }} />;
          })}
        </div>
      )}
    </aside>
  );
};
