// import { DocumentationDrawer } from '@/components/DocumentationDrawer';
// import { Card, CardFooter } from '@/components/ui/card';
// import { cn } from '@/lib/utils';
// import { revalidatePath } from 'next/cache';
// import { supabase } from '../../../../../supabase/supabase';
// import VehiclesForm from '../../../../components/VehiclesForm';

// export default async function EquipmentFormAction({ searchParams, params }: { searchParams: any; params: any }) {
//   const { data } = await supabase
//     .from('documents_equipment')
//     .select('*,id_document_types(*)')
//     .eq('applies', searchParams.id);
//   revalidatePath('/dashboard/equipment/action');

//   return (
//     <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
//       <Card
//         className={cn(
//           'col-span-6 flex flex-col justify-between overflow-hidden',
//           searchParams.action === 'new' && 'col-span-8'
//         )}
//       >
//         <VehiclesForm id={searchParams.id} />
//         <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
//       </Card>
//       {searchParams.action === 'new' ? (
//         false
//       ) : (
//         <Card className="xl:max-w-[40vw]  col-span-2 flex flex-col justify-center w-full overflow-hidden">
//           <DocumentationDrawer id={searchParams.id as string} resource="equipo" />
//           <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
//         </Card>
//       )}
//     </section>
//   );
// }
