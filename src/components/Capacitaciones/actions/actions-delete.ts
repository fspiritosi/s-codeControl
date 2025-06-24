'use server';

/**
 * Elimina una capacitación y todos sus datos relacionados
 * Solo permite eliminar capacitaciones en estado "Borrador"
//  */
// export const deleteTraining = async (trainingId: string) => {
//   try {
//     const supabase = supabaseServer();

//     // 4. Eliminar materiales
//     const { data: materials, error: materialsError } = await supabase
//       .from('training_materials')
//       .select()
//       .eq('training_id', trainingId);

//     if (materialsError) {
//       console.error('Error al eliminar materiales:', materialsError);
//       return { success: false, error: 'Error al eliminar materiales de la capacitación' };
//     }
//     const documentsUrl = materials.map((material) => material.file_url);
//     await supabase.storage.from('documents').remove(documentsUrl);
//     await supabase.from('training_materials').delete().eq('training_id', trainingId);

//     // 5. Finalmente eliminar la capacitación
//     const { error: deleteError } = await supabase.from('trainings').delete().eq('id', trainingId);

//     if (deleteError) {
//       console.error('Error al eliminar capacitación:', deleteError);
//       return { success: false, error: 'Error al eliminar la capacitación' };
//     }

//     // Revalidar rutas para actualizar la UI
//     revalidatePath('/dashboard/hse');

//     return {
//       success: true,
//       message: 'Capacitación eliminada exitosamente',
//     };
//   } catch (error: any) {
//     console.error('Error inesperado al eliminar capacitación:', error);
//     return {
//       success: false,
//       error: `Error al eliminar capacitación: ${error.message}`,
//     };
//   }
// };
