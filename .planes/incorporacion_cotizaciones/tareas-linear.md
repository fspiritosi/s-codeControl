# Desglose de Tareas Linear — Módulo de Gestión de Costos
**Proyecto:** Transporte SP (Codecontrol_sas) · **Prefix:** COD-XXX
**Generado:** 2026-05-04 · Ver [`diseno.md`](./diseno.md) para el detalle técnico de cada tarea.

## Milestones a crear en Linear

| Código | Nombre | Descripción breve | Hito de pago |
|---|---|---|---|
| **M0 · Preparación** | Fase 0 — Infraestructura del módulo | Habilitación, layout protegido, sidebar, helpers, formatters, bucket Storage, testing setup | — |
| **M1 · E-1 Configurador CCT** | Fase 1 — CCT genérico + motor de conceptos | 4+ CCTs configurables, 7 clases de cálculo, topes imponibles, seed CCT 545/08 | — |
| **M2 · E-2 Equipos + Combustible** | Fase 2 — Costo de vehículos y combustible | Amortización, items de mantenimiento, registros mensuales | — |
| **M3 · E-3 Servicio + MOD + OCP** | Fase 3 — Servicio/contrato y mano de obra | CRUD servicio_contrato, asignación choferes, motor MOD, OCP | **P-2: 30% — $3.150.000** |
| **M4 · E-4 Composición + PDF** | Fase 4 — Composición de costos y exportación | Pantalla maestra, márgenes, outputs flexibles, PDF firmado | — |
| **M5 · E-5 Fórmula Polinómica** | Fase 5 — Redeterminación de tarifas | Componentes con ponderaciones, índices mensuales, retroactivos | **P-3: 25% — $2.625.000** |
| **M6 · E-6 Liquidación + Deploy** | Fase 6 — Liquidación de sueldos y cierre | Recibos CCT, PDF, deploy productivo, capacitación | **P-4: 15% — $1.575.000** |

## Convenciones

- **Estimate**: en horas (Linear lo soporta como números). Tareas entre 2-6h.
- **Priority**: 1=Urgent, 2=High, 3=Medium, 4=Low. Default 3.
- **Labels**: `costos`, `backend`, `frontend`, `db`, `pdf`, `testing`, `bloqueante`, `golden-test`, `seed`, `deploy`.
- **Dependencias**: declaradas en formato `→ TASK-N` referenciando otra tarea de este doc.

---

# M0 · Fase 0 — Preparación e infraestructura

## M0-T01 · Verificar setup de testing y dependencias
- **Estimate**: 2h · **Labels**: `testing`, `backend`
- **Descripción**: Verificar si el proyecto tiene Vitest/Jest configurado. Verificar versiones de `decimal.js`, `@react-pdf/renderer`, `xlsx`. Documentar hallazgos en una decisión y, si falta framework de testing, configurar Vitest.
- **Criterio de aceptación**: `package.json` con framework de tests instalado. Un test trivial pasa. Las 3 deps verificadas (instalar `@react-pdf/renderer` si falta).
- **Archivos**: `package.json`, `vitest.config.ts` (nuevo si aplica), `tsconfig.json`.

## M0-T02 · Migration e0 — registrar módulo "costos" en catálogo
- **Estimate**: 2h · **Labels**: `db`, `backend`
- **Descripción**: Crear migration que inserta un row en la tabla `modules` con `name='costos'`, `description='Gestión de Costos de Servicios'`, `price=0`. NO se toca el enum `modulos`. Activar en `hired_modules` para Transporte SP en staging via SQL manual.
- **Criterio de aceptación**: Migration aplicada. `SELECT name FROM modules WHERE name='costos'` retorna 1 row. Transporte SP tiene un row en `hired_modules` apuntando a este modulo.
- **Archivos**: `supabase/migrations/YYYYMMDDHHMMSS_e0_costos_setup.sql`.
- **Comando**: `npm run create-migration -- e0_costos_setup`

## M0-T03 · Crear scaffold de carpetas del módulo
- **Estimate**: 1h · **Labels**: `backend`
- **Descripción**: Crear la estructura `src/modules/costos/{features,shared}` con `shared/{types,utils,constants,pdf}` y `index.ts` placeholders.
- **Criterio de aceptación**: Estructura de carpetas creada y commiteada. `index.ts` exporta nada todavía. `npm run lint` pasa.
- **Archivos**: ver §1.1 del diseño.

## M0-T04 · Helper `assertModuloHabilitado` y `access.ts`
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: Implementar `src/modules/costos/shared/utils/access.ts` con `assertModuloHabilitado(companyId, moduleName)`. Implementar test unitario.
- **Criterio**: Si no hay `hired_modules` con `module.name='costos'` para la empresa, throw error. Si hay, no throw.
- **Dependencias**: → M0-T02.

## M0-T05 · Crear layout protegido `/dashboard/costos/layout.tsx`
- **Estimate**: 2h · **Labels**: `frontend`, `backend`
- **Descripción**: Layout server-component que verifica módulo costos habilitado y redirige a `/dashboard?error=modulo_no_habilitado` si no.
- **Criterio**: Usuario sin módulo habilitado es redirigido. Usuario con módulo entra. `loading.tsx` y `error.tsx` básicos creados.
- **Archivos**: `src/app/dashboard/costos/{layout.tsx, page.tsx, loading.tsx, error.tsx}`.
- **Dependencias**: → M0-T04.

## M0-T06 · Agregar entrada al sidebar
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Agregar item "Gestión de Costos" en `SideLinks.tsx` con icono `Calculator` (lucide). Verificar si el sidebar actual filtra por `hired_modules`; si no, agregar el filtrado.
- **Criterio**: Usuario admin de Transporte SP ve la entrada. Usuario de otra empresa NO la ve. Click navega a `/dashboard/costos`.
- **Archivos**: `src/shared/components/layout/SideLinks.tsx`.

