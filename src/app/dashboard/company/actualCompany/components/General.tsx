// 'use client';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import {
//     Dialog,
//     DialogClose,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { ItemCompany } from './components/itemCompany';

// function General() {

//   return (
//     <>
//     <Card className="overflow-hidden">
//     <CardHeader className="w-full flex bg-muted dark:bg-muted/50 border-b-2 flex-row justify-between">
//       <div className="w-fit">
//         <CardTitle className="text-2xl font-bold tracking-tight w-fit">Datos generales de la empresa</CardTitle>
//         <CardDescription className="text-muted-foreground w-fit">Información de la empresa</CardDescription>
//       </div>
//       <Button className="w-fit" onClick={handleEditCompany}>
//         Editar Compañía
//       </Button>
//     </CardHeader>
//     <CardContent className="py-4 px-4 ">
//       {company && (
//         <div>
//           <ItemCompany name="Razón Social" info={company.company_name} />
//           <ItemCompany name="CUIT" info={company.company_cuit} />
//           <ItemCompany name="Dirección" info={company.address} />
//           <ItemCompany name="Pais" info={company.country} />
//           <ItemCompany name="Ciudad" info={company.city.name} />
//           <ItemCompany name="Industria" info={company.industry} />
//           <ItemCompany name="Teléfono de contacto" info={company.contact_phone} />
//           <ItemCompany name="Email de contacto" info={company.contact_email} />
//         </div>
//       )}
//     </CardContent>
//     <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
//   </Card>
//   {userShared !== 'Administrador' && (
//     <Card className=" bg-red-300 border-red-800 border-spacing-2 border-2">
//       <CardHeader>ZONA PELIGROSA</CardHeader>
//       <CardContent>
//         <p>Al eliminiar esta empresa se eliminarán todos los registros asociado a ella.</p>
//         <p>Esta acción no se puede deshacer.</p>
//       </CardContent>
//       <CardFooter>
//         <Dialog>
//           <DialogTrigger asChild>
//             <Button
//               variant="outline"
//               className="bg-red-500 bg-opacity-80 border-red-700 border-2 text-red-700 hover:bg-red-700 hover:text-red-500"
//             >
//               Eliminar Empresa
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Confirmar eliminación de la empresa</DialogTitle>
//               <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
//             </DialogHeader>
//             <div className="flex flex-col">
//               <p>
//                 Por favor escribe <strong>{company?.company_name}</strong> para confirmar.
//               </p>
//               <div className="grid flex-1 gap-2">
//                 <Input
//                   id="user_input"
//                   type="text"
//                   onChange={(e) => compare(e.target.value)}
//                   className={
//                     verify
//                       ? 'border-green-400 bg-green-300 text-green-700'
//                       : 'focus:border-red-400 focus:bg-red-300 text-red-700'
//                   }
//                 />
//               </div>
//             </div>
//             <DialogFooter className="sm:justify-between">
//               <DialogClose asChild>
//                 <Button type="button" variant="outline">
//                   Cerrar
//                 </Button>
//               </DialogClose>
//               <DialogClose asChild>
//                 <Button type="button" variant="destructive">
//                   Eliminar
//                 </Button>
//               </DialogClose>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </CardFooter>
//     </Card>
//     </>

//   )}
//   )
// }

// export default General