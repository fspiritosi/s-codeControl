import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FileText } from 'lucide-react';

export default function CommercialQuotesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cotizaciones</CardTitle>
        <CardDescription>Presupuestos y cotizaciones a clientes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <FileText className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            El módulo de Cotizaciones está en desarrollo.
            <br />
            Pronto vas a poder crear presupuestos y convertirlos en facturas de venta.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
