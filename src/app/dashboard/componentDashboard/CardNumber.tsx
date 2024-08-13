'use client';
import { Badge } from '@/components/ui/badge';
import { useLoggedUserStore } from '@/store/loggedUser';

function CardNumber({
  nameData,
  variant,
}: {
  nameData: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'yellow' | 'red' | null | undefined;
}) {
  const user = useLoggedUserStore();
  const employees = user.employees;
  const equipment = user.vehicles;

  const eNoAvalados =
    employees?.length > 0 ? employees?.filter((employee: any) => employee.status === 'No avalado') : [];

  const eAvalados = employees?.length > 0 ? employees?.filter((employee: any) => employee.status === 'Avalado') : [];

  const equiNoAvalados =
    equipment?.length > 0 ? equipment?.filter((vehicle: any) => vehicle.status === 'No avalado') : [];

  const equiAvalados = equipment?.length > 0 ? equipment?.filter((vehicle: any) => vehicle.status === 'Avalado') : [];

  return (
    <Badge variant={variant} className="rounded-full text-lg">
      {nameData === 'Empleados totales'
        ? employees?.length || 0
        : nameData === 'Empleados Avalados'
          ? eAvalados.length
          : nameData === 'Empleados No Avalados'
            ? eNoAvalados.length
            : nameData === 'Vehículos totales'
              ? equipment?.length || 0
              : nameData === 'Vehículos Avalados'
                ? equiAvalados.length
                : nameData === 'Vehículos No Avalados'
                  ? equiNoAvalados.length
                  : 0}
    </Badge>
  );
}

export default CardNumber;
