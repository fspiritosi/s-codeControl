// 'use client';
// import {
//   AlertDialog,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog';
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { cn } from '@/lib/utils';
// import { CaretSortIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
// import { useSearchParams } from 'next/navigation';
// // import { handleSupabaseError } from '@/lib/errorHandler';
// import { useLoggedUserStore } from '@/store/loggedUser';
// import { zodResolver } from '@hookform/resolvers/zod';
// // import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
// import { useEffect, useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { toast } from 'sonner';
// import { z } from 'zod';
// import { supabase } from '../../supabase/supabase';
// import { Button, buttonVariants } from './ui/button';
// type dataType = {
//   guild: {
//     name: string;
//     id: string;
//     is_active: boolean;
//   }[];
//   covenants: {
//     name: string;
//     number: string;
//     guild_id: string;
//     id: string;
//     is_active: boolean;
//   }[];
//   category: {
//     name: string;
//     id: string;
//     covenant_id: string;
//     is_active: boolean;
//   }[];
// };
// export const CovenantRegister = () => {
//   // const [showPasswords, setShowPasswords] = useState(false);
//   const [open, setOpen] = useState(false);
//   const ownerUser = useLoggedUserStore((state) => state.profile);
//   // const [activeTab, setActiveTab] = useState('InviteUser');
//   // const [clientData, setClientData] = useState<any>(null);
//   const [covenantId, setCovenantId] = useState();
//   // const [selectedRole, setSelectedRole] = useState('');
//   const company = useLoggedUserStore((state) => state.actualCompany);
//   // const [userType, setUserType] = useState<'Usuario' | 'Invitado' | null>(null);
//   const searchParams = useSearchParams();
//   const document = searchParams.get('document');
//   const [searchText, setSearchText] = useState('');
//   const [accion, setAccion] = useState(searchParams.get('action'));
//   const [readOnly, setReadOnly] = useState(accion === 'view' ? true : false);
//   const [guildId, setGuildId] = useState();
//   const [showCovenants, setShowCovenants] = useState(false);
//   const [showCategories, setShowCategories] = useState(false);
//   const [showButton, setShowButton] = useState(true);
//   const [showButton2, setShowButton2] = useState(true);
//   const [guildData, setGuildData] = useState<dataType>({
//     guild: [],
//     covenants: [],
//     category: [],
//   });
//   const [data, setData] = useState<dataType>({
//     guild: [],
//     covenants: [],
//     category: [],
//   });

//   const covenantRegisterSchema = z.object({
//     guild: z
//       .string()
//       .min(2, {
//         message: 'El nombre debe tener al menos 2 caracteres.',
//       })
//       .max(30, {
//         message: 'El nombre debe tener menos de 100 caracteres.',
//       })
//       .regex(/^[a-zA-Z0-9 ]+$/, {
//         message: 'El nombre solo puede contener letras y números.',
//       })
//       .trim(),
//     covenants: z
//       .string()
//       .min(2, {
//         message: 'El convenio debe tener al menos 2 caracteres.',
//       })
//       .max(30, {
//         message: 'El convenio debe tener menos de 30 caracteres.',
//       })

//       .trim()
//       // .regex(/^[a-zA-Z ]+$/, {
//       //     message: 'El apellido solo puede contener letras.',
//       // })
//       .optional()
//       .nullable(),
//     category: z
//       .string()
//       .min(1, {
//         message: 'La categoria debe tener al menos 1 caracteres.',
//       })
//       .max(30, {
//         message: 'La categoria debe tener menos de 30 caracteres.',
//       })

//       .trim()
//       .optional()
//       .nullable(),
//   });

//   const form = useForm<z.infer<typeof covenantRegisterSchema>>({
//     resolver: zodResolver(covenantRegisterSchema),
//     defaultValues: {
//       guild: '',
//       covenants: '',
//       category: '',
//     },
//   });

//   useEffect(() => {
//     // Restablecer los valores del formulario cuando el componente se monta

//     fetchGuild();
//     form.reset({
//       guild: '',
//       covenants: '',
//       category: '',
//     });
//   }, [form]);

//   const fetchGuild = async () => {
//     try {
//       let { data: guilds } = await supabase
//         .from('guild')
//         .select('*')
//         .eq('company_id', company?.id)
//         .eq('is_active', true);

