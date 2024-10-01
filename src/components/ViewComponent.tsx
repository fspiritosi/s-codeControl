import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseServer } from '@/lib/supabase/server';
import { getActualRole } from '@/lib/utils';
import { cookies } from 'next/headers';

interface ViewDataObj {
  defaultValue: string;
  tabsValues: {
    value: string;
    name: string;
    restricted: string[];
    content: {
      title: string;
      description: string;
      buttonActioRestricted: string[];
      buttonAction?: React.ReactNode;
      component: React.ReactNode;
    };
  }[];
}

export default async function Viewcomponent({ viewData }: { viewData: ViewDataObj }) {
  const supabase = supabaseServer();
  const user = await supabase.auth.getUser();
  const cookiesStore = cookies();
  const actualCompany = cookiesStore.get('actualComp')?.value;
  const role = await getActualRole(actualCompany as string, user?.data?.user?.id as string);

  return (
    <div className="flex flex-col gap-6 py-4 px-6 h-full ">
      <Tabs defaultValue={viewData.defaultValue}>
        <TabsList className="flex gap-1 justify-start w-fit">
          {viewData.tabsValues.map((tab, index) => {
            if (tab.restricted.includes(role)) return;
            return (
              <TabsTrigger key={crypto.randomUUID()} value={tab.value} id={tab.value}>
                {tab.name}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {viewData.tabsValues.map((tab, index) => (
          <TabsContent key={crypto.randomUUID()} value={tab.value}>
            <Card className="overflow-hidden">
              <CardHeader className="w-full flex bg-muted dark:bg-muted/50 border-b-2 flex-row justify-between">
                <div className="w-fit">
                  <CardTitle className="text-2xl font-bold tracking-tight w-fit">{tab.content.title}</CardTitle>
                  <CardDescription className="text-muted-foreground w-fit">{tab.content.description}</CardDescription>
                </div>
                {tab.content.buttonActioRestricted?.includes(role) ? false : tab.content.buttonAction}
              </CardHeader>
              <CardContent className="py-4 px-4 ">{tab.content.component}</CardContent>
              <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
