# Plan de Optimización y Cierre de Deuda — CodeControl

**Fecha:** 2026-07-13
**Autor:** Diagnóstico asistido (Claude Code)
**Estado:** PROPUESTA — pendiente de aprobación para implementar
**Enfoque:** A — Medición primero + 4 tracks paralelos priorizados por impacto

---

## ⚠️ Regla de trabajo (obligatoria)

**Todo el proceso descrito en este documento debe realizarse en una rama aparte nacida de `dev`.**

```bash
git checkout dev
git pull origin dev
git checkout -b refactor/optimizacion-2026-07
```

- No se trabaja sobre `dev` directamente.
- No se hace `push` sin indicación explícita del usuario (regla del proyecto en `CLAUDE.md`).
- Commits: cuando un cambio impacta >5 archivos o >100 líneas, se commitea al terminar de probar que funciona; cambios menores, cuando lo indique el usuario.
- Antes de la fase de mayor riesgo (Track 3.3 — auth), crear rama de respaldo `legacy/supabase-auth` desde el punto previo.

---

## 1. Contexto

CodeControl es un SaaS multi-tenant (Next.js 16 App Router + React 19 + Prisma + Supabase). Ya atravesó un "Plan Maestro de Refactorización" de 15 fases (`docs/plans/plan-maestro-refactor.md`) que llevó la app a arquitectura modular (`src/modules/`), Prisma y NextAuth.

Sin embargo, al auditar el código hoy, **varias metas de ese plan figuran como "completadas" pero no se cumplieron en la práctica**, y el dolor real reportado —**lentitud de navegación en producción**— no fue atacado con medición. Este plan cubre **ambos frentes de forma completa, sin recortar alcance**: mejorar performance/UX y cerrar la deuda técnica pendiente.

## 2. Diagnóstico (medido el 2026-07-13)

| Área | Métrica real | Objetivo del plan previo | Observación |
|------|--------------|--------------------------|-------------|
| Client components | **463 / 749 `.tsx` (62%)** | < 40% | No se cumplió; principal sospechoso de bundles grandes |
| Uso de `any` | **1824** | < 50 | No se cumplió |
| `moment` | **6 archivos** (vs 134 de date-fns) | 0 | Migración casi terminada, sin cerrar |
| Supabase | Coexiste: fallback de auth + `supabaseBrowser` en 10 comp. + storage | — | Auth a medias (`TODO: Phase 8` en `auth.ts`) |
| Fetch en cliente | **38 componentes** fetchean en `useEffect` | — | Waterfalls → lentitud percibida |
| react-query | Solo **17 archivos** | — | Data layer inconsistente (fetch / supabaseBrowser / RSC / react-query mezclados) |
| Archivos > 600 LOC | **36 archivos** (hasta 1746 LOC) | ≤ 300 | Difíciles de mantener y tree-shakear |
| `TODO: Phase` / `@deprecated` | **22 marcadores** | 0 | Deuda marcada sin cerrar |
| Deps muertas/duplicadas | `jotai` (0 usos), `moment`, `xlsx`+`exceljs`, `swiper`+`embla`, `react-modal`+Radix, `react-icons`+`lucide` | — | Peso de bundle evitable |

**Lo que ya está bien** (no tocar salvo mejora medida):
- Sesión/permisos por navegación cacheada con `unstable_cache` + `React.cache` (`src/shared/lib/session.ts`).
- `optimizePackageImports` configurado en `next.config.js` (lucide, recharts, date-fns, radix icons).
- Solo 9/95 `page.tsx` son client components (el anti-patrón no está a nivel de página).
- Patrón RSC + prefetch + `HydrationBoundary` ya presente en `dashboard/layout.tsx`.

**Conclusión:** la limpieza estructural gruesa ya ocurrió. El trabajo restante es (a) performance guiada por medición y (b) cierre fino de deuda. Nada de esto se debe hacer "a ojo".

---

## 3. Fase 0 — Instrumentación y medición (baseline)

> **Bloquea la priorización de los Tracks 1 y 4. No se optimiza nada sin números.**

**Objetivo:** saber qué rutas son lentas y por qué, y fijar un presupuesto de performance.

- [x] Instalar `@next/bundle-analyzer` y configurar instrumentación de bundles.
- [x] Build de producción + medición de peso real de chunks cliente (gzip).
- [x] Medidor reproducible `scripts/measure-bundles.mjs` (`npm run analyze:routes`).
- [ ] **Bloqueado:** Lighthouse + trazas de navegación real (LCP/INP) en rutas de dashboard — requieren sesión autenticada (falta credencial de prueba). Ver §3.3.
- [x] Atribución de peso: qué librería domina cada chunk pesado.

### 3.1 — Aprendizaje de método (Turbopack)

