import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest){
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('actual');
    const user_id = searchParams.get('user');

    try {
        let { data: diagram_type, error } = await supabase
        .from('diagram_type')
        .select("*")
        .eq('company_id', company_id)
        
        const data = diagram_type;
        // console.log(data)
        if (error) {
          throw new Error(JSON.stringify(error));
        }
        
        return Response.json({ data });      
    } catch (error) { 
        console.log(error);
    }
   

}


export async function POST(request: NextRequest){
    const supabase = supabaseServer();
    const bodyData = await request.json()


    try {
        const { data, error } = await supabase
    .from('diagram_type')
    .insert([
    { name: bodyData.name, company_id: '0dd82eb6-67f9-477e-ae57-774f23c64f8c', color: bodyData.color, short_description: bodyData.short_description  },
    ])
    
    if(!error){ return Response.json(data)}
    console.log(error)


    } catch (error) {
        console.log(error)
    }
    

}