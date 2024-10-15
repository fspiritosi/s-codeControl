import { useState } from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';

interface UploadDocumentProps {
    rowId: string;
    companyName: string;
    customerName: string;
    serviceName: string;
    itemNames: string;
}




const UploadDocument: React.FC<UploadDocumentProps> = ({ rowId, companyName, customerName, serviceName, itemNames }) => {
    const supabase = supabaseBrowser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const route = useRouter();
    const [remitoNumber, setRemitoNumber] = useState('');
    console.log(rowId)
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        // const timestamp = new Date().getTime();
        // const year = new Date().getFullYear();
        // const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const day = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
        
        // const day = String(new Date().getDate()).padStart(2, '0');

        const fileExtension = selectedFile.name.split('.').pop();
        const filePath = `${companyName}/${customerName}/${serviceName}/${itemNames}`;
        const fileName = `${day}-${remitoNumber}.${fileExtension}`;

        const { data, error } = await supabase.storage
            .from('daily_reports')
            .upload(`${filePath}/${fileName}`, selectedFile, { cacheControl: '10', upsert: true});

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
        route.refresh()
        console.log('Archivo subido con éxito:', data);
        toast.success('Archivo subido con éxito');
        setIsDialogOpen(false);
    };

    return (
        <div>
            <Button variant={'default'} onClick={() => setIsDialogOpen(true)}>Subir Documento</Button>

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