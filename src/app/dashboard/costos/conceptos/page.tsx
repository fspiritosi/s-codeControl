import { Suspense } from 'react';
import { listConceptos, listIndices } from '@/modules/costos/features/conceptos/actions.server';
import { TablaConceptos } from '@/modules/costos/features/conceptos/components/TablaConceptos';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';

async function ConceptosContent() {
  const [conceptos, indices, productosRaw, { companyId }] = await Promise.all([
    listConceptos(),
    listIndices(),
    getProductsByCompany(),
    getRequiredActionContext(),
  ]);

  // getProductsByCompany trae los productos de todas las empresas visibles del grupo, pero
  // las actions del catálogo validan el product_id contra la empresa activa (la de la cookie
  // actualComp). Sin este filtro el combo ofrecería productos de empresas hermanas que
  // después el guardado rechaza con "Producto no encontrado o sin acceso".
  const productos = productosRaw
    .filter((p) => p.company_id === companyId)
    .map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      cost_price: Number(p.cost_price),
    }));

  return <TablaConceptos conceptos={conceptos} productos={productos} indices={indices} />;
}

export default function ConceptosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conceptos de costo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Catálogo de accesorios y mantenimiento de la empresa. Cada concepto puede ser un monto
          fijo o un porcentaje que se resuelve con los valores de cada equipo.
        </p>
      </div>
      <Suspense
        fallback={<div className="text-muted-foreground text-sm">Cargando conceptos...</div>}
      >
        <ConceptosContent />
      </Suspense>
    </div>
  );
}