## M0-T07 · Formatters ARS centralizados
- **Estimate**: 2h · **Labels**: `frontend`
- **Descripción**: Crear `src/shared/lib/utils/formatters.ts` con `formatCurrencyARS`, `formatPercentage`. Tests unitarios.
- **Criterio**: 100k → "$ 100.000,00"; 0.85 → "85,00%". Maneja `null`/`undefined`/`NaN` retornando `—`.
- **Archivos**: `src/shared/lib/utils/formatters.ts` + test.

## M0-T08 · Helpers de Decimal y período
- **Estimate**: 3h · **Labels**: `backend`
- **Descripción**: Crear `src/modules/costos/shared/utils/decimal.ts` (toClientNumber, toClientString, parseDecimal) y `periodo.ts` (parsePeriodo, formatPeriodo, comparePeriodos, nextPeriodo, prevPeriodo). Tests.
- **Criterio**: 100% de cobertura en estos 2 archivos. parsePeriodo rechaza '2026-13', '202604', etc.

## M0-T09 · Bucket Supabase Storage `costos-pdfs`
- **Estimate**: 3h · **Labels**: `backend`, `deploy`
- **Descripción**: Crear bucket `costos-pdfs` en Supabase staging. Definir políticas RLS: lectura solo si el usuario tiene `share_company_users` para el `companyId` que aparece en el path. Documentar comandos.
- **Criterio**: Bucket creado. Políticas aplicadas. Test manual: subir un PDF dummy desde un test → URL firmada se genera correcta.
- **Archivos**: `supabase/migrations/YYYYMMDDHHMMSS_costos_storage_policies.sql` (si se versionan políticas) + doc en `referencias/README.md`.

## M0-T10 · Constantes del módulo
- **Estimate**: 1h · **Labels**: `backend`
- **Descripción**: Crear `src/modules/costos/shared/constants/index.ts` con `COSTOS_MODULE_NAME`, `COSTOS_PDF_BUCKET`, `COSTOS_PDF_PATHS` helper, `COSTOS_SIGNED_URL_TTL`, `COSTOS_PONDERACION_TOLERANCIA`.
- **Criterio**: Archivo creado. Import test desde otro archivo del módulo funciona.

