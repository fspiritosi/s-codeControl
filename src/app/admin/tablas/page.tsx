import { supabase } from '../../../../supabase/supabase';
import CardTable from '../components/tableCard';

export default async function TablasPage() {
  let { data: diagrams, error } = await supabase.from('work-diagram').select('*');

  let { data: industry_type } = await supabase.from('industry_type').select('*');

  let { data: hierarchy } = await supabase.from('hierarchy').select('*');

  let { data: types_of_vehicles } = await supabase.from('types_of_vehicles').select('*');

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <div className="grid grid-cols-3 gap-4 px-4">
          <CardTable title={'Tipo de Industria'} data={industry_type} dbName={'industry_type'} />
          <CardTable title={'Tipo de Puesto'} data={hierarchy} dbName={'hierarchy'} />
          <CardTable title={'Tipo de Equipo'} data={types_of_vehicles} dbName={'types_of_vehicles'} />
          <CardTable title={'Diagrama de Trabajo'} data={diagrams} dbName={'work-diagram'} />
        </div>
      </div>
    </div>
  );
}
