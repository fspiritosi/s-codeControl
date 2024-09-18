import QrActionSelector from '@/components/QR/AcctionSelector';
import { supabaseServer } from '@/lib/supabase/server';
import { setVehiclesToShow } from '@/lib/utils/utils';
import { TypeOfRepair } from '@/types/types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const employee = cookiesStore.get('empleado_id')?.value;
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!employee && !user?.id) {
    redirect('/maintenance');
  }

  const { equipments } = await fetch(`${URL}/api/equipment/${params.id}`).then((e) => e.json());

  const { types_of_repairs } = await fetch(`${URL}/api/repairs?actual=${equipments[0].company_id}`).then((res) =>
    res.json()
  );

  const vehiclesFormatted = setVehiclesToShow(equipments || []) || [];

  return (
    <QrActionSelector
      employee={employee}
      user={user}
      employee_id={employee}
      equipment={vehiclesFormatted}
      tipo_de_mantenimiento={types_of_repairs as TypeOfRepair}
      default_equipment_id={params.id}
    />
  );
}
