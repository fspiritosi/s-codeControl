import { listarCCTs } from '../actions.server';
import { SelectorParitaria } from './SelectorParitaria';
import { FormNuevoCCT } from './FormNuevoCCT';
import { TabCategorias } from './TabCategorias';
import { TabConceptos } from './TabConceptos';
import { TabValoresPorCategoria } from './TabValoresPorCategoria';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface Props {
  cctId?: string;
}

export default async function PanelCCT({ cctId }: Props) {
  const ccTs = await listarCCTs();
  const activos = ccTs.filter((c) => c.is_active);
  const seleccionado = cctId
    ? ccTs.find((c) => c.id === cctId)
    : activos[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Configurador de CCT</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administrá los convenios colectivos, categorías y conceptos de liquidación.
          </p>
        </div>
        <FormNuevoCCT />
      </div>

      {ccTs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay CCTs configurados. Creá el primero usando el botón de arriba.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de CCTs */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
              Convenios
            </p>
            {ccTs.map((cct) => (
              <a key={cct.id} href={`?cctId=${cct.id}`}>
                <Card
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    seleccionado?.id === cct.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardHeader className="pb-1 pt-3 px-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm">{cct.cct_codigo}</CardTitle>
                      {cct.is_active ? (
                        <Badge variant="default" className="text-xs">Activo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Cerrado</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 px-3">
                    <p className="text-xs text-muted-foreground">{cct.cct_nombre}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Desde {cct.vigencia_desde}
                      {cct.vigencia_hasta ? ` → ${cct.vigencia_hasta}` : ''}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          {/* Panel derecho */}
          {seleccionado ? (
            <div className="lg:col-span-3 space-y-4">
              <SelectorParitaria cct={seleccionado} />
              <Tabs defaultValue="categorias">
                <TabsList>
                  <TabsTrigger value="categorias">Categorías</TabsTrigger>
                  <TabsTrigger value="conceptos">Conceptos</TabsTrigger>
                  <TabsTrigger value="valores">Valores × Categoría</TabsTrigger>
                </TabsList>
                <TabsContent value="categorias" className="mt-4">
                  <TabCategorias cct={seleccionado} />
                </TabsContent>
                <TabsContent value="conceptos" className="mt-4">
                  <TabConceptos cct={seleccionado} />
                </TabsContent>
                <TabsContent value="valores" className="mt-4">
                  <TabValoresPorCategoria cct={seleccionado} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="lg:col-span-3 flex items-center justify-center text-muted-foreground">
              Seleccioná un CCT para ver sus detalles.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