## M0-T11 · Index/dashboard placeholder de costos
- **Estimate**: 2h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/page.tsx` con un dashboard placeholder (cards de "CCT", "Servicios", "Composiciones", "Liquidaciones" con conteos en 0). Sirve como landing del módulo.
- **Criterio**: Navegación funcional. Diseño coherente con otros dashboards del proyecto.
- **Dependencias**: → M0-T05, M0-T06.

---

# M1 · Fase 1 — Configurador de CCT + motor de conceptos

## M1-T01 · Migration e1 — modelos del configurador CCT
- **Estimate**: 4h · **Labels**: `db`, `backend`
- **Descripción**: Migration con `config_cct`, `categoria_cct`, `concepto_cct`, `valor_concepto_categoria`, `tope_imponible` + enums `tipo_concepto_cct`, `ambito_concepto_cct`, `clase_calculo_concepto`. Relaciones inversas en `company`. Indices según diseño §2.2.
- **Criterio**: Migration aplica sin errores. `npm run gentypes` y `prisma generate` regeneran tipos. Tipos se importan desde `@/generated/prisma/client`.
- **Archivos**: `supabase/migrations/YYYYMMDDHHMMSS_e1_config_cct.sql`, `prisma/schema.prisma`.

## M1-T02 · Tipos compartidos cct.types.ts
- **Estimate**: 3h · **Labels**: `backend`
- **Descripción**: `src/modules/costos/shared/types/cct.types.ts` con `CreateCCTInput`, `CategoriaInput`, `ConceptoInput`, **discriminated union `ParametrosConcepto`** (7 variantes), `TopeInput`, `ContextoCalculo`, `ConceptoResuelto`, `CCTResuelto`.
- **Criterio**: TS compila. `ParametrosConcepto` permite narrowing por `clase`.
- **Dependencias**: → M1-T01.

## M1-T03 · Motor de conceptos: dispatcher + clases simples
- **Estimate**: 6h · **Labels**: `backend`, `golden-test`
- **Descripción**: `motor-conceptos.ts` con `resolverConceptos`, dispatcher por clase, e implementación de las 4 clases simples: `FIJO_GLOBAL`, `FIJO_POR_CATEGORIA`, `POR_ANTIGUEDAD_VALOR`, `POR_ANTIGUEDAD_PCT`. Tests unitarios por clase.
- **Criterio**: Cada clase tiene su test con input/output específico. Trace string legible para auditoría.
- **Dependencias**: → M1-T02.

## M1-T04 · Motor de conceptos: clases por porcentaje + topológico
- **Estimate**: 6h · **Labels**: `backend`
- **Descripción**: Implementar `PCT_CONCEPTO`, `PCT_SUMA_CONCEPTOS`. Implementar ordenamiento topológico de conceptos según dependencias. Detectar ciclos (throw `ConceptoCiclicoError`). Tests.
- **Criterio**: Test con 5 conceptos interdependientes resuelve correctamente. Test de ciclo lanza error con mensaje claro.
- **Dependencias**: → M1-T03.

## M1-T05 · Motor de conceptos: clase POR_UNIDAD + topes imponibles
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: Implementar `POR_UNIDAD` (con derivación opcional desde otro concepto, recargo, soporte horas/días). Aplicar `tope_codigo` con consulta a `tope_imponible` de vigencia más reciente. Tests.
- **Criterio**: Test de hs nocturnas (recargo 30% derivado de básico). Test de jubilación 11% sobre suma con tope.
- **Dependencias**: → M1-T04.

## M1-T06 · Función `resolverCCT` (top-level con queries)
- **Estimate**: 3h · **Labels**: `backend`
- **Descripción**: Función top-level que carga conceptos+valores+topes desde Prisma y llama a `resolverConceptos`. Manejo de errores y `companyId` scoping.
- **Criterio**: 1 query batched para conceptos del CCT, 1 para valores por categoría, 1 para topes con vigencia. No N+1. Test con CCT de fixture.
- **Dependencias**: → M1-T05.

## M1-T07 · Validador `validarConceptosCCT`
- **Estimate**: 3h · **Labels**: `backend`
- **Descripción**: Validar al guardar un concepto: referencias existentes, no introduce ciclo, tope_codigo existe, ámbito coherente con dependencias. Función `validarConceptosCCT` reutilizable.
- **Criterio**: Tests para cada caso de validación. Mensaje de error legible.
- **Dependencias**: → M1-T04.

## M1-T08 · Server Actions CCT (CRUD CCT y paritarias)
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: `actions.server.ts` con `listCCTs`, `getCCT`, `createCCT`, `clonarParitaria` (clona categorías + conceptos del período anterior), `closeParitaria`, `deleteCCT` (con guarda).
- **Criterio**: Todas las queries scoped por `companyId`. Tests de integración con Prisma mock o test DB.
- **Dependencias**: → M1-T01.

## M1-T09 · Server Actions CCT (Categorías y Conceptos)
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: Acciones `addCategoria`, `updateCategoria`, `deleteCategoria`, `addConcepto`, `updateConcepto`, `deleteConcepto`, `reorderConceptos`, `setValorPorCategoria`, `bulkSetValores`. Cada concepto se valida con `validarConceptosCCT` antes de persistir.
- **Criterio**: Bloqueo si el CCT tiene composiciones/liquidaciones referenciando (modo solo lectura). Tests.
- **Dependencias**: → M1-T07, M1-T08.

## M1-T10 · Server Actions Topes Imponibles
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `listTopes`, `addTope`, `updateTope`, `deleteTope`. Acceso restringido a `profile.role === 'Admin'` (admin del sistema, no de la empresa cliente).
- **Criterio**: Test que un usuario no-admin recibe error 403.

## M1-T11 · UI: PanelCCT con selectores
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Server Component `PanelCCT.tsx` que renderiza `SelectorCCT` + `SelectorParitaria` + tabs container. Página `/dashboard/costos/configuracion-cct`.
- **Criterio**: UI navegable. Selectores dispatchan correctamente. Tabs muestran placeholders.
- **Dependencias**: → M1-T08.

## M1-T12 · UI: FormNuevoCCT y FormNuevaParitaria
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Sheets para crear nuevo CCT y nueva paritaria (esta última clona). React Hook Form + Zod.
- **Criterio**: Validación de campos. Crear CCT inserta correctamente. Clonar paritaria crea nuevo período con mismos conceptos.
- **Dependencias**: → M1-T11.

## M1-T13 · UI: TabCategorias (DataTable + CRUD)
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: DataTable con columnas codigo, nombre, orden. Acciones edit/delete. Botón "Nueva categoría" abre Dialog. Drag-and-drop para reordenar.
- **Criterio**: CRUD funcional. El reordenamiento persiste.
- **Dependencias**: → M1-T09, M1-T11.

## M1-T14 · UI: TabConceptos con DataTable filtrable
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: DataTable con columnas codigo, nombre, tipo, ámbito, clase, orden. Filtros por tipo y ámbito (toggle). Botón "Nuevo concepto".
- **Criterio**: Filtros funcionan. Click en fila abre Sheet de edición.
- **Dependencias**: → M1-T11.

## M1-T15 · UI: FormConcepto con form dinámico (ParametrosFormByClase)
- **Estimate**: 6h · **Labels**: `frontend`
- **Descripción**: Sheet con campos generales (codigo, nombre, tipo, ámbito, clase, orden). Bloque "Parámetros" cambia según clase elegida (componente `ParametrosFormByClase` con switch). Para `PCT_CONCEPTO` y `PCT_SUMA_CONCEPTOS`, los selectores de "concepto referenciado" leen los conceptos del mismo CCT.
- **Criterio**: Cambiar la clase resetea solo los campos de parámetros, no los generales. Valida con Zod antes de submit. Errores legibles.
- **Dependencias**: → M1-T09, M1-T14.

## M1-T16 · UI: TabValoresPorCategoria
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Filtra conceptos con clase `FIJO_POR_CATEGORIA`. Renderiza grilla `concepto × categoría` con celdas editables in-place. Bulk save.
- **Criterio**: Carga rápida (1 query por todos los valores). Edición optimista con rollback en error.
- **Dependencias**: → M1-T09, M1-T11.

## M1-T17 · UI: PanelTopesImponibles
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/topes-imponibles` con DataTable simple: codigo, vigencia_desde, valor, fuente. CRUD vía Dialog. Acceso restringido a admin del sistema.
- **Criterio**: Usuario no-admin recibe redirect/403. CRUD funcional para admin.
- **Dependencias**: → M1-T10.

## M1-T18 · Seed CCT 545/08 UOCRA Petroleros
- **Estimate**: 6h · **Labels**: `seed`, `backend`
- **Descripción**: `scripts/seed-cct-545-08.ts` que inserta el CCT 545/08 con sus 7 categorías (G B / H B / I B / J B / M B / VII B / OFESP) y ~25 conceptos con sus parámetros y valores por categoría, transcritos de las planillas. Idempotente (ON CONFLICT).
- **Criterio**: Ejecución del script en staging crea el CCT completo. Re-ejecución es no-op.
- **Dependencias**: → M1-T09.

