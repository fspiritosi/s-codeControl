
import React from 'react'
import Viewcomponent from '@/components/ViewComponent';
import DailyReport from '@/components/DailyReport/DailyReport';
import ViewDailyReports from '@/components/DailyReport/ViewDailysReports';
import DailyReportDetail from '@/components/DailyReport/DailyReportDetail';
import Create from '@/components/DailyReport/Create';
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
              buttonAction: (<Create />),
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
              buttonAction: (''),
              component: <DailyReportDetail />,
            },
          },
          // {
          //   value: 'dailyReports',
          //   name: 'Crear parte diario',
          //   restricted: [''],
          //   content: {
          //     title: 'Crear parte diario',
          //     description: 'Aquí se crean los partes diarios',
          //     buttonActioRestricted: [''],
          //     buttonAction: (''),
          //     component: <DailyReport />,
          //   },
          // },
        ],
        
      };
    
      return (
        <div className="h-full">
          <Viewcomponent viewData={viewData} />
        </div>
      );
    }
    
    export default OperationsPage;

