import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

async function User({ params }: { params: { id: string } }) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const { data } = await fetch(`${URL}/api/profile?user=${params.id}`).then((e) => e.json());

  console.log('profile', data);

  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card className={cn('col-span-8 flex flex-col justify-between overflow-hidden')}>
        <CardHeader className="min-h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
          <header className="flex justify-between gap-4 flex-wrap">
            <CardHeader className="min-h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
              <div className="flex gap-3 items-center">
                <CardTitle className=" font-bold tracking-tight">
                  <Avatar className="size-[100px] rounded-full border-2 border-black/30">
                    <AvatarImage
                      className="object-cover rounded-full"
                      src={
                        data[0]?.avatar ||
                        'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'
                      }
                      alt="Imagen del empleado"
                    />
                    {/* <AvatarFallback>
                        <Loader className="animate-spin" />
                      </AvatarFallback> */}
                  </Avatar>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-3xl flex flex-col  gap-4">
                  <div className="flex">{data[0]?.fullname || ''}</div>
                  <p className="text-lg">{data[0]?.role}</p>
                  <p className="text-sm">{data[0]?.email}</p>
                  {/* {!data[0].is_active && <Badge variant={'destructive'}>Dado de baja</Badge>} */}
                </CardDescription>
              </div>

              {/* {role !== 'Invitado' && readOnly && accion === 'view' ? (
                <div className="flex flex-grap gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      setReadOnly(false);
                    }}
                  >
                    Habilitar edición
                  </Button>
                  <BackButton />
                </div>
              ) : (
                !readOnly &&
                accion !== 'new' &&
                role !== 'Invitado' && (
                  <div className="flex flex-grap gap-2">
                    <Dialog onOpenChange={() => setShowModal(!showModal)}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">Dar de baja</Button>
                      </DialogTrigger>
                      <BackButton />
                      <DialogContent className="dark:bg-slate-950">
                        <DialogTitle>Dar de baja</DialogTitle>
                        <DialogDescription>
                          ¿Estás seguro de que deseas eliminar este empleado?
                          <br /> Completa los campos para continuar.
                        </DialogDescription>
                        <AlertDialogFooter>
                          <div className="w-full">
                            <Form {...form2}>
                              <form onSubmit={form2.handleSubmit(onDelete)} className="space-y-8">
                                <FormField
                                  control={form2.control}
                                  name="reason_for_termination"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Motivo de baja</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecciona la razón" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Despido sin causa">Despido sin causa</SelectItem>
                                          <SelectItem value="Renuncia">Renuncia</SelectItem>
                                          <SelectItem value="Despido con causa">Despido con causa</SelectItem>
                                          <SelectItem value="Acuerdo de partes">Acuerdo de partes</SelectItem>
                                          <SelectItem value="Fin de contrato">Fin de contrato</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormDescription>
                                        Elige la razón por la que deseas eliminar al empleado
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form2.control}
                                  name="termination_date"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Fecha de baja</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={'outline'}
                                              className={cn(
                                                ' pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                              )}
                                            >
                                              {field.value ? (
                                                format(field.value, 'PPP', {
                                                  locale: es,
                                                })
                                              ) : (
                                                <span>Elegir fecha</span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2" align="start">
                                          <Select
                                            onValueChange={(e) => {
                                              setMonth(new Date(e));
                                              setYear(e);
                                              const newYear = parseInt(e, 10);
                                              const dateWithNewYear = new Date(field.value);
                                              dateWithNewYear.setFullYear(newYear);
                                              field.onChange(dateWithNewYear);
                                              setMonth(dateWithNewYear);
                                            }}
                                            value={years || today.getFullYear().toString()}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Elegir año" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                              <SelectItem
                                                value={today.getFullYear().toString()}
                                                disabled={years === today.getFullYear().toString()}
                                              >
                                                {today.getFullYear().toString()}
                                              </SelectItem>
                                              {yearsAhead?.map((year) => (
                                                <SelectItem key={year} value={`${year}`}>
                                                  {year}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Calendar
                                            month={month}
                                            onMonthChange={setMonth}
                                            toDate={today}
                                            locale={es}
                                            mode="single"
                                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                            selected={new Date(field.value) || today}
                                            onSelect={(e) => {
                                              field.onChange(e);
                                            }}
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormDescription>Fecha en la que se terminó el contrato</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex gap-4 justify-end">
                                  <Button variant="destructive" type="submit">
                                    Eliminar
                                  </Button>
                                  <DialogClose>Cancelar</DialogClose>
                                </div>
                              </form>
                            </Form>
                          </div>
                        </AlertDialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )
              )} */}
            </CardHeader>
          </header>
        </CardHeader>
        <div>Usuario: {data[0]?.fullname}</div>
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}

export default User;
