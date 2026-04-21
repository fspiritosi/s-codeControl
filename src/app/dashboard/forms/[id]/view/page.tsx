import { fetchSingEmployee } from '@/modules/employees/features/detail/actions.server';
import { findEmployeeByFullName } from '@/modules/employees/features/list/actions.server';
import { fetchAllEquipment } from '@/modules/equipment/features/list/actions.server';
import { fetchAnswerById } from '@/modules/forms/features/answers/actions.server';
import DynamicFormWrapper from '@/modules/hse/features/checklist/components/DynamicFormWrapper';

async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answer = await fetchAnswerById(id);
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
  const choferName = (answer[0].answer as any)?.chofer;
  let singurl : any = '';

  if (choferName) {
    const data = await findEmployeeByFullName(choferName);
    if (data?.id) {
      const singEmployee = await fetchSingEmployee(data?.id as string);
      singurl = singEmployee  || ''
    }
  }


  return (
    <div className="px-7">
      <DynamicFormWrapper
        formType={(answer[0] as any).form?.name} // or "dynamic"
        equipments={equipments}
        form_Info={[(answer[0] as any)?.form]}
        defaultAnswer={answer as any}
        singurl={singurl}
      />
    </div>
  );
}

export default page;