En **Next 16 el build usa Turbopack**, y esto cambia la instrumentación:
- `@next/bundle-analyzer` **no es compatible con Turbopack** (no genera treemap).
- El build **no imprime la tabla de "First Load JS por ruta"** que daba webpack.
- Forzar `next build --webpack` **falla** porque `@react-pdf/renderer` es ESM-only y el path webpack no lo resuelve.
- Vía nativa para treemap interactivo: `next experimental-analyze` (script `npm run analyze`).
- Vía cuantitativa reproducible (la que usamos): `scripts/measure-bundles.mjs` mide el gzip real de `.next/static/chunks` y lo atribuye por librería (`npm run analyze:routes`).

### 3.2 — Resultados del baseline (medido 2026-07-13)

- **JS cliente total emitido:** 3.2 MB gzip en 182 chunks.
- **Baseline compartido (lo que paga TODA navegación):** **~119 KB gzip** → razonable; **no es el cuello de botella**.
- **El costo está en chunks route-specific de librerías pesadas importadas de forma estática** (no `next/dynamic`), que se cargan al navegar a la ruta que las usa:

| Peso gzip | Librería dominante | Acción |
|-----------|--------------------|--------|
| **478 KB** | `@react-pdf/renderer` (20 archivos, import estático) | Track 1.1 — `next/dynamic` |
| **250 KB** | `xlsx` **+** `exceljs` en un mismo chunk | Track 4.1 — dedup + 1.1 dynamic |
| **137 KB** | `xlsx` | Track 4.1 / 1.1 |
| **~465 KB** | `recharts` **duplicado en ~5 chunks** (98+98+98+97+74) | Track 1.1 — dynamic + chunk compartido |
| **82 KB** | `moment` (6 archivos que aún lo importan) | Track 4.1 — terminar migración y desinstalar |

> Conclusión medida: el "First Load JS" global es sano; la lentitud de navegación viene de **rutas concretas** con ~0.5 MB gzip de JS.

> **⚠️ CORRECCIÓN (verificada al implementar Track 1.1, 2026-07-13).** `measure-bundles.mjs`
> mide **JS total emitido**, que **incluye chunks lazy**. Al inspeccionar el código y la red
> per-route resultó que **las librerías pesadas ya estaban mayormente code-splitteadas**:
> `xlsx` (`await import('xlsx')` en sus 4 usos), `exceljs` (`await import('exceljs')` en
> `excel-export.ts`) y gran parte de `react-pdf` (server-side `renderToBuffer`, o `PDFViewer`
> dinámico). **Esos chunks no están en el load inicial de ninguna ruta** — solo cargan al
> exportar/generar PDF. Por lo tanto la tabla de arriba **sobre-representa** el problema.
>
> **First Load JS real de una ruta lenta** (treasury/document ≈ **560–577 KB gzip**)
> es **código de la app + framework + DataTable/columnas**, NO librerías pesadas. El render
> delay (1.7–1.9 s con 4×/4G) es **parsear + hidratar ese JS de app**. → La palanca real para
> las rutas lentas es **Track 1.2 (reducir/aligerar client components y el árbol de DataTable)**,
> no el code-splitting de librerías (Track 1.1), que sí ayuda a rutas de charts/PDF pero no a
> treasury/document.

### 3.4 — Realidad de Track 1.2 en /dashboard/document (medido 2026-07-13)

Se probaron dos intervenciones y se midió:
- **Renderizar solo el tab activo + evitar over-fetch** (commit `538fed14`): reduce trabajo
  de servidor y payload RSC (importante con datos reales), pero **no mueve el render delay
  del cliente** (LCP osciló 1865→2064→2373 ms entre corridas — **±25% de ruido de medición**).
- **Lazy-load de formularios de carga en columnas** (commit `ee69f5ee`): chunks del load
  inicial **51 → 37**, pero el **total gzip NO baja de forma clara (~577 KB)** porque esos
  forms comparten dependencias (react-hook-form, radix, zod) con código que sí está en el
  load inicial. El código *único* diferido es chico frente al bundle total.

**Conclusión honesta (importante para planificar):** las rutas de tabla son pesadas por
**código cliente esencial y compartido** (framework + Radix + TanStack DataTable + celdas
interactivas por fila), no por piezas fácilmente separables. **No hay un "quick win" de
code-splitting** que mueva su render delay de forma notable. Mejorarlas de verdad requiere
uno de estos caminos **más grandes** (con trade-offs de UX y esfuerzo):

1. **Consolidar las 2 DataTable** (72 usos `common/DataTable` + 38 `data-table`) en una sola,
   más liviana. Reduce código y mantenimiento; beneficio de bundle por ruta moderado. Migración grande.
2. **Render server-first de la tabla inicial** (HTML/RSC estático) e hidratar solo los
   controles interactivos. Mejor potencial de performance; **mayor esfuerzo/riesgo** (TanStack
   Table es client-only → requiere otro enfoque para la vista inicial).
