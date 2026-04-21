import { prisma } from '@/shared/lib/prisma';
import CardTable from '@/modules/admin/features/tables/components/TableCard';

export default async function TablasPage() {
  const diagrams = await prisma.work_diagram.findMany();

  const industry_type = await prisma.industry_type.findMany();

  const hierarchy = await prisma.hierarchy.findMany();

  const types_of_vehicles = await prisma.types_of_vehicles.findMany();

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
