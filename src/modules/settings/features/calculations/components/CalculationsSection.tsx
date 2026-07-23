import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { listExchangeRates, listIndices } from '../actions.server';
import { ExchangeRatesList } from './ExchangeRatesList';
import { IndicesManager } from './IndicesManager';

export default async function CalculationsSection() {
  const [rates, indices] = await Promise.all([listExchangeRates(), listIndices()]);

  return (
    <Tabs defaultValue="exchange" className="space-y-4">
      <TabsList>
        <TabsTrigger value="exchange">Tipo de cambio</TabsTrigger>
        <TabsTrigger value="indices">Índices</TabsTrigger>
      </TabsList>

      <TabsContent value="exchange">
        <Card>
          <CardHeader>
            <CardTitle>Tipo de cambio</CardTitle>
            <CardDescription>
              Historial de cotizaciones Dólar (USD) → Pesos (ARS) de la empresa. La última cotización
              se usa para convertir el valor de compra de los equipos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExchangeRatesList rates={rates} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="indices">
        <Card>
          <CardHeader>
            <CardTitle>Índices</CardTitle>
            <CardDescription>
              Índices de la empresa y su variación porcentual mensual. Seleccioná un índice para
              administrar sus valores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IndicesManager indices={indices} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
