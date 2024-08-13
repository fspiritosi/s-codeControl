import Viewcomponent from '@/components/ViewComponent';
import CreatedForm from './components/CreatedForm';
import NewForm from './components/NewForm';

function MandenimientoPage() {
  const viewData = {
    defaultValue: 'Creados',
    tabsValues: [
      {
        value: 'Creados',
        name: 'Creados',
        restricted: [''],
        content: {
          title: 'Formularios creados',
          description: 'Aquí encontrarás todos los formularios creados',
          buttonActioRestricted: [''],
          component: <CreatedForm />,
        },
      },
      {
        value: 'Nuevos',
        name: 'Crear nuevo formulario',
        restricted: [''],
        content: {
          title: 'Crear nuevo formulario',
          description: 'Aquí podras crear un nuevo formulario',
          buttonActioRestricted: [''],
          component: <NewForm />,
        },
      },
      // {
      //   value: 'Cargados',
      //   name: 'Formularios cargados',
      //   restricted: [''],
      //   content: {
      //     title: 'Formularios cargados',
      //     description: 'Aquí encontrarás todos los formularios cargados',
      //     buttonActioRestricted: [''],
      //     component: <FormCustomContainer showAnswers={true} employees={true} company={true}  documents={true} equipment={true} />,
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

export default MandenimientoPage;
