'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import {
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
} from '@radix-ui/react-icons'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../supabase/supabase'
import SimpleDocument from './SimpleDocument'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { Button, buttonVariants } from './ui/button'
import { CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'

type Props = { props?: any[] | null; resource: string }

export const DocumentationDrawer = ({ props, resource }: Props) => {
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(!open)
  const profile = useLoggedUserStore(state => state)
  let role = ''
  if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
    role = profile?.actualCompany?.owner_id?.role as string
  } else {
    role = profile?.actualCompany?.share_company_users?.[0]?.role as string
  }

  const documentToDownload = props?.filter(e => e.state === 'aprobado')

  const handleDownloadAll = async () => {
    toast.promise(
      async () => {
        const zip = new JSZip()

        const files = await Promise.all(
          documentToDownload?.map(async doc => {
            const { data, error } = await supabase.storage
              .from('document_files')
              .download(doc.document_path)

            if (error) {
              throw new Error('Error al descargar el documento')
            }

            // Extrae la extensión del archivo del document_path
            const extension = doc.document_path.split('.').pop()

            return {
              data,
              name: `${doc?.id_document_types?.name}.${extension}`,
            }
          }) || [],
        )

        files.forEach(file => {
          zip.file(file.name, file.data)
        })

        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, 'documents.zip')
      },
      {
        loading: 'Descargando documentos...',
        success: 'Documentos descargados',
        error: error => {
          return 'Error al descargar los documentos'
        },
      },
    )
  }

  const [defaultDocumentId, setDefaultDocumentId] = useState('')

  return (
    <aside className="mb-8 flex flex-col  h-full">
      <CardHeader className="h-[152px] flex flex-row  justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight ">
            Documentos
          </CardTitle>
          <CardDescription>
            Aquí puedes ver los documentos del recurso
          </CardDescription>
        </div>

        <Dialog>
          <DialogTrigger asChild disabled={documentToDownload?.length === 0}>
            <Button variant="primary" className="text-wrap">
              Descargar todos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className=" text-xl">
                Se descargaran los siguientes documentos:
              </DialogTitle>
              <DialogDescription className="pb-6">
                Solo se descargaran los documentos aprobados
              </DialogDescription>
              <DialogDescription asChild>
                <div>
                  <div className="flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
                    {documentToDownload?.map((doc, index) => (
                      <p className="text-lg" key={index}>
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
      <div className=" flex flex-col gap-5 p-4">
        {props?.map((doc, index) => (
          <div
            key={index}
            className="flex justify-between items-center h-14 px-2 text-nowrap"
          >
            <div className="flex  w-[75%]">
              <div className="">
                {doc.state === 'pendiente' && (
                  <ExclamationTriangleIcon className="inline mr-2 text-red-400 size-5" />
                )}{' '}
                {doc.state !== 'aprobado' && doc.state !== 'pendiente' && (
                  <ClockIcon className="inline mr-2 text-orange-400 size-5" />
                )}
                {doc.state === 'aprobado' && (
                  <CheckIcon className="inline mr-2 text-green-400 size-5" />
                )}
              </div>
              <p
                className={cn(
                  'text-nowrap overflow-hidden overflow-ellipsis',
                  doc.state === 'pendiente' && 'text-muted-foreground/60',
                )}
              >
                {doc?.id_document_types?.name}
              </p>
            </div>
            {doc.state === 'pendiente' && (
              <AlertDialog open={open} onOpenChange={handleOpen}>
                <AlertDialogTrigger asChild>
                  {role !== 'Invitado' && (
                    <Button
                      onClick={() => {
                        setDefaultDocumentId(doc?.id_document_types?.id)
                      }}
                    >
                      Subir
                    </Button>
                  )}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <div className="max-h-[90vh] overflow-y-auto">
                      <h2 className="text-lg font-semibold">
                        Documento No multirecurso
                      </h2>
                      <Separator className="my-1" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Verifica que los documentos sean correctos y no hayan
                        entradas duplicadas, en tal caso se subira la primera
                        entrada encontrada y se marcaran las demas como
                        duplicadas
                      </p>
                      <div className="space-y-3">
                        <div>
                          <SimpleDocument
                            resource={resource}
                            handleOpen={() => handleOpen()}
                            defaultDocumentId={defaultDocumentId}
                          />
                        </div>
                      </div>
                    </div>
                  </AlertDialogHeader>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {/* {(doc.state === 'aprobado' || doc.state === 'presentado') && (
              <Button
                onClick={() =>
                  handleDownload(
                    doc.document_path,
                    doc?.id_document_types?.name,
                  )
                }
              >
                Descargar
              </Button>
            )} */}
            {doc.state !== 'pendiente' && (
              <Link
                className={buttonVariants({ variant: 'default' })}
                href={`/dashboard/document/${doc.id}`}
              >
                Ver
              </Link>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
