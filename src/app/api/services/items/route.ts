import { supabaseServer } from '@/lib/supabase/server';
import { is } from 'date-fns/locale';
import { NextRequest,NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('actual');
    const user_id = searchParams.get('user');
    console.log(company_id)
    //console.log(user_id); //AQUI ME QUEDE
    try {
        let { data: items, error } = await supabase
            .from('service_items')
            .select('*')
            // Filters

            .eq('company_id', company_id);
        console.log(items);


        if (error) {
            throw new Error(JSON.stringify(error));
        }
        return Response.json({ items });
    } catch (error) {
        console.log(error);
    }
}

export async function POST(request: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    let company_id = searchParams.get('actual');
    console.log('Company ID:', company_id);
    const user_id = searchParams.get('user');
    const sercices_id = searchParams.get('service');
    const body = await request.json();
    const { costumer_service_id, item_name, item_description, item_measure_units, item_price, costumer_id } = body;
    company_id = company_id ? company_id.replace(/['"]/g, '') : null;

    try {
        let { data: items, error } = await supabase
            .from('service_items')
            .insert({
                costumer_service_id: costumer_service_id,
                costumer_id: costumer_id,
                item_name: item_name,
                item_description: item_description,
                item_measure_units: item_measure_units,
                item_price: item_price,
                company_id: company_id
            });

        console.log('Inserted Items:', items);
        if (error) {
            console.error('Supabase Error:', error);
            throw new Error(JSON.stringify(error));
        }
        return NextResponse.json({ items });
    } catch (error: any) {
        console.error('Catch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('actual');
    const user_id = searchParams.get('user');
    const id = searchParams.get('id');
    const body = await request.json();
    const { item_name,item_description,item_measure_units, item_price, is_active, costumer_id } = body;
    
    
    try {
        let { data: items, error } = await supabase
            .from('service_items')
            .update({
                item_name: item_name,
                item_description: item_description,
                item_measure_units: item_measure_units,
                item_price: item_price,
                is_active: is_active,
                costumer_id: costumer_id
            })
            .eq('id', id)
        console.log(items);
        if (error) {
            throw new Error(JSON.stringify(error));
        }
        return Response.json({ items });
    } catch (error) {
        console.log(error);
    }
}