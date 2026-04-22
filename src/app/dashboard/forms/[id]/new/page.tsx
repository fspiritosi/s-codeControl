import { fetchAllEquipment } from '@/modules/equipment/features/list/actions.server';
import { fetchCustomFormById } from '@/modules/forms/features/custom-forms/actions.server';
import { getCurrentProfile } from '@/shared/actions/auth';
import { dailyChecklistConfig } from '@/modules/hse/features/checklist/components/DynamicChecklistForm';
import DynamicFormWrapper from '@/modules/hse/features/checklist/components/DynamicFormWrapper';

async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipments = (await fetchAllEquipment()).map((equipment: any) => ({
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
  }));


  const currentUser = await getCurrentProfile();
  const formInfo = await fetchCustomFormById(id);
  return (
    <div className="px-7">
      {/* <VehicleInspectionChecklist equipments={equipments} form_Info={formInfo} currentUser={currentUser} /> */}
      <DynamicFormWrapper
        formType={formInfo?.[0].name as any} // or "dynamic"
        equipments={equipments}
        currentUser={currentUser as any}
        form_Info={formInfo as any}
        dynamicFormConfig={dailyChecklistConfig} // Pass your dynamic form configuration here
      />
    </div>
  );
}

export default page;
