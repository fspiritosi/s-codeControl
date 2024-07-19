import { supabase } from "../../../../supabase/supabase"




export async function GET() {

    try {
        let { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        
    
        const info = vehicles 

        return Response.json({ info })
        
    } catch (error) {
        throw new Error('No hay respuesta')
    }

  }

  