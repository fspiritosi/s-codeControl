import { fetchAllEquipment, fetchCustomForms } from '@/app/server/GET/actions';
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
  const empleado_name = cookiesStore.get('empleado_name')?.value;
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!employee && !user?.id) {
    redirect('/maintenance');
  }

  let role: any;
  const { equipments } = await fetch(`${URL}/api/equipment/${params.id}`).then((e) => e.json());

  if (user?.id) {
    const { shared_user } = await fetch(
      `${URL}/api/shared_company_role?company_id=${equipments[0].company_id}&profile_id=${user?.id}`
    ).then((e) => e.json());

    role = shared_user?.[0]?.role;

    //console.log(shared_user, 'role');
  }
  const { types_of_repairs } = await fetch(`${URL}/api/repairs?actual=${equipments[0].company_id}`).then((res) =>
    res.json()
  );

  const { data, error } = await supabase
    .from('repair_solicitudes')
    .select(
      '*,user_id(*),employee_id(*),equipment_id(*,type(*),brand(*),model(*)),reparation_type(*),repairlogs(*,modified_by_employee(*),modified_by_user(*))'
    )
    .eq('equipment_id', params.id)
    .in('state', ['Pendiente', 'Esperando repuestos', 'En reparación']);

  // console.log(data, 'data');
  // console.log(error, 'error');

  const vehiclesFormatted = setVehiclesToShow(equipments || []) || [];

  const checklists = await fetchCustomForms(equipments[0].company_id);

  const equipmentsForComboBox = (await fetchAllEquipment(equipments[0].company_id)).map((equipment) => ({
    label: equipment.domain
      ? `${equipment.domain} - ${equipment.intern_number}`
      : `${equipment.serie} - ${equipment.intern_number}`,
    value: equipment.id,
    domain: equipment.domain,
    serie: equipment.serie,
    kilometer: equipment.kilometer ?? '0',
    model: equipment.model.name,
    brand: equipment.brand.name,
    intern_number: equipment.intern_number,
    vehicle_type: equipment.type.name,
  }));
  const currentEquipment = equipmentsForComboBox.find((equipment) => equipment.value === params.id);

  // console.log(checklists, 'checklists');

  console.log(role, 'role');
  console.log(checklists, 'checklists');

  // console.log(currentEquipment, 'currentEquipment');
  return (
    <QrActionSelector
      user={user}
      employee_id={employee}
      equipment={vehiclesFormatted}
      tipo_de_mantenimiento={types_of_repairs as TypeOfRepair}
      default_equipment_id={params.id}
      role={role}
      pendingRequests={data as any}
      checkList={
        checklists
          .filter(
            (checklist) =>
              (checklist.form as { vehicle_type: string[] }).vehicle_type.includes(
                currentEquipment?.vehicle_type || ''
              ) || (checklist.form as { vehicle_type: string[] }).vehicle_type.includes('all')
          )
          .filter((checklist) => {
            if (
              (role === 'Invitado' || employee) &&
              (checklist?.form as any)?.title === 'Transporte SP-ANAY - CHK - HYS - 03'
            ) {
              return false;
            } else {
              return true;
            }
          }) || []
      }
      equipmentsForComboBox={equipmentsForComboBox}
      empleado_name={empleado_name}
    />
  );
}