3. **Reducir interactividad/DOM por fila** (menos dropdowns/diálogos montados por fila,
   virtualización de filas). Esfuerzo medio.
4. **Aceptar** que estas rutas son inherentemente pesadas y concentrar el esfuerzo en las
   ganancias ciertas (Track 4.1 dedup, cerrar 1.1) y en las rutas donde el splitting sí paga.

> Nota de medición: para detectar mejoras <10% en render delay hace falta **mediana de varias
> corridas** (una sola traza tiene ±25% de ruido) o comparar **bytes determinísticos** del load
> inicial (cuidado: Turbopack re-hashea/re-bundlea en cada build, así que comparar por hash de
> chunk entre builds es poco fiable; comparar totales).

### 3.4bis — Patrón "renderizar solo el tab/sub-tab activo" (implementado, transversal)

Se eligió y ejecutó el camino **3 (reducir DOM/render por ruta)** en su variante de bajo
riesgo: en las rutas multi-tabla, renderizar en el servidor **solo el tab activo** (y
sub-tabs por URL con `UrlTabs`), en vez de todas las pestañas a la vez.

**Rutas cubiertas:** document (4 tabs + sub-tabs empleado/equipo por URL), employee (5 tabs
+ activos/inactivos), equipment (4 tabs + activos/inactivos), treasury (6), purchasing (5),
warehouse (4), company (2), actualCompany (8). (maintenance ya estaba guardado.)

**Qué reduce (real):** cada carga ejecuta **solo el fetch del tab activo** (antes 4-8 por
carga) y serializa **solo su markup** en el payload RSC.

**Qué NO reduce (medido):** el **render delay del cliente no cambia** en local, por dos
razones: (a) la empresa de prueba tiene datos mínimos → el payload RSC de tabs inactivos es
chico; (b) **el bundle JS es idéntico** (los componentes siguen importados estáticamente; el
cambio es de *render*, no de *import*). treasury: 1163→1160 ms (ruido); document: sin cambio.

**Conclusión:** es una mejora correcta de **carga de servidor + payload RSC** que **escala
con el volumen de datos y la concurrencia de producción** — exactamente el dolor reportado
(lentitud en prod), aunque **no medible en el sandbox con datos casi vacíos**. Para
cuantificarla hay que medir contra **datos de producción** (ver §Próximos pasos).

### 3.3 — Resultados de runtime (medido 2026-07-13)

Medición con Chrome DevTools sobre `next start` (build de producción), autenticado,
con throttling **4× CPU + Fast 4G** (perfil de usuario real promedio). Nota: la empresa
de prueba estaba **vacía** (contadores en 0), así que el costo de *data-fetching* de
tablas está **subestimado** — con datos reales estos números empeoran.

| Ruta | LCP | Render delay (JS) | TTFB | First Load JS |
|------|-----|-------------------|------|---------------|
| `/dashboard` (sin throttling) | 697 ms | 543 ms | 154 ms | — |
| `/dashboard/treasury` | 1163 ms | **1102 ms (95%)** | 60 ms | **562 KB gzip / 35 chunks** |
| `/dashboard/costos` | 1175 ms | **1112 ms (95%)** | 62 ms | — |
| `/dashboard/document` | **1865 ms** | **1747 ms (94%)** | 118 ms | — |

**Hallazgo raíz (con evidencia):** el **render delay (ejecución + hidratación de JS)
es el 94-95% del LCP**; el TTFB (server/DB) es mínimo (60-120 ms). **La lentitud de
navegación es de JS cliente, no de backend.** `/dashboard/treasury` transfiere **562 KB
gzip** de JS (2,25× el presupuesto de 250 KB) sin siquiera cargar react-pdf.

→ Confirma con datos duros la prioridad: **Track 1.1 (code-splitting), 1.2 (menos client
components), 1.3 (waterfalls) y 4.1 (dedup libs)** son el camino directo a mejorar la UX.

**Entregables de la fase:**
1. ✅ Baseline de bundles + medidor reproducible (`scripts/measure-bundles.mjs`).
2. ✅ Tabla runtime (LCP / render delay / TTFB / First Load JS) — arriba.
3. **Presupuesto de performance (ratificado con datos):**
   - First Load JS por ruta de dashboard: **≤ 250 KB** gzip *(hoy treasury = 562 KB → objetivo −55%)*.
   - LCP en rutas top con 4×/4G: **≤ 1.2 s** *(hoy document = 1.87 s)*.
   - Render delay: **≤ 600 ms** *(hoy 1.1–1.75 s)*.
   - INP: **≤ 200 ms** (a medir en interacción de tablas).

> **Fase 0 COMPLETADA.** Con este baseline se puede arrancar el Track 1.1 y re-medir con
> `npm run analyze:routes` + trazas para validar cada mejora contra estos números.

