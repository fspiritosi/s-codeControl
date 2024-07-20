'use client';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { ModalCct } from './ModalCct';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { handleSupabaseError } from '@/lib/errorHandler';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../supabase/supabase';
import { Button } from './ui/button';
import { CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Toggle } from './ui/toggle';
import { error } from 'console';
import Error from 'next/error';
type dataType = {
    guild: {
        name: string;
        id: string;
        is_active: boolean;

    }[];
    covenants: {
        name: string;
        number: string
        guild_id: string;
        id: string;
        is_active: boolean;
    }[];
    category: {
        name: string;
        id: string;
        covenant_id: string;
        is_active: boolean;
    }[];

};
export const CovenantRegister = () => {
    // const [showPasswords, setShowPasswords] = useState(false);
    const [open, setOpen] = useState(false);
    const ownerUser = useLoggedUserStore((state) => state.profile);
    // const [activeTab, setActiveTab] = useState('InviteUser');
    // const [clientData, setClientData] = useState<any>(null);
    const [covenantId, setCovenantId] = useState()
    // const [selectedRole, setSelectedRole] = useState('');
    const company = useLoggedUserStore((state) => state.actualCompany);
    // const [userType, setUserType] = useState<'Usuario' | 'Invitado' | null>(null);
    const searchParams = useSearchParams()
    const document = searchParams.get('document')
    const [searchText, setSearchText] = useState()
    const [accion, setAccion] = useState(searchParams.get('action'))
    const [readOnly, setReadOnly] = useState(accion === 'view' ? true : false)
    const [guildId, setGuildId] = useState()
    
    
    const [guildData, setGuildData] = useState<dataType>({
        guild: [],
        covenants: [],
        category: [],
    });
    const [data, setData] = useState<dataType>({
        guild: [],
        covenants: [],
        category: [],
    });


    const covenantRegisterSchema = z
        .object({
            guild: z.string().min(2, {
                message: 'El nombre debe tener al menos 2 caracteres.',
            })
                .max(30, {
                    message: 'El nombre debe tener menos de 30 caracteres.',
                })
                .regex(/^[a-zA-Z ]+$/, {
                    message: 'El nombre solo puede contener letras.',
                })
                .trim(),
            covenants: z.string()
                .min(2, {
                    message: 'El convenio debe tener al menos 2 caracteres.',
                })
                .max(30, {
                    message: 'El convenio debe tener menos de 30 caracteres.',
                })

                .trim()
                // .regex(/^[a-zA-Z ]+$/, {
                //     message: 'El apellido solo puede contener letras.',
                // })
                .optional(),
            category: z.string()
                .min(1, {
                    message: 'La categoria debe tener al menos 1 caracteres.',
                })
                .max(30, {
                    message: 'La categoria debe tener menos de 30 caracteres.',
                })

                .trim(),

        });


    const form = useForm<z.infer<typeof covenantRegisterSchema>>({
        resolver: zodResolver(covenantRegisterSchema),
        defaultValues: {
            guild: '',
            covenants: '',
            category: '',

        },
    });

    // const [roles, setRoles] = useState<any[] | null>([]);

    // const getRoles = async () => {
    //     let { data: roles, error } = await supabase.from('roles').select('*').eq('intern', false).neq("name", "Invitado");
    //     setRoles(roles);
    // };
    

    const fetchGuild = async () => {
        try {
            let { data: guilds } = await supabase
                .from('guild')
                .select('*')
                .eq('company_id', company?.id)
                .eq('is_active', true)
            

            setData({
                ...data,

                guild: (guilds || [])?.map((e) => {
                    return { name: e.name as string, id: e.id as string, is_active: e.is_active };
                }),

            });
        } catch (error) {
            console.error('Error fetching data:', error);
            // Muestra un mensaje de error al usuario
            toast.error('Error fetching data');
        }
    };

    

    const fetchData = async (guild_id: string) => {
        try {
            let { data: covenants } = await supabase
                .from('covenant')
                .select('*, guild_id(is_active)')
                .eq('company_id', company?.id)
                .eq('guild_id', guild_id)
                .eq('guild_id(is_active)', true)


            setData({
                ...data,

                covenants: (covenants || [])?.map((e) => {
                    return { name: e.name as string, id: e.id as string, number: e.number as string, guild_id: e.guild_id as string, is_active: e.is_active };
                }),

            });
        } catch (error) {
            console.error('Error fetching data:', error);
            // Muestra un mensaje de error al usuario
            toast.error('Error fetching data');
        }
    };
    

    useEffect(() => {
        fetchGuild()
    }, [])
    
        
    
    
    

    const fetchCategory = async (covenant_id: string) => {
        let { data: category } = await supabase
            .from('category')
            .select('*')
            .eq('covenant_id', covenant_id);

        setData({
            ...data,
            category: category as any,
        });
        
    };

    function onSubmit(values: z.infer<typeof covenantRegisterSchema>) {
        
        setOpen(false);


        return 'convenio registrado correctamente';

    }
    const channels = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'covenant' }, (payload) => {
      
    })
    .subscribe();

  const channels1 = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild' }, (payload) => {
      fetchGuild();
    })
    .subscribe();

    

    const handleOpen = () => {
        setOpen(true);
    };

    return (
        <div className="flex items-center justify-between space-y-0">
            <CardHeader className="w-full flex flex-row justify-between items-start bg-muted dark:bg-muted/50 ">
            </CardHeader >

            <div>
                <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>

                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className='ml-2' onClick={() => handleOpen()}>Agregar Convenio</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
                        <AlertDialogTitle>Registrar Sindicatos y Convenios</AlertDialogTitle>

                        <AlertDialogHeader>
                            <AlertDialogDescription asChild>
                                <Form {...form}>
                                    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>

                                        <div>
                                            <FormField
                                                control={form.control}
                                                name="guild"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col min-w-[250px] " >
                                                        <FormLabel>
                                                            Asosiacion gremial<span style={{ color: 'red' }}>*</span>
                                                        </FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        disabled={readOnly}
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        value={field.value}
                                                                        className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                                                                    >
                                                                        {field.value || 'Seleccionar  Asosiacion gremial'}
                                                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-0 max-h-[200px] overflow-y-auto" asChild>
                                                                <Command >
                                                                    <CommandInput
                                                                        disabled={readOnly}
                                                                        placeholder="Buscar  Asosiacion gremial..."
                                                                        value={searchText}
                                                                        onValueChange={(value: any) => setSearchText(value)}
                                                                        className="h-9" />
                                                                    <CommandEmpty className="py-2 px-2">
                                                                        <ModalCct modal="addGuild"
                                                                            fetchGuild={fetchGuild}
                                                                            searchText={searchText}
                                                                        >
                                                                            <Button
                                                                                disabled={readOnly}
                                                                                variant="outline"
                                                                                role="combobox"
                                                                                className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                                                            >
                                                                                Agregar Asosiacion gremial
                                                                                <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                            </Button>
                                                                        </ModalCct>
                                                                    </CommandEmpty>
                                                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                                        {data.guild?.map((option) => (
                                                                            <CommandItem
                                                                                value={option.name}
                                                                                key={option.name}
                                                                                onSelect={() => {
                                                                                    form.setValue('guild', option.name);
                                                                                    const guild_id = data.guild.find((e) => e.id === option?.id);
                                                                                    
                                                                                    setGuildId(guild_id?.id as any || null)
                                                                                    
                                                                                    fetchData(guild_id?.id as any);
                                                                                    form.setValue('covenants', '');
                                                                                }}
                                                                            >
                                                                                {option.name}
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        'ml-auto h-4 w-4',
                                                                                        option.name === field.value ? 'opacity-100' : 'opacity-0'
                                                                                    )}
                                                                                />
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormDescription>Selecciona la Asosiacion Gremial</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="covenants"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col min-w-[250px] ">
                                                        <FormLabel>
                                                            Convenio <span style={{ color: 'red' }}>*</span>
                                                        </FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        disabled={readOnly}
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        value={field.value}
                                                                        className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                                                                    >
                                                                        {field.value || 'Seleccionar Convenio'}
                                                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-0 max-h-[200px] overflow-y-auto" asChild>
                                                                <Command>
                                                                    <CommandInput
                                                                        disabled={readOnly}
                                                                        placeholder="Buscar convenio..."
                                                                        onValueChange={(value: any) => setSearchText(value)}
                                                                        className="h-9" />
                                                                    <CommandEmpty className="py-2 px-2">
                                                                        <ModalCct modal="addCovenant"
                                                                            fetchData={fetchData}
                                                                            guildId={guildId}
                                                                            searchText={searchText}
                                                                        >
                                                                            <Button
                                                                                disabled={readOnly}
                                                                                variant="outline"
                                                                                role="combobox"
                                                                                className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                                                            >
                                                                                Agregar Convenio
                                                                                <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                            </Button>
                                                                        </ModalCct>
                                                                    </CommandEmpty>
                                                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                                        {data.covenants?.map((option) => (
                                                                            <CommandItem
                                                                                value={option.name}
                                                                                key={option.name}
                                                                                onSelect={() => {
                                                                                    form.setValue('covenants', option.name);
                                                                                    const covenant_id = data.covenants.find((e) => e.id === option?.id);
                                                                                    
                                                                                    setCovenantId(covenant_id?.id as any || null)
                                                                                    
                                                                                    fetchCategory(covenant_id?.id as any);
                                                                                    form.setValue('category', '');
                                                                                }}
                                                                            >
                                                                                {option.name}
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        'ml-auto h-4 w-4',
                                                                                        option.name === field.value ? 'opacity-100' : 'opacity-0'
                                                                                    )}
                                                                                />
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormDescription>Selecciona el convenio</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col min-w-[250px]">
                                                        <FormLabel>
                                                            {' '}
                                                            Categoría <span style={{ color: 'red' }}>*</span>
                                                        </FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        disabled={readOnly}
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                                                                    >
                                                                        {field.value || 'Seleccionar Categoría'}
                                                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-0" asChild>
                                                                <Command>
                                                                    <CommandInput
                                                                        disabled={readOnly}
                                                                        placeholder="Buscar categoria..."
                                                                        onValueChange={(value: any) => setSearchText(value)}
                                                                        className="h-9" />
                                                                    <CommandEmpty className="py-2 px-2">
                                                                        <ModalCct modal="addCategory"
                                                                            fetchCategory={fetchCategory}
                                                                            covenant_id={covenantId as any}
                                                                            covenantOptions={data.category as any}
                                                                            searchText={searchText}
                                                                        >
                                                                            <Button
                                                                                disabled={readOnly}
                                                                                variant="outline"
                                                                                role="combobox"
                                                                                className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                                                            >
                                                                                Agregar Categoría
                                                                                <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                            </Button>
                                                                        </ModalCct>
                                                                    </CommandEmpty>
                                                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                                        <>
                                                                            {data.category?.map((option) => (
                                                                                <CommandItem
                                                                                    value={option.name}
                                                                                    key={option.id}
                                                                                    onSelect={() => {
                                                                                        form.setValue('category', option.name);
                                                                                    }}

                                                                                >
                                                                                    {option.name}
                                                                                    <CheckIcon
                                                                                        className={cn(
                                                                                            'ml-auto h-4 w-4',
                                                                                            option.name === field.value ? 'opacity-100' : 'opacity-0'
                                                                                        )}
                                                                                    />
                                                                                </CommandItem>
                                                                            ))}
                                                                        </>
                                                                        <>
                                                                            <ModalCct modal="addCategory"
                                                                                fetchCategory={fetchCategory} covenant_id={covenantId} covenantOptions={data.covenants}
                                                                            >
                                                                                <Button
                                                                                    disabled={readOnly}
                                                                                    variant="outline"
                                                                                    role="combobox"
                                                                                    className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                                                                >
                                                                                    Agregar Categoría
                                                                                    <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                </Button>
                                                                            </ModalCct>
                                                                        </>
                                                                    </CommandGroup>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormDescription>Selecciona la categoría</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-4">
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <Button type="submit">Agregar</Button>
                                        </div>
                                    </form>
                                </Form>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            {/* </CardHeader > */}
        </div >
    );
};
