import React from 'react'
import Viewcomponent from '@/components/ViewComponent';
import DailyReport from '@/components/DailyReport/DailyReport';
import ViewDailyReports from '@/components/DailyReport/ViewDailysReports';
import CreateDailyReport from '@/components/DailyReport/CreateDailyReport';
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
              buttonAction: (<CreateDailyReport />),
              component: <ViewDailyReports />,
            },
          },
          {
            value: 'dailyReports',
            name: 'Reportes diarios',
            restricted: [''],
            content: {
              title: 'Crear parte diario',
              description: 'Aquí se crean los partes diarios',
              buttonActioRestricted: [''],
              buttonAction: (''),
              component: <DailyReport />,
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