---

## 4. Track 1 — Performance / UX *(guiado por el ranking de Fase 0)*

- [~] **1.1 Code-splitting de librerías pesadas.** `next/dynamic` (con `ssr:false` donde aplique). **En progreso:**
  - [x] **recharts**: `PantallaFormula` (fórmula polinómica) y tab de estadísticas de capacitación (extraído a `TrainingStatisticsTab`). Los otros 2 consumidores (`FormCard`, admin panel) ya eran dynamic. Verificado: el chart carga async tras el paint.
  - [x] **@react-pdf/renderer (~478KB)**: `ChecklistSergio`, `VehicleInspectionChecklist`, `DynamicChecklistForm` → dynamic `ssr:false`. Solo el checklist HSE lo usa en cliente; el resto (payment/purchase/withdrawal/composición) ya es server-side (`renderToBuffer`).
  - [ ] **xlsx / exceljs (~387KB)**: consolidar (Track 4.1) + cargar on-demand al exportar.
  - [ ] **jspdf, framer-motion, html-to-image, react-qr-code, swiper**: revisar consumidores estáticos.

  > **Aprendizaje de método:** el code-splitting **no reduce el JS total emitido** (de hecho sube levemente por los wrappers) — mueve los chunks pesados fuera del *load inicial de cada ruta*. Por eso `measure-bundles.mjs` (mide total) **no** sirve para validar 1.1: la validación correcta es **runtime per-route** (network + trazas). Los chunks de react-pdf/recharts **no** están en el baseline compartido ni en las rutas medidas como lentas (treasury/document/costos-index); 1.1 mejora rutas de **charts/PDF** (fórmula, capacitación, checklist, forms). Las rutas más lentas medidas se atacan con **Track 1.2/1.3** (menos client components + waterfalls), que es el siguiente paso de mayor impacto ahí.
- [ ] **1.2 Reducir client components.** Convertir a RSC lo que no tiene interactividad real (patrón *Server Component + Client Island*). Foco en rutas del top del ranking; medir antes/después. Objetivo dirigido por presupuesto, no por porcentaje arbitrario.
- [ ] **1.3 Eliminar waterfalls cliente.** Los 38 componentes que fetchean en `useEffect`: mover la carga inicial al RSC (prefetch + `HydrationBoundary`) o a react-query con prefetch. **Alto impacto en lentitud percibida → junto con 1.1.**
- [x] **1.4 Streaming y percepción.** ✅ 16 `loading.tsx` agregados (rutas top de dashboard + home) → skeleton instantáneo al navegar vía streaming de Next. Antes solo costos tenía. (Suspense boundaries internos ya existían.)
- [ ] **1.5 Assets.** Auditar `next/image`, `next/font`, íconos e imágenes sin optimizar.
- [ ] **1.6 Caching/revalidación.** Revisar `unstable_cache`/`revalidateTag`; evitar refetch de catálogos estables (roles, tipos de documento, geografía) en cada navegación.
- [ ] **1.7 Re-medir** cada cambio contra el presupuesto (gate de "hecho").

## 5. Track 2 — Data layer consistente

- [ ] **2.1** Estándar único: **RSC para carga inicial + server actions + react-query** (query keys centralizadas) en cliente. Deprecar `fetch()` directo y `supabaseBrowser` para queries.
- [ ] **2.2** Centralizar `queryKeys` y crear hooks de dominio reutilizables (extender el patrón de `modules/ayuda/hooks`).
- [ ] **2.3** Migrar los fetch dispersos (38 `useEffect` + 6 `fetch('/api')` + `supabaseBrowser`) al estándar.
- [ ] **2.4** Prefetch + `HydrationBoundary` en layouts/pages para pintar sin spinner.
- [ ] **2.5** Estados de carga/error consistentes (helpers compartidos).

## 6. Track 3 — Deuda técnica (tipos, client, código muerto)

- [ ] **3.1 Campaña de `any` (1824 → < 100).** Prioridad: server actions/API con tipos Prisma (`Prisma.<model>GetPayload<>`) → stores → hooks → componentes. ESLint `no-explicit-any` en `warn`, subiendo a `error` por carpeta ya saneada para evitar regresiones.
- [ ] **3.2** Cerrar los 22 `TODO: Phase` / `@deprecated`.
- [ ] **3.3 Sacar Supabase de auth y queries — MANTENIENDO Supabase solo para Storage.** *(Riesgo alto, al final, detrás de testing y de la rama de respaldo.)*
  - Terminar auth NextAuth puro: quitar el fallback `supabase.auth.signInWithPassword` de `src/auth.ts` (`TODO: Phase 8`) una vez que todos los usuarios activos tengan `password_hash`.
  - Migrar los 10 componentes con `supabaseBrowser` a server actions.
  - **NO se migra el storage:** `@supabase/supabase-js` se conserva exclusivamente para Supabase Storage detrás de la abstracción `src/shared/lib/storage.ts`.
  - Evaluar si `database.types.ts` puede reducirse a solo los tipos que Storage requiera (o eliminarse si Storage no depende de él).
  - Checklist de regresión de auth (login email/pass, Google, registro, logout, reset, roles, cambio de empresa, persistencia de sesión).
