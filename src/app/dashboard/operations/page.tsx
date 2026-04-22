import Create from '@/modules/operations/features/daily-reports/components/Create';
import DailyReportDetail from '@/modules/operations/features/daily-reports/components/DailyReportDetail';
import ViewDailyReports from '@/modules/operations/features/daily-reports/components/ViewDailysReports';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { Suspense } from 'react';
import DayliReportSkeleton from '@/shared/components/common/Skeletons/DayliReportSkeleton';

async function OperationsPage() {
  const viewData = {
    defaultValue: 'dailyReportsTable',
    tabsValues: [
      {
        value: 'dailyReportsTable',
        name: 'Partes diarios',
        restricted: [''],
        content: {
          title: 'Ver partes diarios',
          description: 'Aquí encontrarás todos los partes diarios diarios',
          buttonActioRestricted: [''],
          buttonAction: <Create />,
          component: <ViewDailyReports />,
        },
      },
      {
        value: 'dailyReportsDetailTable',
        name: 'Detalle de Partes diarios',
        restricted: [''],
        content: {
          title: 'Ver detalle de partes diarios',
          description: 'Aquí encontrarás todos los detalles de los partes diarios',
          buttonActioRestricted: [''],
          buttonAction: '',
          component: <DailyReportDetail />,
        },
      },
    ],
  };

  return (
    <Suspense fallback={<DayliReportSkeleton />}>
      <div className="h-full">
        <Viewcomponent viewData={viewData} />
      </div>
    </Suspense>
  );
}

export default OperationsPage;
