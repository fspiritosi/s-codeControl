import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { listTaxTypes } from '../actions.server';
import { TaxTypesList } from './TaxTypesList';

export default async function TaxesSection() {
  const taxTypes = await listTaxTypes();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impuestos: retenciones y percepciones</CardTitle>
        <CardDescription>
          Configurá los tipos de impuesto que tu empresa usa. Cada tipo define una
          alícuota default editable y la base sobre la que se calcula. Las
          retenciones se aplican al pagar OPs; las percepciones al cargar facturas
          recibidas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="retentions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="retentions">Retenciones</TabsTrigger>
            <TabsTrigger value="perceptions">Percepciones</TabsTrigger>
          </TabsList>
          <TabsContent value="retentions">
            <TaxTypesList taxTypes={taxTypes} kind="RETENTION" />
          </TabsContent>
          <TabsContent value="perceptions">
            <TaxTypesList taxTypes={taxTypes} kind="PERCEPTION" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
