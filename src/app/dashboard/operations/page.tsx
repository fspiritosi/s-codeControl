import Create from '@/components/DailyReport/Create';
import DailyReportDetail from '@/components/DailyReport/DailyReportDetail';
import ViewDailyReports from '@/components/DailyReport/ViewDailysReports';
import Viewcomponent from '@/components/ViewComponent';
function OperationsPage() {
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
    <div className="h-full">
      <Viewcomponent viewData={viewData} />
    </div>
  );
}

export default OperationsPage;
