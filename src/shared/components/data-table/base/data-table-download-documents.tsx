// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog';
// import { Button } from '@/components/ui/button';
// import { Card, CardDescription } from '@/components/ui/card';
// import { DownloadIcon } from 'lucide-react';

// interface DataTableDownloadDocumentsProps {
//   documents: any[];
//   onDownload: () => void;
// }

// export function DataTableDownloadDocuments({ documents, onDownload }: DataTableDownloadDocumentsProps) {
//   // console.log(documents, 'documents');

//   const filteredRows = [];
//   const presentedRows = [];
//   const pendingRows = [];

//   return (
//     <AlertDialog>
//       <AlertDialogTrigger asChild>
//         <Button disabled={presentedRows.length === 0} className="ml-6" variant={'outline'}>
//           <DownloadIcon className=" mr-2" />
//           Descargar Documentos
//         </Button>
//       </AlertDialogTrigger>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <AlertDialogTitle>Estas a punto de descargar {presentedRows.length} documentos</AlertDialogTitle>
//           <AlertDialogDescription className="max-h-[65vh] overflow-y-auto">
//             {pendingRows.length > 0 && (
//               <div>
//                 <CardDescription className="underline">
//                   Alerta: Hay documentos que estan pendientes y no se descargarán
//                 </CardDescription>
//                 <Accordion type="single" collapsible>
//                   <AccordionItem value="item-1">
//                     <AccordionTrigger className="text-red-600">
//                       {pendingRows.length} Documentos pendientes
//                     </AccordionTrigger>
//                     <AccordionContent>
//                       <div className="flex flex-col gap-2">
//                         {pendingRows.map((row: any) => (
//                           <Card className="p-2 border-red-300" key={row.id}>
//                             <CardDescription>
//                               {row.original.resource} ({row.original.documentName})
//                             </CardDescription>
//                           </Card>
//                         ))}
//                       </div>
//                     </AccordionContent>
//                   </AccordionItem>
//                 </Accordion>
//               </div>
//             )}
//             <Accordion type="single" collapsible>
//               <AccordionItem value="item-2">
//                 <AccordionTrigger className="text-green-600">
//                   {presentedRows.length} Documentos presentados
//                 </AccordionTrigger>
//                 <AccordionContent>
//                   <div className=" flex flex-col gap-2 mt-2">
//                     {presentedRows.map((row: any) => (
//                       <Card className="p-2 border-green-600" key={row.id}>
//                         <CardDescription>
//                           {row.original.resource} ({row.original.documentName})
//                         </CardDescription>
//                       </Card>
//                     ))}
//                   </div>
//                 </AccordionContent>
//               </AccordionItem>
//             </Accordion>
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//           <AlertDialogCancel>Cancelar</AlertDialogCancel>
//           <AlertDialogAction
//             onClick={() => {
//               onDownload();
//             }}
//           >
//             Descargar documentos
//           </AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }
