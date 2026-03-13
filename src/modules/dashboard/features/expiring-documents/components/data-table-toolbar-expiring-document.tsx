'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Card, CardDescription } from '@/shared/components/ui/card';
import { storage } from '@/shared/lib/storage';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ExpiringDocumentDownloadButtonProps<TData> {
  data: TData[];
}

export function ExpiringDocumentDownloadButton<TData>({ data }: ExpiringDocumentDownloadButtonProps<TData>) {
  const allDocs = data as any[];
  const downloadableDocs = allDocs.filter((row) => row.state !== 'pendiente');
  const pendingDocs = allDocs.filter((row) => row.state === 'pendiente');

  const handleDownloadAll = async () => {
    toast.promise(
      async () => {
        const zip = new JSZip();

        const files = await Promise.all(
          downloadableDocs.map(async (doc: any) => {
            const fileData = await storage.download('document_files', doc.document_url);
            const extension = doc.document_url.split('.').pop();
            return {
              data: fileData,
              name: `${doc.resource}-(${doc?.documentName}).${extension}`,
            };
          })
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

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={downloadableDocs.length === 0} className="mr-3" variant={'outline'}>
          <DownloadIcon className="size-5 mr-2" />
          Descargar Documentos
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Estas a punto de descargar {downloadableDocs.length} documentos</AlertDialogTitle>
          <AlertDialogDescription className="max-h-[65vh] overflow-y-auto">
            {pendingDocs.length > 0 && (
              <div>
                <CardDescription className="underline">
                  Alerta: Hay documentos que estan pendientes y no se descargarán
                </CardDescription>
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-red-600">
                      {pendingDocs.length} Documentos pendientes
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2">
                        {pendingDocs.map((doc: any, idx: number) => (
                          <Card className="p-2 border-red-300" key={idx}>
                            <CardDescription>
                              {doc.resource} ({doc.documentName})
                            </CardDescription>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-green-600">
                  {downloadableDocs.length} Documentos presentados
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 mt-2">
                    {downloadableDocs.map((doc: any, idx: number) => (
                      <Card className="p-2 border-green-600" key={idx}>
                        <CardDescription>
                          {doc.resource} ({doc.documentName})
                        </CardDescription>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDownloadAll}>Descargar documentos</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
