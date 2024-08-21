'use client';
import { Button } from '@/components/ui/button';
import { handleSupabaseError } from '@/lib/errorHandler';
import { DownloadIcon } from '@radix-ui/react-icons';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { supabase } from '../../../../../supabase/supabase';
function DownloadButton({ path, fileName }: { path: string; fileName: string }) {
  const handleDownload = async (path: string, fileName: string) => {
    toast.promise(
      async () => {
        const { data, error } = await supabase.storage.from('document_files').download(path);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }

        // Extrae la extensión del archivo del path
        const extension = path.split('.').pop();

        const blob = new Blob([data], { type: 'application/octet-stream' });
        // Usa la extensión del archivo al guardar el archivo
        saveAs(blob, `${fileName}CodeControl.${extension}`);
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
