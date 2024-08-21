import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpiredDataTable } from "../../data-table";
import { useLoggedUserStore } from '@/store/loggedUser';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';

interface Document {
    date: string;
    allocated_to: string;
    documentName: string;
    multiresource: string;
    validity: string;
    id: string;
    resource: string;
    state: string;
    document_path?: string;
    is_active: boolean;
    isItMonthly: boolean;
    applies: string;
    mandatory: string;
    id_document_types: string;
  }




export default function EquipmentDocumentsTable (
    {  
        AllvaluesToShow, 
        clientData
    }
    :
    {
        AllvaluesToShow: {employees: Document[]; vehicles: Document[];};
        clientData: any[] | null;
    }
){
    const role = useLoggedUserStore((state) => state.roleActualCompany);
    const vehiclesData = useLoggedUserStore((state) => state.vehiclesToShow);
    const employees = useLoggedUserStore((state) => state.employeesToShow);
    const filteredCustomers = employees?.filter((customer: any) =>
        customer?.allocated_to?.includes(clientData?.[0]?.customer_id)
    );
    
    const filteredEquipment = vehiclesData?.filter((customer: any) =>
        customer.allocated_to?.includes(clientData?.[0]?.customer_id)
    );
    const filteredCustomersEquipmentRaw = AllvaluesToShow?.vehicles.filter((e) => !e.isItMonthly);
    const filteredCustomersEquipmentRawMonthly = AllvaluesToShow?.vehicles.filter((e) => e.isItMonthly);
    
    const filteredCustomersEquipment = filteredCustomersEquipmentRaw?.filter((customer: any) => {
        const customerResource = customer?.resource_id; // Asumiendo que es una cadena
        const equipmentFullnames = filteredEquipment?.map((emp: any) => emp.id); // Array de cadenas
        return equipmentFullnames?.includes(customerResource);
    });
    
    const filteredCustomersEquipmentMonthly = filteredCustomersEquipmentRawMonthly?.filter((customer: any) => {
        const customerResource = customer?.resource_id; // Asumiendo que es una cadena
        const employeeFullnames = filteredCustomers?.map((emp: any) => emp.id); // Array de cadenas
        return employeeFullnames?.includes(customerResource);
    });




    return(

        <Tabs defaultValue="permanentes">
          <CardContent>
            <TabsList>
              <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
              <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
            </TabsList>
          </CardContent>
          <TabsContent value="permanentes">
            <ExpiredDataTable
              data={
                role === 'Invitado'
                  ? filteredCustomersEquipment
                  : AllvaluesToShow?.vehicles.filter((e) => !e.isItMonthly) || []
              }
              columns={ExpiredColums}
              pending={true}
              vehicles
              defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
              localStorageName={'dashboardVehiculosPermanentes'}
              permanent
            />
          </TabsContent>
          <TabsContent value="mensuales">
            <ExpiredDataTable
              data={
                role === 'Invitado'
                  ? filteredCustomersEquipmentMonthly
                  : AllvaluesToShow?.vehicles.filter((e) => e.isItMonthly) || []
              }
              columns={ColumnsMonthly}
              pending={true}
              vehicles
              defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
              localStorageName={'dashboardVehiculosMensuales'}
              monthly
            />
          </TabsContent>
        </Tabs>
    )
}