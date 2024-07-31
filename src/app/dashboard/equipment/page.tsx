import Viewcomponent from '@/components/ViewComponent';
import { useLoggedUserStore } from '@/store/loggedUser';
import { cookies } from 'next/headers';
import { columns } from './columns';
import { DataEquipment } from './data-equipment';

export default async function Equipment() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const allCompany = useLoggedUserStore.getState().allCompanies;
  const cookiesStore = cookies();
  const actualCompanyId = cookiesStore.get('actualComp')?.value;
  const showInactive = false;

  const res = await fetch(`${URL}/api/equipment/${actualCompanyId}`, { cache: 'no-store' });
  const info = await res.json();

  const onlyVehicles = info.info?.filter((v: { type_of_vehicle: number }) => v.type_of_vehicle === 1);
  const onlyNoVehicles = info.info?.filter((v: { type_of_vehicle: number }) => v.type_of_vehicle === 2);

  return (
    <Viewcomponent
      viewData={{
        defaultValue: 'equipos',
        tabsValues: [
          {
            value: 'equipos',
            name: 'Todos',
            restricted: [],
            content: {
              title: 'Equipos totales',
              description: 'Todos los equipos',
              buttonActioRestricted: [''],
              component: (
                <div className="w-full grid grid-cols-1 px-8">
                  <DataEquipment
                    columns={columns}
                    data={info.info}
                    allCompany={allCompany}
                    showInactive={showInactive}
                  />
                </div>
              ),
            },
          },
          {
            value: 'vehicles',
            name: 'Vehículos',
            restricted: [],
            content: {
              title: 'Vehículos',
              description: 'Solo Vehículos',
              buttonActioRestricted: [''],
              component: (
                <div className="w-full grid grid-cols-1 px-8">
                  <DataEquipment
                    columns={columns}
                    data={onlyVehicles}
                    allCompany={allCompany}
                    showInactive={showInactive}
                  />
                </div>
              ),
            },
          },
          {
            value: 'others',
            name: 'Otros Equipos',
            restricted: [],
            content: {
              title: 'Otros Equipos',
              buttonActioRestricted: [''],
              description: 'Todos los Equipos no vehículos',
              component: (
                <div className="w-full grid grid-cols-1 px-8">
                  <DataEquipment
                    columns={columns}
                    data={onlyNoVehicles}
                    allCompany={allCompany}
                    showInactive={showInactive}
                  />
                </div>
              ),
            },
          },
        ],
      }}
    />
  );
}