## M1-T19 · Tests golden: liquidación Bide / Guiñazu / Moragues (motor de conceptos)
- **Estimate**: 6h · **Labels**: `testing`, `golden-test`, `bloqueante`
- **Descripción**: 3 tests que arman fixtures con CCT 545/08 (transcripto de planillas) y los inputs de cada chofer (días, hs, antigüedad, categoría) y validan que el motor de conceptos reproduce los conceptos del recibo (cantidad de líneas, valores, totales) ±$0.01.
- **Criterio**: 3 tests verdes. Las diferencias detectadas se documentan en `referencias/README.md`.
- **Dependencias**: → M1-T06, M1-T18.

## M1-T20 · Validación de período activo único por CCT × empresa
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: Constraint a nivel app: al crear/clonar paritaria, el sistema cierra el `vigencia_hasta` del período anterior automáticamente. Solo un período con `vigencia_hasta=null` por (company_id, cct_codigo).
- **Criterio**: Test que reproduce el caso. Mensaje de error si se intenta tener 2 activos.
- **Dependencias**: → M1-T08.

---

# M2 · Fase 2 — Costo de equipos y combustible

## M2-T01 · Migration e2 — modelos de equipos y combustible
- **Estimate**: 3h · **Labels**: `db`, `backend`
- **Descripción**: Migration con `costo_equipo`, `item_mantenimiento`, `registro_combustible` + relaciones inversas en `vehicles` y `company`. Schema diseño §2.3.
- **Criterio**: Migration aplica. `npm run gentypes` y `prisma generate` ok.
- **Archivos**: nueva migration + `prisma/schema.prisma`.

## M2-T02 · Tipos compartidos equipo y combustible
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `equipo.types.ts` y `combustible.types.ts` con `CostoEquipoInput`, `ItemMantInput`, `VehiculoConCosto`, `RegistroCombustibleInput`.

## M2-T03 · Motor de amortización y mantenimiento
- **Estimate**: 4h · **Labels**: `backend`, `golden-test`
- **Descripción**: `calcular-amortizacion.ts` y `calcular-mantenimiento.ts` con funciones puras según diseño §5.2. Tests con valores de PECOM IVECO 170S28 y AESA IVECO 10-190.
- **Criterio**: PECOM: 319M valor compra → costo mensual $7,794,945 (test golden). AESA: 247M → $6,656,716.
- **Dependencias**: → M2-T01.

## M2-T04 · Server Actions equipos
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: `equipos/actions.server.ts` con `listVehiculosConCosto`, `getCostoEquipo`, `upsertCostoEquipo`, CRUD de items, `bulkAddItemsMantenimiento`.
- **Criterio**: Reusa `vehicles` existentes (no reimplementa). Tests integración. Scope por `companyId`.
- **Dependencias**: → M2-T01, M2-T03.

## M2-T05 · Server Actions combustible
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `combustible/actions.server.ts` con `listRegistrosCombustible`, `upsertRegistroCombustible`, `deleteRegistroCombustible`. Constraint único por servicio+vehicle+período.
- **Criterio**: Tests CRUD. Constraint funciona.
- **Dependencias**: → M2-T01.

## M2-T06 · UI: TablaEquiposCosto + ResumenCostoEquipo
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: DataTable de vehículos con costos asociados. Columnas: vehículo, valor compra, costo mensual calculado, items count. Click → detalle.
- **Criterio**: Navegación funcional. Costo mensual calculado en server.
- **Dependencias**: → M2-T04.

## M2-T07 · UI: FormCostoEquipo + tabla de items
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Página detalle `/dashboard/costos/equipos/[vehicleId]`. Form de costo_equipo arriba (valor compra, residual, años, accesorios). DataTable de items abajo con CRUD.
- **Criterio**: Form valida. Items se agregan/editan/eliminan con feedback inmediato.
- **Dependencias**: → M2-T04, M2-T06.

## M2-T08 · UI: ImportarItemsDialog (carga rápida)
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Dialog que acepta CSV o JSON pegado con items. Parser tolerante. Preview antes de insertar.
- **Criterio**: Carga 30+ items en una sola operación. Manejo de errores de formato.
- **Dependencias**: → M2-T07.

