import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    let { data: documents, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `*,
      document_types(*),
      applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
  `
      )
      .eq('applies.company_id', company_id || '')
      .not('applies', 'is', null);

    if (equipmentError) {
      throw new Error(JSON.stringify(equipmentError));
    }
    return Response.json({ equipmentDocuments: documents });
  } catch (error) {
    console.log(error);
  }
}
