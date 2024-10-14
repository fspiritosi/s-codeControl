// import React from 'react'
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Info } from "lucide-react"

// export default function DailyReportSkeleton() {
//   return (
//     <Dialog open={true}>
//       <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
//         <DialogHeader>
//           <DialogTitle>Reporte Diario</DialogTitle>
//         </DialogHeader>
        
//         <div className="flex-grow overflow-auto">
//           <div className="flex space-x-2 mb-4">
//             <Skeleton className="h-6 w-24" />
//             <Skeleton className="h-6 w-32" />
//           </div>

//           <div className="space-y-2 mb-4">
//             {[1, 2, 3].map((i) => (
//               <div key={i} className="flex items-center space-x-2 bg-blue-50 p-2 rounded">
//                 <Info className="w-4 h-4 text-blue-500" />
//                 <Skeleton className="h-4 w-full" />
//               </div>
//             ))}
//           </div>

//           <div className="mb-4">
//             <div className="flex justify-between items-center mb-2">
//               <Skeleton className="h-6 w-64" />
//               <Skeleton className="h-9 w-28" />
//             </div>
//             <div className="border rounded">
//               <div className="grid grid-cols-11 gap-2 p-2 border-b">
//                 {Array(11).fill(0).map((_, i) => (
//                   <Skeleton key={i} className="h-4" />
//                 ))}
//               </div>
//               {[1, 2].map((row) => (
//                 <div key={row} className="grid grid-cols-11 gap-2 p-2">
//                   {Array(11).fill(0).map((_, i) => (
//                     <Skeleton key={i} className="h-4" />
//                   ))}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <DialogFooter>
//           <Button variant="outline">Cerrar</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
import React from 'react';

const DailyReportSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        </div>
    );
};

export default DailyReportSkeleton;