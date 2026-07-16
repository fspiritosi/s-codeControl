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
- [ ] **1.4 Streaming y percepción.** `loading.tsx` + `Suspense` boundaries por ruta, skeletons consistentes, optimistic UI donde aplique (ya hay precedente en TKT 445).
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

- [ ] **4.1 Eliminar deps muertas/duplicadas** (cada una reduce bundle):
  - `jotai` — 0 usos → desinstalar.
  - `moment` — terminar los 6 archivos con `date-fns` y desinstalar.
  - `xlsx` vs `exceljs` — consolidar en una.
  - `swiper` vs `embla-carousel-react` — elegir una.
  - `react-modal` vs Radix Dialog — migrar a Radix.
  - `react-icons` vs `lucide-react` — estandarizar en una.
  - `jspdf` vs `@react-pdf/renderer` — evaluar consolidación.
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