- [ ] **3.4 Limpieza de raíz:** `check.js` (vacío), `comment-logs.js`, `notas_analisis/`, PDFs sueltos (`Presupuesto-Transporte-SP.pdf`), `.kombai/`, y sacar `tsconfig.tsbuildinfo` del control de versiones (agregar a `.gitignore`).

## 7. Track 4 — Consolidación de deps + archivos gigantes

- [~] **4.1 Eliminar deps muertas/duplicadas** (cada una reduce bundle):
  - [x] `jotai` — 0 usos → **desinstalado**.
  - [x] `swiper` — 0 usos (no era vs embla; simplemente sin uso) → **desinstalado**.
  - [x] `moment` — 6 archivos del módulo ayuda migrados a `date-fns` (`formatDistanceToNow`/`format`, salida idéntica) → **desinstalado** (~82KB gzip fuera).
  - [ ] `xlsx` vs `exceljs` — **evaluado: baja prioridad.** Ambos ya son `await import()` (lazy) → consolidar NO baja First Load JS; solo quita 1 dep con esfuerzo medio.
  - [ ] `react-modal` vs Radix Dialog — solo 3 usos; migrar a Radix (cleanup opcional, riesgo visual bajo).
  - [ ] `react-icons` vs `lucide-react` — **evaluado: no vale.** 86 vs 239 usos; consolidar = 86 archivos con mapeo de íconos. Ambos tree-shakeados (`optimizePackageImports`).
  - [ ] `jspdf` vs `@react-pdf/renderer` — jspdf 1 archivo dinámico, caso de uso distinto → no vale.
- [ ] **4.2 Refactor de los 36 archivos > 600 LOC.** Separar lógica (hooks) de presentación; dividir `actions.server.ts` gigantes por sub-dominio. **Priorizar los que caen en rutas lentas del ranking de Fase 0** (sinergia con Track 1). Candidatos principales:
  - `modules/hse/features/documents/actions.server.ts` (1746)
  - `modules/hse/features/training/actions.server.ts` (1502)
  - `modules/documents/features/list/actions.server.ts` (1487)
  - `modules/treasury/features/payment-orders/components/NewPaymentOrderForm.tsx` (1450)
  - `modules/hse/features/documents/components/DocumentDetail.tsx` (1297)
  - `modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx` (1204)
  - `modules/forms/features/custom-forms/components/FormCustom.tsx` (1139) + `Inputs.tsx` (1068)
- [ ] **4.3** Actualizar `CLAUDE.md` (dice Next 14, es Next 16) y `docs/`.

---

## 8. Método transversal (gobernanza)

- **Gate por cambio:** `npm run build` + `npm run check-types` + `npm run lint`, y re-medición cuando el cambio afecta performance.
- **Presupuesto de performance** como criterio de "hecho" en Track 1.
- **Sin regresiones de tipos:** ESLint bloqueante por carpeta saneada.
- **Testing de regresión** obligatorio antes de mergear cada track a la rama de trabajo, y de la rama de trabajo a `dev`.

### Orden de ejecución sugerido

1. **Fase 0** (medición) — bloqueante.
2. **Track 1.1 (code-splitting) + 1.3 (waterfalls)** — máximo impacto / menor riesgo.
3. **En paralelo:** Track 4.1 (deps muertas) y Track 3.4 (limpieza raíz) — baratos y seguros, reducen ruido y bundle.
4. **Track 2** (data layer) — habilita cerrar 1.3 y parte de 3.3.
5. **Resto de Track 1** (RSC, streaming, assets, caching) + **Track 4.2** (archivos gigantes de rutas lentas).
6. **Track 3.1** (`any`) — continuo, en paralelo a todo.
7. **Track 3.3** (auth / sacar Supabase de auth) — **último**, por riesgo; requiere rama de respaldo y checklist de regresión.

---

## 9. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Romper auth al sacar el fallback Supabase | Confirmar que todos los usuarios activos tienen `password_hash` antes; rama `legacy/supabase-auth`; checklist de regresión. |
| `ssr:false` en componentes que sí necesitan SSR | Aplicar solo a UI puramente cliente (PDF, export, gráficos en diálogos). |
| Regresiones al dividir archivos gigantes | Refactor mecánico + `check-types` + pruebas de la ruta afectada. |
| Consolidar librerías cambia comportamiento visual | Validar visualmente cada reemplazo (carrusel, modal, íconos). |
| Optimizar sin impacto real | Todo cambio de perf se re-mide contra baseline. |

