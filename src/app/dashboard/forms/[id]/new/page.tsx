import { fetchAllEquipment, fetchCustomFormById, getCurrentProfile } from '@/app/server/GET/actions';
import { dailyChecklistConfig } from '@/components/CheckList/DynamicChecklistForm';
import DynamicFormWrapper from '@/components/CheckList/DynamicFormWrapper';

async function page({ params }: { params: { id: string } }) {
  const equipments = (await fetchAllEquipment()).map((equipment) => ({
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

  // console.log('params', params);

  const currentUser = await getCurrentProfile();
  const formInfo = await fetchCustomFormById(params.id);
  // console.log('formInfo', formInfo?.[0].name);
  return (
    <div className="px-7">
      {/* <VehicleInspectionChecklist equipments={equipments} form_Info={formInfo} currentUser={currentUser} /> */}
      <DynamicFormWrapper
        formType={formInfo?.[0].name as any} // or "dynamic"
        equipments={equipments}
        currentUser={currentUser}
        form_Info={formInfo}
        dynamicFormConfig={dailyChecklistConfig} // Pass your dynamic form configuration here
      />
    </div>
  );
}

export default page;
