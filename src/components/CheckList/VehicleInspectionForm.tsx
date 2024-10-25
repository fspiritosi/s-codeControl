'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  movil: z.string().min(1, { message: 'Movil is required' }),
  dominio: z.string().min(1, { message: 'Dominio is required' }),
  kilometraje: z.string().min(1, { message: 'Kilometraje is required' }),
  chofer: z.string().min(1, { message: 'Chofer is required' }),
  observaciones: z.string().optional(),
});

const checkItems = [
  {
    category: 'LUCES',
    items: [
      'Asientos (Estado en general)',
      'Luces Altas',
      'Luces Bajas',
      'Luces de Giro',
      'Balizas',
      'Luces de Retroceso',
      'Luces Freno',
      'Luces de Estacionamiento',
    ],
  },
  {
    category: 'INTERIOR',
    items: [
      'Funcionamiento Tacógrafo (Microtrack)',
      'Funciones de tablero (luces testigo)',
      'Bocina',
      'Alarma de Retroceso',
      'Calefactor Desempañador',
      'Aire Acondicionado',
      'Limpia Parabrisas y Lava Parabrisas',
      'Parasol',
      'Luneta',
      'Ventanilla (apertura)',
      'Ventanilla (Cierre)',
      'Puertas (cierre efectivo)',
      'Espejo retrovisor',
      'Espejos laterales',
      'Cortinas/ Sogas / Soportes',
      'Cinturones de seguridad',
      'Apoya cabezas',
    ],
  },
  {
    category: 'Seguridad /Accesorios',
    items: [
      'BOTIQUIN PRIMEROS AUXILIOS',
      'Balizas triangulares / conos',
      'Chalecos reflectantes',
      'Apoya cabezas',
      'Revisión check Point/check Nut',
      'Arrestallamas',
      'Airbags frontales',
      'Matafuego',
    ],
  },
  {
    category: 'MECANICA/MOTOR',
    items: [
      'Suspensión (Amortiguadores)',
      'Criquet (Gato) y llave de rueda',
      'Filtro de Aire: Motor/Habitaculo Sopletear',
      'Batería/Estado',
      'Nivel de fluidos y pérdidas',
      'Sistema de Freno (ABS)',
      'Nivel de fluidos y pérdidas',
      'Cartelería de velocidad máxima',
      'Bandas laterales reflectivas',
      'Nivel de combustible',
      'Neumatico de auxilio',
      'Neumaticos Delanteros',
      'Neumaticos Traseros',
      'Esparragos y Torque',
      'Elementos sueltos',
      'Bolsas para depósito de residuos',
      'Limpieza de Cabina y Exterior',
    ],
  },
];

export default function VehicleInspectionForm() {
  const { control, handleSubmit } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movil: '',
      dominio: '',
      kilometraje: '',
      chofer: '',
      observaciones: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // console.log(values);
  }

  return (
    <Card className="w-full  mx-auto">
      <CardHeader className="bg-blue-600 text-white">
        <CardTitle className="text-2xl font-bold text-center">CHECK LIST INSPECCION VEHICULAR</CardTitle>
        <div className="text-sm text-center">Transporte SP-ANAY - CHK - HYS - 01</div>
        <div className="text-sm text-center">Vigencia: 10-09-2024 REV: 00</div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="movil">MOVIL</Label>
              <Controller
                name="movil"
                control={control}
                render={({ field }) => <Input id="movil" placeholder="MOVIL" {...field} />}
              />
            </div>
            <div>
              <Label htmlFor="dominio">DOMINIO</Label>
              <Controller
                name="dominio"
                control={control}
                render={({ field }) => <Input id="dominio" placeholder="DOMINIO" {...field} />}
              />
            </div>
            <div>
              <Label htmlFor="kilometraje">KILOMETRAJE</Label>
              <Controller
                name="kilometraje"
                control={control}
                render={({ field }) => <Input id="kilometraje" placeholder="KILOMETRAJE" {...field} />}
              />
            </div>
            <div>
              <Label htmlFor="chofer">CHOFER</Label>
              <Controller
                name="chofer"
                control={control}
                render={({ field }) => <Input id="chofer" placeholder="CHOFER" {...field} />}
              />
            </div>
          </div>

          {checkItems.map((category, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-semibold">{category.category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-2">
                    <Checkbox id={`${category.category.toLowerCase().replace(/ /g, '_')}_${itemIndex}`} />
                    <Label htmlFor={`${category.category.toLowerCase().replace(/ /g, '_')}_${itemIndex}`}>{item}</Label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <h3 className="font-semibold">Lectura de Vitran</h3>
            <div className="grid grid-cols-4 gap-2">
              {['DD', 'DI', 'TD', 'TI'].map((tire, index) => (
                <div key={index}>
                  <Label htmlFor={`tire_${tire.toLowerCase()}`}>{tire}</Label>
                  <Input id={`tire_${tire.toLowerCase()}`} placeholder={tire} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones:</Label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => <Input id="observaciones" placeholder="Observaciones" {...field} />}
            />
          </div>

          <Button type="submit" className="w-full">
            Enviar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
