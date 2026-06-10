'use client';
import { Button } from '@/shared/components/ui/button';
import { handleSupabaseError } from '@/shared/lib/errorHandler';
import { DownloadIcon } from '@radix-ui/react-icons';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { storage } from '@/shared/lib/storage';
import { blobWithResolvedType } from '@/shared/lib/mime';
function DownloadButton({ path, fileName }: { path: string; fileName: string }) {
  const handleDownload = async (path: string, fileName: string) => {
    toast.promise(
      async () => {
        const data = await storage.download('document_files', path);

        // Extrae la extensión del archivo del path
        const extension = path.split('.').pop();

        const outName = `${fileName}CodeControl.${extension}`;
        // Descarga con el Content-Type real (no octet-stream) para no disparar
        // la cuarentena de antivirus como McAfee.
        saveAs(blobWithResolvedType(data, outName), outName);
      },
      {
        loading: 'Descargando documento...',
        success: 'Documento descargado',
        error: (error) => {
          return error;
        },
      }
    );
  };

  return (
    <Button  onClick={() => handleDownload(path, fileName)}>
      <DownloadIcon className="size-5 mr-2" />
      Descargar
    </Button>
  );
}

export default DownloadButton;