//       setData({
//         ...data,

//         guild: (guilds || [])?.map((e) => {
//           return { name: e.name as string, id: e.id as string, is_active: e.is_active };
//         }),
//       });
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       // Muestra un mensaje de error al usuario
//       toast.error('Error fetching data');
//     }
//   };

//   const fetchData = async (guild_id?: string) => {
//     try {
//       let { data: covenants } = await supabase
//         .from('covenant')
//         .select('*')
//         .eq('company_id', company?.id)
//         .eq('is_active', true)
//         .eq('guild_id', guild_id);

//       // .eq('guild_id(is_active)', true)

//       setData({
//         ...data,

//         covenants: (covenants || [])?.map((e) => {
//           return {
//             name: e.name as string,
//             id: e.id as string,
//             number: e.number as string,
//             guild_id: e.guild_id as string,
//             is_active: e.is_active,
//           };
//         }),
//       });
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       // Muestra un mensaje de error al usuario
//       toast.error('Error fetching data');
//     }
//   };

//   // useEffect(() => {

//   // }, [])

//   const fetchCategory = async (covenant_id: string) => {
//     let { data: category } = await supabase
//       .from('category')
//       .select('*')
//       .eq('covenant_id', covenant_id)
//       .eq('is_active', true);

//     setData({
//       ...data,
//       category: category as any,
//     });
//   };

//   function onSubmit() {
//     setOpen(false);
//     form.reset({
//       guild: '',
//       covenants: '',
//       category: '',
//     });

//     return 'convenio registrado correctamente';
//   }

//   const handleOpen = () => {
//     setOpen(true);
//     form.reset({
//       guild: '',
//       covenants: '',
//       category: '',
//     });
//     setSearchText('');
//     setShowCovenants(false);
//     setShowCategories(false);
//     setShowButton(true);
//     setShowButton2(true);
//   };
//   const handleClose = () => {
//     form.reset({
//       guild: '',
//       covenants: '',
//       category: '',
//     });
//     setSearchText('');
//   };
//   return (
//     <div className="flex items-center justify-between space-y-0">
//       <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
//         <AlertDialogTrigger asChild>
//           <Button variant="default" className="ml-2" onClick={() => handleOpen()}>
//             Nuevo Convenio
//           </Button>
//         </AlertDialogTrigger>
//         <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
//           <AlertDialogTitle>Registrar Sindicatos y Convenios</AlertDialogTitle>
//           <AlertDialogHeader>
//             <AlertDialogDescription asChild>
//               <Form {...form}>
//                 <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
//                   <div>
//                     <FormField
//                       control={form.control}
//                       name="guild"
//                       render={({ field }) => (
//                         <FormItem className="flex flex-col min-w-[250px] ">
//                           <FormLabel>Asosiacion gremial</FormLabel>
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <FormControl>
//                                 <Button
//                                   disabled={readOnly}
//                                   variant="outline"
//                                   role="combobox"
//                                   value={field.value}
//                                   className={cn(
//                                     'w-[400px] justify-between overflow-hidden',
//                                     !field.value && 'text-muted-foreground'
//                                   )}
//                                 >
//                                   {field.value || 'Seleccionar  Asosiacion gremial'}
//                                   <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                 </Button>
//                               </FormControl>
//                             </PopoverTrigger>
//                             <PopoverContent className="w-[400px] p-0 max-h-[200px] overflow-y-auto" asChild>
//                               <Command>
//                                 <CommandInput
//                                   disabled={readOnly}
//                                   placeholder="Buscar Asosiacion gremial..."
//                                   value={searchText}
//                                   onValueChange={(value: any) => setSearchText(value)}
//                                   className="h-9 overflow-hidden"
//                                 />
//                                 <CommandEmpty className="py-2 px-2 overflow-hidden">
//                                   <ModalCct modal="addGuild" fetchGuild={fetchGuild} searchText={searchText}>
//                                     <Button
//                                       disabled={readOnly}
//                                       variant="outline"
//                                       role="combobox"
//                                       className={cn(
//                                         'w-full justify-between overflow-hidden',
//                                         !field.value && 'text-muted-foreground'
//                                       )}
//                                     >
//                                       Agregar Asosiacion gremial
//                                       <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                     </Button>
//                                   </ModalCct>
//                                 </CommandEmpty>
//                                 <CommandGroup className="max-h-[200px] overflow-y-auto">
//                                   {data.guild?.map((option) => (
//                                     <CommandItem
//                                       value={option.name}
//                                       key={option.name}
//                                       onSelect={() => {
//                                         form.setValue('guild', option.name);