## M2-T09 · UI: Combustible (lista + form mensual)
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/combustible` con DataTable de registros (servicio + vehículo + período). Form mensual editable. Selector de servicio.
- **Criterio**: Carga mensual ágil. Suma agregada por servicio visible.
- **Dependencias**: → M2-T05.

## M2-T10 · Tests golden: combustible PECOM
- **Estimate**: 2h · **Labels**: `testing`, `golden-test`
- **Descripción**: Test reproduciendo combustible PECOM Jun25: 950 lts × 1596 + 47.5 lts × 3227.5 = $1,669,506.
- **Dependencias**: → M2-T05.

---

# M3 · Fase 3 — Servicio/Contrato + MOD + OCP — **HITO P-2**

## M3-T01 · Migration e3 — servicio_contrato + MOD + OCP
- **Estimate**: 4h · **Labels**: `db`, `backend`, `bloqueante`
- **Descripción**: Migration con `servicio_contrato` (FK a `config_cct`), `asignacion_mod` (FK a `categoria_cct`), `asignacion_equipo_servicio`, `item_ocp`. Relaciones inversas en `customers`, `employees`, `vehicles`, `company`, `config_cct`, `categoria_cct`. Schema §2.4.
- **Criterio**: Migration aplica. Tipos regenerados.

## M3-T02 · Tipos compartidos servicio, mod, ocp
- **Estimate**: 3h · **Labels**: `backend`
- **Descripción**: `servicio.types.ts`, `mod.types.ts`, `ocp.types.ts` con todos los tipos del diseño §10.2.

## M3-T03 · Server Actions servicios (CRUD)
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: `servicios/actions.server.ts` con `listServicios`, `getServicio`, `createServicio`, `updateServicio`, `deleteServicio`, `asignarEquiposServicio`. Validar que `customer_id` y `config_cct_id` pertenecen a la empresa.
- **Criterio**: Tests integración con scope multi-tenant.
- **Dependencias**: → M3-T01.

## M3-T04 · Server Actions MOD (asignaciones)
- **Estimate**: 3h · **Labels**: `backend`
- **Descripción**: `mod/actions.server.ts` con CRUD de `asignacion_mod`. Validar que `categoria_cct_id` pertenece al CCT del servicio. Manejo de `overrides_calculo` JSON.
- **Criterio**: Si la categoría no es del CCT del servicio, rechazar. Tests.
- **Dependencias**: → M3-T03.

## M3-T05 · Server Actions OCP
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `ocp/actions.server.ts` con CRUD de items. Agrupación por `grupo`.
- **Dependencias**: → M3-T01.

## M3-T06 · Motor MOD del servicio (calcular-mod.ts)
- **Estimate**: 6h · **Labels**: `backend`, `bloqueante`
- **Descripción**: Implementar `calcularMOD(servicioId, periodo)` según diseño §6.2. Itera asignaciones, construye contexto, invoca motor de conceptos, suma. Tests integración.
- **Criterio**: Test devuelve `ResumenMOD` completo con desglose por chofer y total. Coincide con valores de PECOM y AESA.
- **Dependencias**: → M1-T06, M3-T04.

## M3-T07 · Motor OCP (calcular-ocp.ts)
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `calcularOCP(servicioId)` según §6.3. Suma por grupo × cantidad_personas / 12. Tests.
- **Criterio**: Test golden contra PECOM ($522,447) y AESA ($486,939).
- **Dependencias**: → M3-T05.

## M3-T08 · UI: Listado de servicios + crear
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/servicios` con DataTable. Sheet "Nuevo servicio" con form (customer, CCT, fechas, márgenes, config_servicio).
- **Criterio**: Lista y crea servicios. Filtros por customer y estado.
- **Dependencias**: → M3-T03.

## M3-T09 · UI: Detalle de servicio (tabs container)
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/servicios/[id]` con tabs: General, MOD, OCP, Equipos, Composición (placeholder). Layout con shadcn Tabs.
- **Criterio**: Navegación entre tabs. Datos del servicio cargados en server.
- **Dependencias**: → M3-T08.

## M3-T10 · UI: Tab MOD (asignaciones + resumen)
- **Estimate**: 6h · **Labels**: `frontend`
- **Descripción**: DataTable de asignaciones con columnas: empleado, categoría, antigüedad, afectación, hs estimadas. Sheet de creación con selector de empleado, categoría (filtrada por CCT del servicio), inputs de overrides. Card "Resumen MOD" con desglose por chofer + total.
- **Criterio**: Suma del resumen coincide con cálculo del motor. Edición de afectación re-calcula automáticamente.
- **Dependencias**: → M3-T06, M3-T09.

## M3-T11 · UI: Tab OCP (items + resumen)
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: DataTable agrupado por `grupo`. CRUD inline. Card "Resumen OCP" con totales por grupo y total general.
- **Criterio**: Agrupación visible. Total coincide con motor.
- **Dependencias**: → M3-T07, M3-T09.

## M3-T12 · UI: Tab Equipos (asignaciones + resumen)
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: DataTable de asignaciones de equipos al servicio. Form con selector de vehículo (con costo_equipo cargado), afectación, km mensuales.
- **Criterio**: Suma de costo mensual de equipos por servicio coincide con planilla.
- **Dependencias**: → M3-T03, M3-T09.

## M3-T13 · UI: Páginas transversales mano-de-obra y otros-costos-personal
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Páginas listado transversales con filtro por servicio. Útil para ver toda la nómina o todos los OCP juntos.
- **Dependencias**: → M3-T10, M3-T11.

## M3-T14 · Test golden: bruto MOD coincide con bruto recibo (3 choferes)
- **Estimate**: 4h · **Labels**: `testing`, `golden-test`, `bloqueante`
- **Descripción**: Test que arma servicio fictio asignando los 3 choferes Bide/Guiñazu/Moragues con sus categorías y antigüedades, y valida que `calcularMOD` produce un bruto remunerativo idéntico al de cada recibo ±$0.01. Este es el criterio del HITO P-2.
- **Dependencias**: → M3-T06, M1-T19.

## M3-T15 · Cobertura ≥80% de motor MOD/OCP
- **Estimate**: 3h · **Labels**: `testing`
- **Descripción**: Asegurar cobertura ≥80% en `calcular-mod.ts`, `calcular-ocp.ts`, `motor-conceptos.ts`. Agregar tests faltantes.
- **Dependencias**: → M3-T14.

---

# M4 · Fase 4 — Composición de costos + PDF

## M4-T01 · Migration e4 — composición + outputs
- **Estimate**: 3h · **Labels**: `db`, `backend`
- **Descripción**: Migration con `composicion_costo`, `tipo_output_servicio`, `output_composicion`. Relaciones inversas. Schema §2.5.

## M4-T02 · Tipos compartidos composición
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `composicion.types.ts` con `ComposicionDetalle`, `TipoOutputInput`, `FormulaOutput` (discriminated union), `ResumenEquipos`, `ResumenCombustible`.

## M4-T03 · Motor de composición (calcular-composicion.ts)
- **Estimate**: 6h · **Labels**: `backend`, `bloqueante`
- **Descripción**: `calcularComposicion(servicioId, periodo)` que llama a los 4 sub-motores (MOD/OCP/Equipos/Combustible), suma, aplica márgenes con divisor + licencia ordenanza. Devuelve `ComposicionDetalle` completo.
- **Criterio**: Test golden PECOM Jun25 → precio mensual $23,560,093.
- **Dependencias**: → M3-T06, M3-T07, M2-T03.

## M4-T04 · Calculador de outputs derivados
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: `calcular-outputs.ts` con dispatcher por tipo de fórmula (`precio_div_kms_x_factor`, `precio_div_dias`, `precio_div_dias_x_horas`, `pct_sobre_precio`).
- **Criterio**: Tests por tipo. Ingeniería inversa de los factores PECOM (km excedente, día feriado, hora extra, descuento 7%) documentada en `referencias/README.md`.
- **Dependencias**: → M4-T03.

## M4-T05 · Server Actions composición
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: `composicion/actions.server.ts` con `listComposiciones`, `getComposicion`, `calcularComposicion` (server-side, devuelve detalle), `persistirComposicion` (guarda snapshot), `regenerarPDF`, `getSignedUrlPDF`.
- **Criterio**: Tests de integración. Idempotencia: dos llamadas con mismas fuentes dan mismo resultado.
- **Dependencias**: → M4-T03, M4-T04.

## M4-T06 · Server Actions tipo_output_servicio
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: CRUD de outputs configurables por servicio.

## M4-T07 · PDF template composición (@react-pdf/renderer)
- **Estimate**: 6h · **Labels**: `pdf`, `frontend`
- **Descripción**: `composicion-template.tsx` con `<Document>`, secciones: Header (datos empresa+cliente+servicio), Costo Industrial (tabla con 4 subtotales), Márgenes (% + valor aplicado), Precios (precio mensual + outputs en tabla). Función `renderComposicionPDF(detalle)` que devuelve Buffer.
- **Criterio**: Test que renderiza PDF y verifica strings esperados. Visual coherente con planilla del cliente.
- **Dependencias**: → M4-T03.

## M4-T08 · Helper Storage para PDFs
- **Estimate**: 3h · **Labels**: `backend`
- **Descripción**: `shared/utils/storage.ts` con `subirPDF(path, buffer)` y `getSignedUrlPDF(path)`. Usa `supabaseServer()` directamente.
- **Criterio**: Test de subida + URL firmada.
- **Dependencias**: → M0-T09.

## M4-T09 · UI: Listado de composiciones
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/composicion` con DataTable. Filtros por servicio y período. Acción "Nueva composición" → modal con servicio + período.
- **Dependencias**: → M4-T05.

