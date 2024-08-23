import Viewcomponent from '@/components/ViewComponent';
function MantenimientoPage() {
  const viewData = {
    defaultValue: 'show_created_forms',
    tabsValues: [
    
      {
        value: 'create_new_form',
        name: 'Crear nuevo formulario',
        restricted: [''],
        content: {
          title: 'Crear nuevo formulario',
          description: 'Aquí podrás crear un nuevo formulario',
          buttonActioRestricted: [''],
          component: <NewForm />,
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

export default MantenimientoPage;