//                                         const guild_id = data?.guild?.find((e) => e.id === option?.id);

//                                         setGuildId((guild_id as any) || null);

//                                         fetchData(guild_id?.id as any);
//                                         form.setValue('covenants', '');
//                                       }}
//                                     >
//                                       {option.name}
//                                       <CheckIcon
//                                         className={cn(
//                                           'ml-auto h-4 w-4',
//                                           option.name === field.value ? 'opacity-100' : 'opacity-0'
//                                         )}
//                                       />
//                                     </CommandItem>
//                                   ))}
//                                 </CommandGroup>
//                               </Command>
//                             </PopoverContent>
//                           </Popover>
//                           <FormDescription>Selecciona la Asosiacion Gremial</FormDescription>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     {showButton && (
//                       <Button
//                         onClick={() => {
//                           setShowCovenants(true);
//                           setShowButton(false);
//                         }}
//                       >
//                         Agregar Convenio
//                       </Button>
//                     )}
//                     {showCovenants && (
//                       <>
//                         <FormField
//                           control={form.control}
//                           name="covenants"
//                           render={({ field }) => (
//                             <FormItem className="flex flex-col min-w-[250px] ">
//                               <FormLabel>Convenio</FormLabel>
//                               <Popover>
//                                 <PopoverTrigger asChild>
//                                   <FormControl>
//                                     <Button
//                                       disabled={readOnly}
//                                       variant="outline"
//                                       role="combobox"
//                                       value={field.value || ''}
//                                       className={cn(
//                                         'w-[400px] justify-between overflow-hidden',
//                                         !field.value && 'text-muted-foreground'
//                                       )}
//                                     >
//                                       {field.value || 'Seleccionar Convenio'}
//                                       <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                     </Button>
//                                   </FormControl>
//                                 </PopoverTrigger>
//                                 <PopoverContent className="w-[400px] p-0 max-h-[200px] overflow-y-auto" asChild>
//                                   <Command>
//                                     <CommandInput
//                                       disabled={readOnly}
//                                       placeholder="Buscar convenio..."
//                                       onValueChange={(value: any) => setSearchText(value)}
//                                       className="h-9"
//                                     />
//                                     <CommandEmpty className="py-2 px-2">
//                                       <ModalCct
//                                         modal="addCovenant"
//                                         fetchData={fetchData}
//                                         guildId={guildId}
//                                         searchText={searchText}
//                                       >
//                                         <Button
//                                           disabled={readOnly}
//                                           variant="outline"
//                                           role="combobox"
//                                           className={cn(
//                                             'w-full justify-between overflow-hidden',
//                                             !field.value && 'text-muted-foreground'
//                                           )}
//                                         >
//                                           Agregar Convenio
//                                           <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                         </Button>
//                                       </ModalCct>
//                                     </CommandEmpty>
//                                     <CommandGroup className="max-h-[200px] overflow-y-auto">
//                                       {data.covenants?.map((option) => (
//                                         <CommandItem
//                                           value={option.name}
//                                           key={option.name}
//                                           onSelect={() => {
//                                             form.setValue('covenants', option.name);
//                                             const covenant_id = data.covenants.find((e) => e.id === option?.id);

//                                             setCovenantId((covenant_id?.id as any) || null);

