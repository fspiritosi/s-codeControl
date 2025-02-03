import {
  fetchAllEquipment,
  fetchAnswerById,
  fetchSingEmployee,
  findEmployeeByFullName,
} from '@/app/server/GET/actions';
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
  const choferName = (answer[0].answer as any)?.chofer;
  let singurl : any = '';

  if (choferName) {
    const data = await findEmployeeByFullName(choferName);
    if (data?.id) {
      const singEmployee = await fetchSingEmployee(data?.id);
      singurl = singEmployee  || ''
    }
  }


  return (
    <div className="px-7">
      <DynamicFormWrapper
        formType={answer[0].form_id.name as any} // or "dynamic"
        equipments={equipments}
        form_Info={[answer[0]?.form_id]}
        defaultAnswer={answer}
        singurl={singurl}
      />
    </div>
  );
}

export default page;
