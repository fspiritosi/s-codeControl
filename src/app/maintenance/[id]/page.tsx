import { fetchCustomForms } from '@/modules/forms/features/custom-forms/actions.server';
import QrActionSelector from '@/modules/equipment/features/qr/components/AcctionSelector';
import { prisma } from '@/shared/lib/prisma';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { serializeBigInt } from '@/shared/lib/utils';
import { setVehiclesToShow } from '@/shared/lib/utils/utils';
import { TypeOfRepair } from '@/shared/types/types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function fetchEquipmentForMaintenance(id: string) {
  return prisma.vehicles.findMany({
    where: { id },
    include: {
      type_of_vehicle_rel: { select: { name: true } },
      brand_rel: { select: { name: true } },
      model_rel: { select: { name: true } },
      type_rel: { select: { name: true } },
    },
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const cookiesStore = await cookies();
  const supabase = await supabaseServer();
  const employee = cookiesStore.get('empleado_id')?.value;
  const empleado_name = cookiesStore.get('empleado_name')?.value;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!employee && !user?.id) {
    redirect('/maintenance');
  }

  const equipmentsRaw = await fetchEquipmentForMaintenance(id);

  if (!equipmentsRaw.length) {
    redirect('/maintenance');
  }

  const eq = equipmentsRaw[0] as any;
  const companyId = eq.company_id as string;

  const [typesOfRepairs, sharedUsers, pendingRepairs, checklistsRaw] = await Promise.all([
    prisma.types_of_repairs.findMany({ where: { company_id: companyId } }),
    user?.id
      ? prisma.share_company_users.findMany({
          where: { company_id: companyId, profile_id: user.id },
        })
      : Promise.resolve([] as any[]),
    prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: id,
        state: { in: ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] },
      },
      include: {
        user: true,
        employee: true,
        equipment: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
        reparation_type_rel: true,
        repairlogs: {
          include: {
            employee: true,
            user: true,
          },
        },
      },
    }),
    fetchCustomForms(companyId) as Promise<unknown>,
  ]);

  const role = user?.id ? (sharedUsers as any[])?.[0]?.role : undefined;
  const checklists = checklistsRaw as unknown as CheckListWithAnswer[];

  const equipments = serializeBigInt(
    equipmentsRaw.map((v: any) => {
      const { type_of_vehicle_rel, brand_rel, model_rel, ...rest } = v;
      return {
        ...rest,
        types_of_vehicles: type_of_vehicle_rel,
        brand_vehicles: brand_rel,
        model_vehicles: model_rel,
      };
    })
  ) as any[];

  const vehiclesFormatted = setVehiclesToShow(equipments || []) || [];

  const equipmentsForComboBox = [
    {
      label: eq.domain
        ? `${eq.domain} - ${eq.intern_number}`
        : `${eq.serie} - ${eq.intern_number}`,
      value: eq.id,
      domain: eq.domain,
      serie: eq.serie,
      kilometer: eq.kilometer ?? '0',
      model: eq.model_rel?.name ?? null,
      brand: eq.brand_rel?.name ?? null,
      intern_number: eq.intern_number,
      vehicle_type: eq.type_rel?.name ?? '',
    },
  ];
  const currentEquipment = equipmentsForComboBox[0];

  return (
    <QrActionSelector
      user={user}
      employee_id={employee}
      equipment={vehiclesFormatted}
      tipo_de_mantenimiento={typesOfRepairs as unknown as TypeOfRepair}
      default_equipment_id={id}
      role={role}
      pendingRequests={pendingRepairs as any}
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