//                                             fetchCategory(covenant_id?.id as any);
//                                             form.setValue('category', '');
//                                           }}
//                                         >
//                                           {option.name}
//                                           <CheckIcon
//                                             className={cn(
//                                               'ml-auto h-4 w-4',
//                                               option.name === field.value ? 'opacity-100' : 'opacity-0'
//                                             )}
//                                           />
//                                         </CommandItem>
//                                       ))}
//                                     </CommandGroup>
//                                   </Command>
//                                 </PopoverContent>
//                               </Popover>
//                               <FormDescription>Selecciona el convenio</FormDescription>
//                               <FormMessage />
//                             </FormItem>
//                           )}
//                         />
//                         {showButton2 && (
//                           <Button
//                             onClick={() => {
//                               setShowCategories(true);
//                               setShowButton2(false); // Esto hará que el botón desaparezca después de ser clickeado
//                             }}
//                             // Otras propiedades del botón
//                           >
//                             Agregar Categoría
//                           </Button>
//                         )}
//                       </>
//                     )}
//                     {showCategories && (
//                       <FormField
//                         control={form.control}
//                         name="category"
//                         render={({ field }) => (
//                           <FormItem className="flex flex-col min-w-[250px]">
//                             <FormLabel> Categoría</FormLabel>
//                             <Popover>
//                               <PopoverTrigger asChild>
//                                 <FormControl>
//                                   <Button
//                                     disabled={readOnly}
//                                     variant="outline"
//                                     role="combobox"
//                                     className={cn(
//                                       'w-[300px] justify-between overflow-hidden',
//                                       !field.value && 'text-muted-foreground'
//                                     )}
//                                   >
//                                     {field.value || 'Seleccionar Categoría'}
//                                     <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                   </Button>
//                                 </FormControl>
//                               </PopoverTrigger>
//                               <PopoverContent className="w-[300px] p-0" asChild>
//                                 <Command>
//                                   <CommandInput
//                                     disabled={readOnly}
//                                     placeholder="Buscar categoria..."
//                                     onValueChange={(value: any) => setSearchText(value)}
//                                     className="h-9"
//                                   />
//                                   <CommandEmpty className="py-2 px-2">
//                                     <ModalCct
//                                       modal="addCategory"
//                                       fetchCategory={fetchCategory}
//                                       covenant_id={covenantId as any}
//                                       covenantOptions={data.category as any}
//                                       searchText={searchText}
//                                     >
//                                       <Button
//                                         disabled={readOnly}
//                                         variant="outline"
//                                         role="combobox"
//                                         className={cn(
//                                           'w-full justify-between overflow-hidden',
//                                           !field.value && 'text-muted-foreground'
//                                         )}
//                                       >
//                                         Agregar Categoría
//                                         <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                       </Button>
//                                     </ModalCct>
//                                   </CommandEmpty>
//                                   <CommandGroup className="max-h-[200px] overflow-y-auto">
//                                     <>
//                                       {data.category?.map((option) => (
//                                         <CommandItem
//                                           value={option.name}
//                                           key={option.id}
//                                           onSelect={() => {
//                                             form.setValue('category', option.name);
//                                           }}
//                                         >
//                                           {option.name}
//                                           <CheckIcon
//                                             className={cn(
//                                               'ml-auto h-4 w-4',
//                                               option.name === field.value ? 'opacity-100' : 'opacity-0'
//                                             )}
//                                           />
//                                         </CommandItem>
//                                       ))}
//                                     </>
//                                     <>
//                                       <ModalCct
//                                         modal="addCategory"
//                                         fetchCategory={fetchCategory}
//                                         covenant_id={covenantId}
//                                         covenantOptions={data.covenants}
//                                       >
//                                         <Button
//                                           disabled={readOnly}
//                                           variant="outline"
//                                           role="combobox"
//                                           className={cn(
//                                             'w-full justify-between overflow-hidden',
//                                             !field.value && 'text-muted-foreground'
//                                           )}
//                                         >
//                                           Agregar Categoría
//                                           <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                         </Button>
//                                       </ModalCct>
//                                     </>
//                                   </CommandGroup>
//                                 </Command>
//                               </PopoverContent>
//                             </Popover>
//                             <FormDescription>Selecciona la categoría</FormDescription>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     )}
//                   </div>
//                   <div className="flex justify-end gap-4">
//                     <AlertDialogCancel onClick={handleClose}>Cerrar</AlertDialogCancel>
//                     <AlertDialogCancel className={buttonVariants({ variant: 'default' })} onClick={handleClose}>
//                       Agregar
//                     </AlertDialogCancel>
//                     {/* <Button type="submit">Agregar</Button> */}
//                   </div>
//                 </form>
//               </Form>
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// };
