# Referencias — Módulo de Costos (Transporte SP SRL)

> ⚠️ **Esta carpeta NO se sube a GitHub.** El contenido (salvo este README) está excluido vía `.gitignore`. Las planillas contienen datos sensibles del cliente (sueldos reales, CUITs, tarifas comerciales, márgenes).

## Propósito

Material de referencia provisto por Transporte SP SRL que se usa como **fuente de verdad** para:

1. **Ingeniería inversa de fórmulas** — extraer las fórmulas exactas que el spec aprobado deja como pendientes de confirmación (márgenes en cascada vs directo, factor km excedente, conceptos del recibo, etc.).
2. **Validación de motores de cálculo** — los hitos P-2, P-3 y P-4 se cierran cuando los motores reproducen estos números al centavo.
3. **Seed de datos** — escalas del CCT, ítems de mantenimiento, índices históricos.

## Archivos disponibles

| Archivo | Servicio / Sujeto | Período | Usado en |
|---|---|---|---|
| `composicion-pecom-rdls-bdt-omnibus-44p1-jun25.xls` | PECOM — RDLS / Yacimiento BDT — 1 ómnibus 44+1 | Junio 2025 | Fase 4 (E-4) — validación maestra de composición. **Hito P-2/P-4.** Probablemente contiene también la base CCT y costo de equipo embebidos. ⚠️ formato `.xls` legacy. |
| `composicion-aesa-rdls-chns-lm-14p1-10hs-abr26.xlsx` | AESA — RDLS / CHNS-LM 14+1 / 10hs | Abril 2026 | Fase 4 (E-4) — segundo caso de validación de composición. |
| `formula-polinomica-pecom-rdls-bdt-44p1-jun25-feb26.xlsx` | PECOM — RDLS-BDT 44+1 | Jun 2025 → Feb 2026 | Fase 5 (E-5) — serie histórica de índices, ponderaciones, coeficientes y retroactivos. **Hito P-3.** |
| `liquidacion-bide-m-petroleros.xlsx` | Chofer Bide M. (CCT 545/08 Petroleros) | (a verificar dentro) | Fase 6 (E-6) — caso 1 de validación de recibo. |
| `liquidacion-guinazu-m-petroleros.xlsx` | Chofer Guiñazu M. (CCT 545/08 Petroleros) | (a verificar dentro) | Fase 6 (E-6) — caso 2 de validación de recibo. **3 choferes coincide con el criterio de aceptación del spec.** |
| `liquidacion-moragues-j-petroleros.xlsx` | Chofer Moragues J. (CCT 545/08 Petroleros) | (a verificar dentro) | Fase 6 (E-6) — caso 3 de validación de recibo. |

## Faltantes potenciales (a confirmar tras revisar los .xlsx)

- **Panel CCT 545/08 vigente** (escalas salariales, tasas patronales, adicionales). El spec lo lista como Fase 1 (E-1). Probablemente se pueda extraer de las hojas internas de `composicion-pecom-*.xls` o de las liquidaciones, pero conviene pedir la planilla maestra de la última paritaria si existe separada.
- **Costo de equipo IVECO 10-190 / ómnibus** (~40 ítems de mantenimiento). El spec sec 4.2 lo menciona como golden test. Probablemente embebido en `composicion-pecom-*.xls`. Si no aparece, pedir planilla específica.

## Cómo se usa durante la implementación

- **No se importa contenido directamente al runtime.** Solo se usa como fuente de fórmulas y casos de test.
- Los **tests de validación** (`*.spec.ts`) se escriben con números extraídos manualmente de cada planilla. Si el dataset cambia, se actualiza el test.
- Los **datos de seed** se transcriben a scripts en `scripts/seed-*.ts` con valores numéricos (sin commitear el `.xlsx`).
- Si una planilla tiene una fórmula ambigua o trabajo manual del cliente, se documenta acá la decisión tomada al traducirla a código.

## Decisiones documentadas durante la traducción

> A medida que se implementa cada fase, dejar acá las interpretaciones no triviales hechas al pasar de Excel a código (ej. "la planilla redondea por concepto antes de sumar; replicamos ese comportamiento en `calcular-mod.ts:42`").

_(vacío hasta que arranque Fase 1)_
