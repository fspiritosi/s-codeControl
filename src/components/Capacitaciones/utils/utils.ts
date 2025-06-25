import { supabaseBrowser } from '@/lib/supabase/browser';

/**
 * Normaliza un string para usarlo como nombre de carpeta o archivo
 * Elimina acentos, caracteres especiales y espacios
 */
export const normalizeString = (str: string): string => {
  return str
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Eliminar caracteres especiales
    .trim() // Eliminar espacios al inicio y final
    .toLowerCase() // Convertir a minúsculas
    .replace(/\s+/g, '-'); // Reemplazar espacios con guiones
};

/**
 * Sube un archivo al bucket de materiales y devuelve la URL
 * @param file Archivo a subir
 * @param trainingId ID de la capacitación 
 * @param trainingTitle Título de la capacitación para crear una carpeta significativa
 */
export const uploadMaterialFile = async (file: File, trainingId: string, trainingTitle?: string) => {
  try {
    const supabase = supabaseBrowser();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // Crear nombre de carpeta basado en el título si está disponible, de lo contrario usar el ID
    const folderName = trainingTitle 
      ? `${normalizeString(trainingTitle)}-${trainingId.substring(0, 8)}` 
      : `training-${trainingId}`;
    
    const filePath = `${folderName}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage.from('training-materials').upload(filePath, file);

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError);
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage.from('training-materials').getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl, path: filePath };
  } catch (error: any) {
    console.error('Error inesperado al subir archivo:', error);
    return { success: false, error: error.message };
  }
};
