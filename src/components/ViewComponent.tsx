
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ViewDataObj {
    defaulValue: string,
    tabsValues: {
        value:string,
        name: string,
        restricted: string[],
        content: {
          title: string,
          description: string,
          buttonAction?: React.ReactNode,
          component:React.ReactNode
        }
    }[],
}

export default function Viewcomponent({viewData}:{viewData:ViewDataObj}) {
    const role = "invitado"
  return (
    <div className="flex flex-col gap-6 py-4 px-6">
      <Tabs defaultValue={viewData.defaulValue} >
        <TabsList>
            {viewData.tabsValues.map((tab, index) => {
                if( tab.restricted.includes(role)) return
                return (
                    <TabsTrigger key={index} value={tab.value}>{tab.name}</TabsTrigger>
                )
            })}
        </TabsList>
        {
            viewData.tabsValues.map((tab, index) => (
                <TabsContent key={index} value={tab.value}>
                              <Card className="overflow-hidden">
            <CardHeader className="w-full flex bg-muted dark:bg-muted/50 border-b-2 flex-row justify-between">
              <div className="w-fit">
                <CardTitle className="text-2xl font-bold tracking-tight w-fit">{tab.content.title}</CardTitle>
                <CardDescription className="text-muted-foreground w-fit">{tab.content.description}</CardDescription>
              </div>
                
                
                {tab.content.buttonAction}
              {/* <Button className="w-fit" onClick={handleEditCompany}>
                Editar Compañía
              </Button> */}
            </CardHeader>
            <CardContent className="py-4 px-4 ">
            {tab.content.component}
            </CardContent>
            <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
          </Card>
                </TabsContent>
            ))
        }
      </Tabs>
    </div>
  );
}
