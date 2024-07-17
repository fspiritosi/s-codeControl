import Viewcomponent from '@/components/ViewComponent';
import TypesDocumentsView from '../document/documentComponents/TypesDocumentsView';
import Customers from '../company/customers/Customers';

export default async function page() {
 // return <ReportAnIssue />;
  return (
    <Viewcomponent 
      viewData={
        {
          defaultValue: "general",
          tabsValues:[
            {
              value: "general",
              name:"General", 
              restricted: ["usuario"],
              content:{
                title: "Empresa",
                description: "Datos generales de la compañía",
                component: <div>Hola Yordan</div>,
              }
            },
            {
              value: "documents",
              name:"Documentacion",
              restricted: [] , 
              content:{
              title: "Documentación",
              description: "Documentos generales de la compañía",
              component: <TypesDocumentsView equipos personas />,
            }},
            {
              value: "clients",
              name:"Clientes",
              restricted: [] , 
              content:{
              title: "Clientes",
              description: "Documentos generales de la Clientes",
              component: <Customers />,

            }},
          ]
        }
      }
    />
  )

}