## M4-T10 · UI: Detalle de composición + exportar PDF
- **Estimate**: 6h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/composicion/[id]` con cards de Resumen Industrial, Márgenes, Precios + Outputs. Botón "Exportar PDF" (genera + abre URL firmada). Botón "Recalcular" (advierte si difiere del snapshot).
- **Criterio**: Vista clara, exportable. UX coherente con módulos existentes.
- **Dependencias**: → M4-T05, M4-T07, M4-T08.

## M4-T11 · UI: Config outputs por servicio
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Componente `ConfigOutputsServicio.tsx` embebible en tab "General" del servicio o pantalla aparte. CRUD de tipo_output_servicio con form dinámico según tipo de fórmula.
- **Dependencias**: → M4-T06.

## M4-T12 · UI: Embed composición en tab del servicio
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Tab "Composición" en `/dashboard/costos/servicios/[id]` que muestra composiciones de ese servicio + botón "Generar composición de período YYYY-MM".
- **Dependencias**: → M3-T09, M4-T10.

## M4-T13 · Tests golden: composición PECOM y AESA
- **Estimate**: 4h · **Labels**: `testing`, `golden-test`, `bloqueante`
- **Descripción**: Test PECOM Jun25 (precio mensual $23,560,093) y AESA Abr26 ($27,183,638). Verificar también outputs específicos de cada servicio.
- **Dependencias**: → M4-T03, M4-T04.

---

# M5 · Fase 5 — Fórmula Polinómica — **HITO P-3**

## M5-T01 · Migration e5 — fórmula polinómica
- **Estimate**: 3h · **Labels**: `db`, `backend`
- **Descripción**: Migration con `formula_polinomica`, `componente_formula`, `periodo_formula_polinomica`, `valor_componente_periodo` + enum `tipo_indice_polinomico`. Schema §2.6.

## M5-T02 · Tipos compartidos fórmula
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `formula-polinomica.types.ts` con `CreateFormulaInput`, `ComponenteInput`, `CalculoPeriodoPolinomico`.

## M5-T03 · Motor polinómico (calcular-formula-polinomica.ts)
- **Estimate**: 6h · **Labels**: `backend`, `bloqueante`
- **Descripción**: `calcularPeriodoFormula`, `calcularSerieFormula`, `validarPonderaciones` según diseño §8.2. Implementar fórmula `P = PB × (1 + Σ Pi × ΔIi%)` con `decimal.js`. Manejo de retroactivos.
- **Criterio**: Test golden PECOM Jul25 → ajuste 5.769%, valor 20,016,571.
- **Dependencias**: → M5-T01.

## M5-T04 · Server Actions fórmula
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: `formula-polinomica/actions.server.ts` con CRUD de fórmula y componentes, `inicializarPonderacionesDesdeComposicion` (lee composición más reciente y arma 4 componentes I001-I004 con ponderaciones derivadas).
- **Criterio**: Validación de ponderaciones suma 1.0. Tests.
- **Dependencias**: → M5-T03.

## M5-T05 · Server Actions períodos polinómica
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: `upsertPeriodo`, `listPeriodos`, `deletePeriodo`. Cálculo automático de `valor_ajustado` y `retroactivo_acumulado` al cargar índices.
- **Criterio**: Test reproduciendo serie completa Jun25–Feb26.
- **Dependencias**: → M5-T03.

## M5-T06 · UI: Lista de fórmulas y configuración
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: `/dashboard/costos/formula-polinomica` con listado de servicios + estado de fórmula. Click → detalle del servicio.
- **Dependencias**: → M5-T04.

## M5-T07 · UI: Detalle fórmula con componentes
- **Estimate**: 5h · **Labels**: `frontend`
- **Descripción**: Card config + Card componentes (tabla con ponderaciones + sumatoria visible, rojo si ≠ 1.0). Botón "Inicializar desde composición".
- **Dependencias**: → M5-T06.

## M5-T08 · UI: Tabla de períodos con índices
- **Estimate**: 5h · **Labels**: `frontend`
- **Descripción**: DataTable con columnas: período, valores de cada índice, ajuste %, valor ajustado, importe certificado, retroactivo. Form para cargar/editar índices del período.
- **Criterio**: Cálculo en cada cambio. Edición de importe_certificado actualiza retroactivo.
- **Dependencias**: → M5-T05, M5-T07.

## M5-T09 · UI: Gráfico de evolución
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: Componente `GraficoEvolucionTarifa.tsx` con recharts. Línea de `valor_ajustado` + línea de `importe_certificado` por período. Hover con tooltip de retroactivo.
- **Dependencias**: → M5-T08.

## M5-T10 · UI: Resumen de retroactivos
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Card que agrega los retroactivos pendientes por servicio/período. Útil para gestión comercial.
- **Dependencias**: → M5-T08.

## M5-T11 · Test golden: serie completa PECOM Jun25–Feb26
- **Estimate**: 4h · **Labels**: `testing`, `golden-test`, `bloqueante`
- **Descripción**: Test que carga la fórmula PECOM con ponderaciones y precio_base reales, simula los 9 períodos con sus índices y valida cada `valor_ajustado` ±$0.01. Es el criterio del HITO P-3.
- **Dependencias**: → M5-T03, M5-T05.

---

# M6 · Fase 6 — Liquidación de sueldos + Deploy — **HITO P-4**

## M6-T01 · Migration e6 — liquidación
- **Estimate**: 3h · **Labels**: `db`, `backend`
- **Descripción**: Migration con `liquidacion_sueldo` (FK a `categoria_cct`) + enum `estado_liquidacion`. Relaciones inversas. Schema §2.7.

## M6-T02 · Tipos compartidos liquidación
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `liquidacion.types.ts` con `InputsLiquidacion`, `LiquidacionResultado`, `LiquidacionDetalle`.

## M6-T03 · Motor de liquidación (calcular-liquidacion-cct.ts)
- **Estimate**: 6h · **Labels**: `backend`, `bloqueante`
- **Descripción**: `calcularLiquidacion(employeeId, categoriaCCTId, cctId, periodo, inputs)` según diseño §9.2. Reusa motor de conceptos con ámbito `liquidacion`. Sub-cálculo de SAC con sus propios aportes.
- **Criterio**: Tests golden contra los 3 recibos. Neto coincide ±$0.01.
- **Dependencias**: → M1-T06.

## M6-T04 · Server Actions liquidación
- **Estimate**: 5h · **Labels**: `backend`
- **Descripción**: `liquidacion/actions.server.ts` con `listLiquidaciones`, `getLiquidacion`, `generarBorrador`, `actualizarBorrador`, `recalcularLiquidacion`, `confirmarLiquidacion`, `marcarPagada`.
- **Criterio**: Estados: borrador → confirmada → pagada. No se puede editar inputs si estado≠borrador.
- **Dependencias**: → M6-T03.

## M6-T05 · Bulk: generar borradores de nómina del mes
- **Estimate**: 4h · **Labels**: `backend`
- **Descripción**: Server action que toma un período y genera borradores de liquidación para todos los empleados con asignación activa en algún servicio. Manejo de errores parciales (algunos generan, otros fallan).
- **Criterio**: Test integración con 5 empleados. Reporte de éxitos/fallos.
- **Dependencias**: → M6-T04.

## M6-T06 · PDF template recibo (@react-pdf/renderer)
- **Estimate**: 6h · **Labels**: `pdf`, `frontend`
- **Descripción**: `recibo-template.tsx` con header empresa, datos empleado, tabla conceptos remunerativos+no remunerativos+descuentos, tabla SAC, totales, firma. Visual: A4 portrait, formato similar al recibo del cliente.
- **Criterio**: PDF generado coincide con estructura del recibo Bide. Valores correctos.
- **Dependencias**: → M6-T03.

## M6-T07 · Server Actions PDF recibo
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: `generarReciboPDF`, `getSignedUrlRecibo`. Subida a `costos-pdfs/liquidaciones/{companyId}/{employeeId}/{periodo}.pdf`.
- **Dependencias**: → M6-T06, M4-T08.

## M6-T08 · UI: Listado de liquidaciones
- **Estimate**: 4h · **Labels**: `frontend`
- **Descripción**: `/dashboard/costos/liquidacion-sueldos` con DataTable. Filtros por período, estado, empleado. Botones "Nueva liquidación" y "Generar nómina del mes".
- **Dependencias**: → M6-T04.

## M6-T09 · UI: Form nueva liquidación + bulk
- **Estimate**: 5h · **Labels**: `frontend`
- **Descripción**: Sheet con selector de empleado, período, inputs (días, hs nocturnas, hs extras 50/100, días feriado, días desarraigo, inputs extra JSON). Botón aparte para "Generar nómina del mes" con confirmación.
- **Dependencias**: → M6-T05, M6-T08.

## M6-T10 · UI: Detalle liquidación + preview recibo
- **Estimate**: 6h · **Labels**: `frontend`
- **Descripción**: Página `/dashboard/costos/liquidacion-sueldos/[id]` con datos del empleado, inputs editables (si borrador), card "Preview del recibo" con render HTML idéntico al PDF, botones según estado (Recalcular / Confirmar / Marcar pagada / Descargar PDF).
- **Criterio**: Preview HTML coincide con PDF. Flujo de estados visible.
- **Dependencias**: → M6-T04, M6-T07.

## M6-T11 · UI: Resumen de nómina (totales agregados)
- **Estimate**: 3h · **Labels**: `frontend`
- **Descripción**: Card con totales del período: total bruto, total descuentos, total neto, conteo de liquidaciones por estado.
- **Dependencias**: → M6-T08.

## M6-T12 · Tests golden: 3 recibos reales (Bide / Guiñazu / Moragues)
- **Estimate**: 4h · **Labels**: `testing`, `golden-test`, `bloqueante`
- **Descripción**: Test que reproduce las 3 liquidaciones reales con sus inputs y valida `neto_a_pagar` ±$0.01. Es el criterio del HITO P-4.
- **Dependencias**: → M6-T03.

## M6-T13 · Auditoría: log de generación/confirmación de liquidación
- **Estimate**: 2h · **Labels**: `backend`
- **Descripción**: Registrar en una tabla de auditoría (existente o nueva) cada confirmación de liquidación: quién, cuándo, qué liquidación. Verificar si existe `debug_logs` o similar.
- **Criterio**: Tests que verifican el log se escribe.

## M6-T14 · Deploy: aplicar migrations en producción
- **Estimate**: 3h · **Labels**: `deploy`, `bloqueante`
- **Descripción**: Plan de deploy: aplicar las 7 migrations en orden (e0..e6) en producción. `npm run push-migrations`. Validar que ningún query existente se rompe.
- **Criterio**: Migrations aplicadas. App productiva sin errores.
- **Dependencias**: → todas las migrations anteriores.

## M6-T15 · Deploy: insertar `modules` row "costos" en producción
- **Estimate**: 1h · **Labels**: `deploy`
- **Descripción**: SQL manual para insertar el row de catálogo "costos" en producción. Activar `hired_modules` para Transporte SP en producción.
- **Dependencias**: → M6-T14.

## M6-T16 · Deploy: bucket `costos-pdfs` en producción
- **Estimate**: 2h · **Labels**: `deploy`
- **Descripción**: Crear bucket en Supabase prod con políticas RLS (mismo procedimiento que staging).
- **Dependencias**: → M6-T14, M0-T09.

## M6-T17 · Deploy: ejecutar seed CCT 545/08 en producción
- **Estimate**: 2h · **Labels**: `deploy`, `seed`
- **Descripción**: Ejecutar `seed-cct-545-08.ts` en producción. Validar que las 7 categorías y los conceptos quedaron creados.
- **Dependencias**: → M6-T15, M1-T18.

## M6-T18 · Smoke tests end-to-end en producción
- **Estimate**: 4h · **Labels**: `testing`, `deploy`
- **Descripción**: Login con usuario Transporte SP, recorrer las 9 pantallas del módulo, generar una composición real, generar una liquidación real, descargar ambos PDFs.
- **Criterio**: Todo funciona. Capturas de cada pantalla en el ticket.
- **Dependencias**: → M6-T17.

## M6-T19 · Capacitación con cliente
- **Estimate**: 4h · **Labels**: `deploy`
- **Descripción**: Sesión con Transporte SP para mostrar el módulo: configuración de CCT, creación de servicios, generación de composiciones, liquidaciones. Material de soporte (video screencast).
- **Dependencias**: → M6-T18.

## M6-T20 · Documentación de operación
- **Estimate**: 3h · **Labels**: `deploy`
- **Descripción**: Manual de uso para el cliente: cómo cargar nueva paritaria, cómo generar liquidación masiva, cómo cargar índices polinómicos, cómo configurar nuevos servicios. Markdown en repo + PDF.
- **Dependencias**: → M6-T19.

---

# Resumen

| Milestone | Tareas | Estimación total | Hito de pago |
|---|---|---|---|
| M0 · Fase 0 | 11 | ~25h | — |
| M1 · E-1 CCT | 20 | ~80h | — |
| M2 · E-2 Equipos+Comb | 10 | ~31h | — |
| M3 · E-3 MOD+OCP | 15 | ~57h | **P-2** |
| M4 · E-4 Composición | 13 | ~50h | — |
| M5 · E-5 Polinómica | 11 | ~44h | **P-3** |
| M6 · E-6 Liquidación | 20 | ~71h | **P-4** |
| **Total** | **100 tasks** | **~358h** | $7,350,000 |

> El estimado total (358h) está por encima de las 300h del spec porque incluye trabajo de testing/QA/deploy que el spec marca como "incluido pero no detallado". La cobertura real de cada hito sigue siendo la del spec.

## Dependencias críticas (camino crítico)

```
M0-T02 → M0-T05 → M0-T11 → M1-T01 → M1-T03..T05 → M1-T06 → M1-T18 → M1-T19 → M3-T06 → M3-T14 (P-2)
                                                                        ↓
                                                              M4-T03 → M4-T13 → M5-T03 → M5-T11 (P-3)
                                                                                          ↓
                                                                                 M6-T03 → M6-T12 → M6-T14..T20 (P-4)
```

## Tareas paralelas (pueden trabajarse al mismo tiempo)

- M0 (T01-T11) → todas paralelizables salvo dependencias declaradas
- M1 UI (T11-T17) → paralelas entre sí una vez listas las actions
- M2 (en paralelo con M1 si hay dos developers)
- Tests golden de cada fase → paralelos a la implementación de UI
