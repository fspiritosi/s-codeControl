
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';


export async function getTotalResourses(){
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { employees } = await fetch(`${URL}/api/employees?actual=${company_id}&user=${user?.id}`).then((e) => e.json());
  const { data:vehicles } = await fetch(`${URL}/api/equipment?actual=${company_id}&user=${user?.id}`).then((e) => e.json());

  return {
    totalResourses: employees.length + vehicles.length,
    employees: employees.length,
    vehicles: vehicles.length,
  };
}