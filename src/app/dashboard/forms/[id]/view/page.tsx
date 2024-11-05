import { fetchAllEquipment, fetchAnswerById } from '@/app/server/GET/actions';
import DynamicFormWrapper from '@/components/CheckList/DynamicFormWrapper';

async function page({ params }: { params: { id: string } }) {
  // console.log('params', params);
  const answer = await fetchAnswerById(params.id);
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

  return (
    <div className="px-7">
      <DynamicFormWrapper
        formType={answer[0].form_id.name as any} // or "dynamic"
        equipments={equipments}
        form_Info={[answer[0]?.form_id]}
        defaultAnswer={answer}
      />
    </div>
  );
}

export default page;
