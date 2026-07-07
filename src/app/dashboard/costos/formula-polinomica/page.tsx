import { Suspense } from 'react';
import { listFormulas } from '@/modules/costos/features/formula-polinomica/actions.server';
import { TablaFormulas } from '@/modules/costos/features/formula-polinomica/components/TablaFormulas';

async function FormulasContent() {
  const formulas = await listFormulas();
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Fórmula polinómica</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Redeterminación de tarifas por índices (CCT, IPIM, gasoil) — una fórmula por servicio.
        </p>
      </div>
      <TablaFormulas formulas={formulas} />
    </>
  );
}

export default function FormulaPolinomicaPage() {
  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando fórmulas...</div>}>
        <FormulasContent />
      </Suspense>
    </div>
  );
}
