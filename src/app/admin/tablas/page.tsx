import { supabase } from '../../../../supabase/supabase';
import CardTable from '../components/tableCard';

export default async function TablasPage() {
  let { data: diagrams, error } = await supabase.from('work-diagram').select('*');

  let { data: industry_type } = await supabase.from('industry_type').select('*');

  let { data: hierarchy } = await supabase.from('hierarchy').select('*');

  let { data: types_of_vehicles } = await supabase.from('types_of_vehicles').select('*');

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        {/* <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="all">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="diagramas">Diagramas</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="archived" className="hidden sm:flex">
                  Archived
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Filter
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                      Active
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Draft</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Archived
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="outline" className="h-7 gap-1">
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                  </span>
                </Button>
                <Button size="sm" className="h-7 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Nuevo
                  </span>
                </Button>
              </div>
            </div>
            <TabsContent value="diagramas">
              <DiagramTable/>
            </TabsContent>
          </Tabs>
        </main> */}
        <div className="grid grid-cols-3 gap-4 px-4">
          <CardTable title={'Tipo de Industria'} data={industry_type} dbName={'industry_type'} />
          <CardTable title={'Tipo de Puesto'} data={hierarchy} dbName={'hierarchy'} />
          <CardTable title={'Tipo de Equipo'} data={types_of_vehicles} dbName={'types_of_vehicles'} />
          <CardTable title={'Diagrama de Trabajo'} data={diagrams} dbName={'work-diagram'} />
        </div>
      </div>
    </div>
  );
}
