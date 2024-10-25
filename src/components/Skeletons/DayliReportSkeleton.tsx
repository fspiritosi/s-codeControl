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



// import React from 'react';

// const DailyReportSkeleton: React.FC = () => {
//     return (
//         <div className="animate-pulse">
//             <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
//             <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
//             <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
//             <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
//         </div>
//     );
// };

// export default DailyReportSkeleton;

import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import { Select } from "@/components/ui/select"

export default function DailyReportSkeleton() {
  return (
    // <Card className="w-full max-w-4xl mx-auto">
      <div className="w-full  mx-auto">
      {/* <CardHeader>
        <CardTitle className="text-2xl font-bold">Reporte Diario</CardTitle>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Fecha:</span>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-2 bg-muted p-3 rounded-md">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardHeader> */}
      {/* <CardContent> */}
        <div className="flex justify-between items-center mb-4">
          {/* <h2 className="text-xl font-semibold">Fecha: </h2> */}
          {[1, 2, 3, 4, 5, 6, 7].map((col) => (
          <Select key={col}>
            <Skeleton className="h-6 w-24 bg-gray-300" />
          </Select>
          ))}
          <Button>
            <Skeleton className="h-6 w-24 bg-gray-300" />
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {['Cliente', 'Servicio', 'Item', 'Empleados', 'Equipos', 'Jornada', 'H.Inicio', 'H.Fin', 'Estado', 'Descripción', 'Acciones'].map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                {Array(11).fill(null).map((_, i) => (
                  <TableCell key={i}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* <div className="flex justify-end mt-4">
          <Button variant="outline">
            <Skeleton className="h-6 w-16" />
          </Button>
        </div> */}
      {/* </CardContent> */}
    {/* </Card> */}
    </div>
  )
}