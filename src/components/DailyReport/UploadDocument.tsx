// import { useState } from 'react';
// import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
// import { supabaseBrowser } from '@/lib/supabase/browser';
// import { Button } from '../ui/button';
// import { toast } from 'sonner';
// import { useRouter } from 'next/navigation';
// import { Input } from '../ui/input';

// interface UploadDocumentProps {
//     rowId: string;
//     companyName: string;
//     customerName: string;
//     serviceName: string;
//     itemNames: string;
// }

// const UploadDocument: React.FC<UploadDocumentProps> = ({ rowId, companyName, customerName, serviceName, itemNames }) => {
//     const supabase = supabaseBrowser();
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [selectedFile, setSelectedFile] = useState<File | null>(null);
//     const route = useRouter();
//     const [remitoNumber, setRemitoNumber] = useState('');
//     const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         if (event.target.files && event.target.files[0]) {
//             setSelectedFile(event.target.files[0]);
//         }
//     };

//     const handleUpload = async () => {
//         if (!selectedFile) return;

//         // const timestamp = new Date().getTime();
//         // const year = new Date().getFullYear();
//         // const month = String(new Date().getMonth() + 1).padStart(2, '0');
//         const day = new Date().toLocaleDateString('es-ES', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric'
//         }).replace(/\//g, '-');

//         // const day = String(new Date().getDate()).padStart(2, '0');

//         const fileExtension = selectedFile.name.split('.').pop();
//         const filePath = `${companyName}/${customerName}/${serviceName}/${itemNames}`;
//         const fileName = `${day}-${remitoNumber}.${fileExtension}`;

//         const { data, error } = await supabase.storage
//             .from('daily_reports')
//             .upload(`${filePath}/${fileName}`, selectedFile, { cacheControl: '10', upsert: true});

//         if (error) {
//             console.error('Error al subir el archivo:', error);
//             toast.error('Error al subir el archivo');
//             return;
//         }

//         const { error: updateError } = await supabase
//             .from('dailyreportrows')
//             .update({ document_path: `${filePath}/${fileName}` })
//             .eq('id', rowId);

//         if (updateError) {
//             console.error('Error al actualizar la ruta del documento:', updateError);
//             toast.error('Error al actualizar la ruta del documento');
//             return;
//         }
//         route.refresh()
//         toast.success('Archivo subido con éxito');
//         setIsDialogOpen(false);
//     };

//     return (
//         <div>
//             <Button variant={'default'} onClick={() => setIsDialogOpen(true)}>Subir Documento</Button>

//             <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

//                 <AlertDialogContent>

//                     <Input
//                         type="text"
//                         placeholder="Número de remito"
//                         className="mb-4"
//                         onChange={(e) => setRemitoNumber(e.target.value)}
//                     />

//                     <Input
//                         type="file"
//                         id="file-upload"
//                         onChange={handleFileChange}
//                         className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
//                         disabled={!remitoNumber}
//                     />
//                     <AlertDialogAction onClick={handleUpload}>Subir</AlertDialogAction>
//                     <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Cancelar</AlertDialogCancel>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </div>
//     );
// };

// export default UploadDocument;

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent } from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { fetchDailyReportRowById, updateDailyReportRow } from '@/app/server/UPDATE/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface UploadDocumentProps {
  rowId: string;
  companyName: string;
  customerName: string;
  serviceName: string;
  itemNames: string;
  isReplacing: boolean;
}

const UploadDocument: React.FC<UploadDocumentProps> = ({
  rowId,
  companyName,
  customerName,
  serviceName,
  itemNames,
  isReplacing,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const route = useRouter();
  const [remitoNumber, setRemitoNumber] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const day = new Date()
      .toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '-');

    const fileExtension = selectedFile.name.split('.').pop();
    const filePath = `${companyName}/${customerName}/${serviceName}/${itemNames}`;
    const fileName = `${day}-${remitoNumber}.${fileExtension}`;

    if (isReplacing) {
      // Mover el archivo actual a la carpeta erroneos
      const currentData = await fetchDailyReportRowById(rowId);

      if (!currentData) {
        console.error('Error al obtener la ruta del documento actual');
        toast.error('Error al obtener la ruta del documento actual');
        return;
      }

      const currentFilePath = (currentData as any).document_path;
      const currentFilePathModified = currentFilePath
        ? currentFilePath.split('/').slice(1).join('/')
        : '';
      if (!currentFilePath) {
        console.error('La ruta del archivo actual es nula');
        toast.error('La ruta del archivo actual es nula');
        return;
      }
      const timestamp = new Date().getTime();
      const erroneousFilePath = `${companyName}/erroneos/${currentFilePathModified.split('/').slice(0, -1).join('/')}/${timestamp}-${currentFilePath.split('/').pop()}`;

      try {
        // Use storage abstraction to move: download + upload to new location + remove old
        const fileBlob = await storage.download('daily_reports', currentFilePath);
        await storage.upload('daily_reports', erroneousFilePath, fileBlob, { upsert: true });
        await storage.remove('daily_reports', [currentFilePath]);
      } catch (moveError) {
        console.error('Error al mover el archivo actual a la carpeta erroneos:', moveError);
        toast.error('Error al mover el archivo actual a la carpeta erroneos');
        return;
      }
    }

    try {
      await storage.upload('daily_reports', `${filePath}/${fileName}`, selectedFile, { cacheControl: '10', upsert: true });
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      toast.error('Error al subir el archivo');
      return;
    }

    const { error: updateError } = await updateDailyReportRow(rowId, { document_path: `${filePath}/${fileName}` });

    if (updateError) {
      console.error('Error al actualizar la ruta del documento:', updateError);
      toast.error('Error al actualizar la ruta del documento');
      return;
    }

    route.refresh();
    toast.success('Archivo subido con éxito');
    setIsDialogOpen(false);
  };

  return (
    <div>
      <Button variant={'default'} onClick={() => setIsDialogOpen(true)}>
        Subir Documento
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <Input
            type="text"
            placeholder="Número de remito"
            className="mb-4"
            onChange={(e) => setRemitoNumber(e.target.value)}
          />
          <Input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            disabled={!remitoNumber}
          />
          <AlertDialogAction onClick={handleUpload}>Subir</AlertDialogAction>
          <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UploadDocument;
