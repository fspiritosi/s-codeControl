import { MissingDocumentList } from '@/components/MissingDocumentList'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'


export default async function Customers() {
  // const actualCompany = cookies().get('actualComp')
  // const supabase = supabaseServer()

  // const { data: company, error: profileError } = await supabase
  //   .from('company')
  //   .select('*')
  //   .eq('id', actualCompany?.value)

  // console.log(company, 'company')

  return (
    <div>
      <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        
        <CardTitle className="text-[2vw]">Bienvenido a Clientes</CardTitle>
      </section>
      <section className="md:mx-7 grid grid-cols-1 mt-6 xl:grid-cols-2 gap-3 mb-4">
        <Card className="col-span-2 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="flex flex-row items-start bg-muted dark:bg-muted/50 border-b-2">
              <div className="grid gap-1">
                <CardTitle className="flex items-center text-lg ">
                  Clientes y Contactos
                </CardTitle>
                <CardDescription className="capitalize">
                  Todos tus Clientes
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent></CardContent>
            <div>
              <Tabs defaultValue="Clientes">
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="Clientes">Clientes</TabsTrigger>
                    <TabsTrigger value="Contactos">Contactos</TabsTrigger>
                  </TabsList>
                </CardContent>
                
              </Tabs>
            </div>
          </div>
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
        
      </section>
    </div>
  )
}