## 10. Decisiones / inputs pendientes

1. **Rutas subjetivamente más lentas** (input del usuario): sirve para arrancar la medición por ahí. Igual se mide todo en Fase 0.
2. **Storage:** ✅ decidido — se mantiene en **Supabase**.
3. **Ubicación del doc:** ✅ `docs/plans/`.
4. **Objetivo final de `any`** (< 100 propuesto) y **presupuesto de performance**: se ratifican con los datos de Fase 0.

## 11. Próximos pasos

Con este documento aprobado, el siguiente paso es generar el **plan de implementación detallado por track** (fase por fase, con archivos concretos y criterios de verificación), empezando por Fase 0 para obtener el baseline que ordena todo lo demás.

---

# RESUMEN FINAL — Estado del plan y tareas diferidas

**Actualizado:** 2026-07-15 · **Rama:** `refactor/optimizacion-2026-07`

Este bloque cierra el plan. Distingue lo **ejecutado y verificado** (cambios seguros, sin
romper la app) de lo **diferido**: tareas que implican **cambios de lógica / flujo de datos
/ riesgo de regresión** y que, por decisión explícita, **NO se ejecutaron** en esta pasada —
quedan aquí anotadas con guía para retomarlas de forma controlada.

## ✅ Ejecutado y verificado (seguro)

| Ítem | Detalle |
|------|---------|
| **Fase 0 — Medición** | Instrumentación, baseline de bundles (`scripts/measure-bundles.mjs`), runtime (LCP/render delay), presupuesto |
| **1.1 Code-splitting** | recharts (fórmula polinómica + estadísticas de capacitación) y react-pdf checklist a `next/dynamic`; xlsx/exceljs/jspdf ya eran lazy |
| **1.2 Menos client (tab-activo)** | Render solo del tab activo + sub-tabs por URL en document, employee, equipment, treasury, purchasing, warehouse, company, actualCompany |
| **1.4 Streaming** | 16 `loading.tsx` (skeleton instantáneo al navegar) |
| **document — over-fetch** | `fetchCompanyDocuments` solo en el tab empresa; dialogs de carga (SimpleDocument/UploadPendingDocumentDialog) lazy |
| **4.1 Deps muertas** | `jotai`, `swiper`, `moment` (migrado a date-fns) desinstalados |
| **3.4 / 4.3 Limpieza** | Borrado junk raíz (check.js, comment-logs.js, PDF suelto); CLAUDE.md actualizado a Next 16/React 19/Prisma |

> **Impacto medido:** el render delay local **no se mueve** con estos cambios (empresa de
> prueba con datos mínimos + bundle JS de app inalterado). El valor real —menos fetches y
> menor payload RSC por carga (tab-activo), menos bundle (moment fuera), skeleton instantáneo
> (loading.tsx)— **escala con el volumen y la concurrencia de producción**. → **Validar con
> datos reales** antes de dar por cerrada la ganancia (paso final acordado con el usuario).

## ⚠️ DIFERIDO — requiere cambios de lógica / testeo cuidadoso (NO ejecutado)

> Regla aplicada: "lo principal es no romper la app". Todo lo de abajo cambia comportamiento,
> flujo de datos o tipos a escala, y necesita testeo por caso. Hacerlo **incremental**, con
> `npm run build` + `check-types` + prueba funcional de la ruta afectada tras **cada** cambio.

### Track 1 (resto)
- **1.3 — Eliminar waterfalls cliente (los que quedan).** ~38 componentes con fetch en
  `useEffect`; muchos ya quedaron diferidos por el patrón tab-activo (solo montan en su tab).
  Faltan los que fetchean en **carga inicial real**. **Riesgo:** cambia el flujo de datos
  (mover fetch a RSC/`HydrationBoundary` o react-query). **Guía:** uno por uno, empezando por
  los de rutas calientes; verificar que la data y la interactividad no se rompan.
- **1.5 — Assets.** Auditar `<img>`→`next/image`, fuentes→`next/font`. **Riesgo:** layout
  shift / dimensiones. **Guía:** por imagen, con verificación visual.
- **1.6 — Caching/revalidación.** Cachear catálogos estables (roles, tipos de documento,
  geografía) con `unstable_cache`/`revalidateTag`. **Riesgo:** datos stale si la invalidación
  no acompaña las mutaciones. **Guía:** solo catálogos realmente estáticos + invalidar en su ABM.
- **1.2 (más allá de tab-activo)** — Convertir a RSC componentes client sin interactividad
  real (sigue en ~62% client). **Riesgo:** perder interactividad si se clasifica mal. **Guía:**
  patrón Server Component + Client Island, por componente.

