import { getUsersbyId } from '@/app/server/GET/actions';
import BackButton from '@/components/BackButton';
import EditButton from '@/components/EditButton';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import UserForm from '@/components/users/UserForm';
import { cn } from '@/lib/utils';

async function User({ params }: { params: { id: string } }) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const data: any = await getUsersbyId({ id: params.id });

  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card className={cn('col-span-8 flex flex-col justify-between overflow-hidden')}>
        <CardHeader className="min-h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
          <div className="flex gap-4 items-center">
            <CardTitle className=" font-bold tracking-tight">
              <Avatar className="size-[100px] rounded-full border-2 border-black/30">
                <AvatarImage
                  className="object-cover rounded-full"
                  src={
                    data[0].profile_id?.avatar ||
                    'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'
                  }
                  alt="Imagen del empleado"
                />
              </Avatar>
            </CardTitle>
            <CardDescription className="text-muted-foreground text-3xl flex flex-col  gap-4">
              <div className="flex">{data[0]?.profile_id?.fullname || ''}</div>
              <p className="text-sm">{data[0]?.profile_id?.email || ''}</p>
            </CardDescription>
          </div>
          <div className="flex flex-grap gap-2">
            <EditButton />
            <BackButton />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-8 p-6">
          <CardTitle className="text-lg">Modulos habilitados para el usuario</CardTitle>
          <UserForm userData={data[0]} />
          <CardDescription>* Destildar para quitar permisos al usuario</CardDescription>
        </CardContent>

        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}

export default User;
