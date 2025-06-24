import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateTypes() {
  try {
    // Obtener los tipos actuales
    const { data, error } = await supabase.rpc('get_table_types');
    
    if (error) {
      console.error('Error al obtener los tipos:', error);
      process.exit(1);
    }

    // Generar el contenido del archivo de tipos
    const typesContent = `// Este archivo es generado automáticamente. No lo edites manualmente.
// Para actualizar los tipos, ejecuta: npx ts-node scripts/generate-types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      hse_documents: {
        Row: {
          id: string
          title: string
          description: string | null
          version: string
          file_path: string
          file_name: string
          file_size: number
          file_type: string
          upload_date: string
          status: 'active' | 'inactive' | 'pending'
          created_by: string
          created_at: string
          updated_at: string
          company_id: string
          expiry_date: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          version: string
          file_path: string
          file_name: string
          file_size: number
          file_type: string
          upload_date?: string
          status?: 'active' | 'inactive' | 'pending'
          created_by: string
          created_at?: string
          updated_at?: string
          company_id: string
          expiry_date?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          version?: string
          file_path?: string
          file_name?: string
          file_size?: number
          file_type?: string
          upload_date?: string
          status?: 'active' | 'inactive' | 'pending'
          created_by?: string
          created_at?: string
          updated_at?: string
          company_id?: string
          expiry_date?: string | null
        }
      }
      hse_document_versions: {
        Row: {
          id: string
          document_id: string
          version: string
          file_url: string
          file_name: string
          file_size: number
          file_type: string
          change_log: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          version: string
          file_url: string
          file_name: string
          file_size: number
          file_type: string
          change_log: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          version?: string
          file_url?: string
          file_name?: string
          file_size?: number
          file_type?: string
          change_log?: string
          created_by?: string
          created_at?: string
        }
      }
    }
  }
}
`;

    // Escribir el archivo de tipos
    const outputPath = join(process.cwd(), 'src/types/supabase.types.ts');
    writeFileSync(outputPath, typesContent);
    
    console.log(`✅ Tipos generados correctamente en: ${outputPath}`);
  } catch (error) {
    console.error('Error al generar los tipos:', error);
    process.exit(1);
  }
}

generateTypes();
