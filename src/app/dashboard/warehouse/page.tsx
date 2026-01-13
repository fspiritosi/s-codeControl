import Create from '@/components/DailyReport/Create';
import DailyReportDetail from '@/components/DailyReport/DailyReportDetail';
import ViewDailyReports from '@/components/DailyReport/ViewDailysReports';
import Viewcomponent from '@/components/ViewComponent';
function WarehousePage() {
  const viewData = {
    defaultValue: 'warehouseTable',
    tabsValues: [
      {
        value: 'warehouseTable',
        name: 'Almacenes',
        restricted: [''],
        content: {
          title: 'Listado de Almacenes',
          description: 'Aquí encontrarás todos los almacenes',
          buttonActioRestricted: [''],
          buttonAction: <Create />,
          component: <div>Listado de Almacenes</div>,
        },
      },
      {
        value: 'dailyReportsDetailTable',
        name: 'Articulos',
        restricted: [''],
        content: {
          title: 'Ver detalle de partes diarios',
          description: 'Aquí encontrarás todos los detalles de los partes diarios',
          buttonActioRestricted: [''],
          buttonAction: '',
          component: <DailyReportDetail />,
        },
      },
      {
        value: 'dailyReportsDetailTable',
        name: 'Marcas',
        restricted: [''],
        content: {
          title: 'Ver detalle de partes diarios',
          description: 'Aquí encontrarás todos los detalles de los partes diarios',
          buttonActioRestricted: [''],
          buttonAction: '',
          component: <DailyReportDetail />,
        },
      },
      {
        value: 'dailyReportsDetailTable',
        name: 'Modelos',
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

export default WarehousePage;
