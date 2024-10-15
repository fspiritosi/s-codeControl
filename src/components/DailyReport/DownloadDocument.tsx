// import { useState, useEffect } from 'react';
// import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
// import { supabaseBrowser } from '@/lib/supabase/browser';
// import { Button } from '../ui/button';
// import { toast } from 'sonner';
// import { Input } from '../ui/input';

// interface DownloadDocumentProps {
//     rowId: string;
// }

// const DownloadDocument: React.FC<DownloadDocumentProps> = ({ rowId }) => {
//     const supabase = supabaseBrowser();
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [documentPath, setDocumentPath] = useState<string | null>(null);
//     console.log(rowId)
//     useEffect(() => {
//         const fetchDocumentPath = async () => {
//             const { data, error } = await supabase
//                 .from('dailyreportrows')
//                 .select('document_path')
//                 .eq('id', rowId)
//                 .single();

//             if (error) {
//                 console.error('Error al obtener la ruta del documento:', error);
//                 toast.error('Error al obtener la ruta del documento');
//                 return;
//             }

//             setDocumentPath(data.document_path);
//         };

//         fetchDocumentPath();
//     }, [rowId, supabase]);

//     const handleDownload = async () => {
//         if (!documentPath) {
//             toast.error('No se encontró la ruta del documento');
//             return;
//         }

//         const { data, error } = await supabase.storage
//             .from('daily_reports')
//             .download(documentPath);

//         if (error) {
//             console.error('Error al descargar el archivo:', error);
//             toast.error('Error al descargar el archivo');
//             return;
//         }

//         const url = URL.createObjectURL(data);
//         const link = document.createElement('a');
//         link.href = url;
//         link.setAttribute('download', documentPath.split('/').pop() || 'documento');
//         document.body.appendChild(link);
//         link.click();
//         link.parentNode?.removeChild(link);
//         toast.success('Archivo descargado con éxito');
//         setIsDialogOpen(false);
//     };

//     return (
//         <div>
//             <Button variant={'default'} onClick={() => setIsDialogOpen(true)}>Descargar Documento</Button>

//             <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//                 <AlertDialogContent>
//                     <p>¿Estás seguro de que deseas descargar el documento?</p>
//                     <AlertDialogAction onClick={handleDownload}>Descargar</AlertDialogAction>
//                     <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Cancelar</AlertDialogCancel>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </div>
//     );
// };

// export default DownloadDocument;