### Track 2 — Data layer consistente (completo diferido)
- Estándar único **RSC + server actions + react-query** (queryKeys centralizadas) y migrar
  los `fetch()` directos / `supabaseBrowser` dispersos. **Riesgo:** alto (reescribe cómo carga
  datos media app). **Guía:** por dominio, con react-query DevTools; no hacer en bloque.

### Track 3 — Deuda técnica (completo diferido)
- **3.1 — Campaña de `any` (1824 → <100).** Type-level, pero a escala destapa errores que
  obligan a tocar código; un `any` puede estar tapando un bug real. **Guía:** incremental por
  carpeta, gate `check-types`, empezar por server actions/API con tipos Prisma. Activar
  `@typescript-eslint/no-explicit-any: warn` y subir a `error` por carpeta saneada.
- **3.2 — Cerrar 22 `TODO: Phase` / `@deprecated`.** Cada uno es trabajo real pendiente
  (mayormente migración de Supabase). Revisar caso por caso.
- **3.3 — Sacar Supabase de auth y queries (MANTENER Storage).** **Riesgo ALTO (auth).**
  Quitar el fallback `signInWithPassword` de `src/auth.ts` solo cuando **todos** los usuarios
  activos tengan `password_hash`; migrar los ~10 componentes con `supabaseBrowser`. **Guía:**
  rama de respaldo `legacy/supabase-auth` + checklist de regresión de auth. **Dejar para el final.**
- **3.4 (resto)** — `notas_analisis/` y `.kombai/` NO se borraron (posible valor del usuario).
  Decisión del usuario si se eliminan.

### Track 4 — Consolidación + archivos gigantes (diferido)
- **4.1 (resto, opcional)** — `react-modal`→Radix Dialog (3 archivos; cambio de UI/behavior).
  `xlsx`↔`exceljs`: ya lazy, consolidar no baja First Load JS (esfuerzo medio, valor bajo).
  `react-icons`↔`lucide`: 86 archivos, no vale.
- **4.2 — Refactor de 36 archivos > 600 LOC.** Mover lógica a hooks / dividir `actions.server.ts`
  gigantes por sub-dominio. **Riesgo:** mover lógica puede introducir regresiones. **Guía:**
  refactor mecánico + `check-types` + prueba de la ruta; priorizar los de rutas lentas.
  Candidatos: `hse/.../documents/actions.server.ts` (1746), `hse/.../training/actions.server.ts`
  (1502), `documents/.../list/actions.server.ts` (1487), `NewPaymentOrderForm.tsx` (1450),
  `DocumentDetail.tsx` (1297), `PurchaseInvoiceForm.tsx` (1204), `FormCustom.tsx`/`Inputs.tsx`.

### Consolidación de DataTable (del análisis de Track 1.2)
- Existen **2 implementaciones** activas: `shared/components/data-table/` (38 usos) y
  `shared/components/common/DataTable/` (72 usos). Unificar en una reduce código/mantenimiento.
  **Riesgo:** migración grande, 72 usos. Diferido; hacer por módulo.

## Cómo retomar
1. **Validar con datos de producción** las ganancias ya hechas (tab-activo / payload / bundle).
2. Elegir el próximo track diferido y ejecutarlo **incremental**, con el gate build+types+prueba
   funcional tras cada cambio, respetando "no romper la app".

---

# VALIDACIÓN CON DATOS REALES (dev.codecontrol.com.ar, 2026-07-16)

Medición **read-only** sobre el entorno desplegado **con la rama ya pusheada** (los cambios
de este plan activos) y la empresa real **Transporte SP SRL**. Throttling 4× CPU + Fast 4G
(comparable con el baseline local). **No se tocó ningún dato.**

## Verificación funcional — todo OK con datos reales ✅
- **document**: 713 registros (paginación server-side, 72 páginas); tabs + sub-tabs por URL
  (`?subtab=mensuales` → 378 registros); **solo el tab activo en el DOM**; diálogos lazy de
  carga presentes y funcionales.
- **treasury**: solo el tab "Cajas" renderizado (datos reales); los otros 5 tabs solo triggers.
- **Centro de Ayuda**: 17 tickets reales con fechas date-fns correctas ("hace 1 día",
  "hace 9 días") — migración de moment verificada en prod.
- Login, navegación y páginas sin errores.

## Números reales (con optimizaciones activas)

| Ruta | LCP (4×/4G) | TTFB | Render delay | Nota |
|------|------------|------|--------------|------|
| document (713 regs) | 5546 ms | **335 ms** | **5211 ms** | Insights: ForcedReflow + DOMSize |
| treasury | 2452 ms | **88 ms** | 2364 ms | TTFB mínimo = 1 query (antes 6 por carga) |

