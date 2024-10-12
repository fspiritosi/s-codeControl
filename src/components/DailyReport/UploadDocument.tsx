import { useState } from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { supabaseBrowser } from '@/lib/supabase/browser'; 
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface UploadDocumentProps {
    rowId: string;
    companyName: string;
    customerName: string;
    serviceName: string;
}


const UploadDocument: React.FC<UploadDocumentProps> = ({ rowId, companyName, customerName, serviceName }) => {
    const supabase = supabaseBrowser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    console.log(rowId)
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const timestamp = new Date().getTime();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const day = String(new Date().getDate()).padStart(2, '0');

        const fileExtension = selectedFile.name.split('.').pop();
        const filePath = `${companyName}/${year}/${month}/${day}`;
        const fileName = `${customerName}-${serviceName}-${timestamp}.${fileExtension}`;
         
        const { data, error } = await supabase.storage
            .from('daily_reports')
            .upload(`${filePath}/${fileName}`, selectedFile);

        if (error) {
            console.error('Error al subir el archivo:', error);
            toast.error('Error al subir el archivo');
            return;
        }

        const { error: updateError } = await supabase
            .from('dailyreportrows')
            .update({ document_path: `${filePath}/${fileName}` })
            .eq('id', rowId);

        if (updateError) {
            console.error('Error al actualizar la ruta del documento:', updateError);
            toast.error('Error al actualizar la ruta del documento');
            return;
        }
        console.log('Archivo subido con éxito:', data);
        toast.success('Archivo subido con éxito');
        setIsDialogOpen(false);
    };

    return (
        <div>
            <Button variant={'default'} onClick={() => setIsDialogOpen(true)}>Subir Documento</Button>

            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {/* <AlertDialogTrigger asChild>
                    <button>Subir Documento</button>
                </AlertDialogTrigger> */}
                <AlertDialogContent>
                    <h2>Seleccionar Documento</h2>
                    <input type="file" onChange={handleFileChange} />
                    <AlertDialogAction onClick={handleUpload}>Subir</AlertDialogAction>
                    <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Cancelar</AlertDialogCancel>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UploadDocument;