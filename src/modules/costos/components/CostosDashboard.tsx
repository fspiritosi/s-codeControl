import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { BookOpen, Briefcase, Calculator, Users } from 'lucide-react';

async function getCostosCounts(companyId: string) {
  // Los modelos del módulo se agregan en E-1 y siguientes.
  // Por ahora retornamos 0 hasta que existan las tablas.
  return { cct: 0, servicios: 0, composiciones: 0, liquidaciones: 0 };
}

export default async function CostosDashboard() {
  const { companyId } = await getActionContext();
  const counts = companyId ? await getCostosCounts(companyId) : { cct: 0, servicios: 0, composiciones: 0, liquidaciones: 0 };

  const cards = [
    { title: 'CCTs configurados',  value: counts.cct,           icon: BookOpen,   href: '/dashboard/costos/configuracion-cct' },
    { title: 'Servicios',          value: counts.servicios,     icon: Briefcase,  href: '/dashboard/costos/servicios' },
    { title: 'Composiciones',      value: counts.composiciones, icon: Calculator, href: '/dashboard/costos/composicion' },
    { title: 'Liquidaciones',      value: counts.liquidaciones, icon: Users,      href: '/dashboard/costos/liquidacion-sueldos' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Costos</h1>
        <p className="text-muted-foreground text-sm mt-1">Composición de costos, fórmula polinómica y liquidación de sueldos.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ title, value, icon: Icon, href }) => (
          <a key={title} href={href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{value}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