**Lectura:**
1. **El servidor quedó sano**: TTFB 88–335 ms con datos reales — el patrón tab-activo eliminó
   el trabajo de tabs inactivos (treasury pasó de 6 queries por carga a 1; document de
   4 tabs × 3 sub-tabs a 1).
2. **El cuello restante es 100% cliente**: render delay 2.4–5.2 s (throttled ≈ 0.6–1.3 s en
   hardware rápido) = parsear/hidratar el JS del DataTable + celdas interactivas. El insight
   **ForcedReflow** en document apunta a layout thrashing durante la hidratación de la tabla.
3. Esto **confirma la prioridad del trabajo diferido**: la mejora grande que queda es la
   arquitectura de tabla (consolidar/aligerar DataTable, reducir interactividad por fila,
   server-first) — ver sección "DIFERIDO".

---

# PROGRAMA a+b+c — Mejora profunda de rutas de tabla (2026-07-16)

Orden acordado: (a) reflow + celdas → (b) consolidar DataTable → (c) server-first.
Regla: preservar el 100% de la funcionalidad (filtros, export, acciones, preferencias).

## (a) ✅ EJECUTADO — Forced reflow de Radix Presence en tabs

**Diagnóstico (evidencia):** trace en dev.codecontrol.com.ar mostró 445 ms de forced
reflow en `usePresence` (Radix). Instrumentando `getComputedStyle` en dev local: las
llamadas eran sobre los panes de tabs (`UrlTabsContent`, data-state=inactive/active).
Radix Tabs monta TODOS los panes ocultos y Presence mide cada uno → 7 panes en
/dashboard/document × recálculo de estilo sobre DOM grande.

**Fix (commit `af46fe21`):** `UrlTabs` provee su `value` por context; `UrlTabsContent`
devuelve `null` si no es el pane activo. Un solo punto, aplica a todas las rutas.
**Verificado:** getComputedStyle de Presence 7→2; panes inactivos en DOM 5→0; tabla,
filtros y switch de tabs/sub-tabs idénticos. **Falta:** push + re-medir en dev env.

## (b) 🔬 AUDITADO Y DES-RIESGADO — Consolidación de las 2 DataTable (receta lista)

**Hallazgo central:** NINGUNA es superset de la otra:
- `common/DataTable` (71 consumidores, server-only) es la **más evolucionada en UX**:
  filtros facetados **optimistas** (TKT-445), `preserveParams` en useDataTable (default
  `['tab']` — mantiene el tab al limpiar filtros), FilterOptions/ViewOptions con
  Command+Popover y persistencia vía `@/shared/actions/table-preferences`.
- `data-table` (38 consumidores) aporta **dual-mode** (client+server por
  `totalRows !== undefined`), props extra (`onRowClick`, `rowClassName`,
  `initialColumnFilters`) y su propio `table-preferences` local.

**Compatibilidad verificada:** props de la nueva = superset estricto (21 iguales + 3);
helpers funcionalmente idénticos SALVO el guard `if (columnId === 'tab') return;` de
`buildFiltersWhere` (solo en la vieja); nadie importa excel-utils desde la vieja;
DataTableColumnHeader idéntico (0 diff funcional).

**Receta de merge (dirección: `data-table` como única, portando features de la vieja):**
1. Portar a `data-table`: FacetedFilter optimista, FilterOptions y ViewOptions
   (Command+Popover + persistencia — unificar con `@/shared/actions/table-preferences`,
   resolver el duplicado con `data-table/table-preferences.ts`), `preserveParams` de
   useDataTable (default `['tab', 'subtab']`).
2. Portar guard de `buildFiltersWhere`: ignorar `tab` **y `subtab`** (params de navegación).
3. Rewire de imports de los 71 consumidores: `components/common/DataTable` →
   `components/data-table` (drop-in una vez hecho 1-2).
4. Verificación funcional por módulo (checklist): paginación, búsqueda, filtros facetados
   (optimistas), rango de fechas, filtro de texto, toggle de columnas persistente,
   export Excel, selección de filas, preservación de tab/subtab al filtrar/limpiar.
5. Eliminar `common/DataTable/` al llegar a 0 consumidores.

**Riesgo:** medio (toca el corazón de 100+ tablas). Hacer 1-2 en una sesión dedicada,
luego 3-4 módulo por módulo (empezar por suppliers/products, pequeños; terminar en
document/treasury). **No ejecutado en esta pasada por la regla de no romper.**

## (c) 📋 ANOTADO — Server-first tables (el "definitivo")

Sin cambios respecto a lo anotado en DIFERIDO: render inicial de la tabla como HTML/RSC,
hidratar solo controles, virtualización. Encarar DESPUÉS de (b) (con una sola DataTable,
el server-first se implementa una vez). Estimación de mejora combinada a+b+c: **60-70%**
del render delay de rutas de tabla (document 5.5s → ~1.6-2s con 4×/4G).
