# Hallazgos de la suite E2E

Bugs y riesgos encontrados al escribir los tests contra el clon desplegado (`https://codecontrol-clon.31.97.42.82.sslip.io`).
Cada uno tiene su `test.fixme` (salvo los corregidos, ya habilitados) (el test correcto, que falla hoy) salvo que se indique otra cosa.

Estado: **abierto** (sin corregir) · **corregido en código** (el cambio está en el repo pero el clon no lo tiene hasta el próximo
deploy: al desplegar, se quita el `test.fixme` y el test debe pasar).

## Módulos Empresa y Empleados

### H-01 Tras "Agregar empleado" la app vuelve sola al formulario vacío — abierto

- **Pasos:** `/dashboard/employee/action?action=new` > completar las tres pestañas > "Agregar empleado".
- **Esperado:** toast "Empleado agregado correctamente" y quedar en el listado `/dashboard/employee`.
- **Obtenido:** el toast aparece, la app navega a `/dashboard/employee` y unos 500 ms después vuelve a
  `/dashboard/employee/action?action=new` con el formulario vacío (el empleado sí se creó). Reproducido de forma consistente.
- **Causa probable:** `useEmployeeForm.ts` (`onCreate`/`onUpdate`) hace `router.refresh()` y enseguida `router.push('/dashboard/employee')`;
  el refresco de la ruta anterior termina después y pisa la navegación.
- **Evidencia:** `tests/e2e/app/employees/alta.spec.ts` > `tras el alta el usuario queda en el listado de empleados` (fixme). La edición NO rebota
  (verificado con un registro de navegaciones: termina en `/dashboard/employee`); `detalle-edicion.spec.ts` > `tras guardar la edición...` es un test normal.
- **Contorno en los tests:** después del toast se navega explícitamente al listado (`createEmployeeViaUi`).

### H-02 Un empleado sin sindicato/convenio/categoría no se puede editar — corregido en código

- **Pasos:** dar de alta un empleado sin elegir Sindicato > abrirlo con "Editar empleado" > cambiar cualquier dato > "Guardar cambios".
- **Esperado:** se guarda.
- **Obtenido:** no se envía; en la pestaña Datos Laborales aparece "Expected string, received null" bajo Sindicato, Convenio y Categoría.
  Sindicato, convenio y categoría son opcionales en el alta (se guardan como `null`) pero el esquema de edición los exige como texto.
- **Corrección:** `src/shared/zodSchemas/schemas.ts`, `accordionSchemaUpdate`: `guild_id`, `covenants_id`, `category_id` pasan a `z.string().nullish()`.
- **Evidencia:** `detalle-edicion.spec.ts` > `un empleado sin sindicato se puede editar y guardar` (fixme). Los demás tests de edición usan un empleado
  con sindicato, convenio y categoría para poder ejercitar el guardado en el clon actual.

### H-03 Cualquier usuario ve las compañías de todos los clientes — abierto (seguridad)

- **Pasos:** iniciar sesión con el usuario QA (dueño de una sola empresa) > `/dashboard/company`.
- **Esperado:** solo "QA E2E".
- **Obtenido:** se listan las 19 compañías de la base (LA NUEVA16, EMERGENCIAS SA, RUCSO S.A., ...). La pestaña "Grupos compartidos"
  (`?tab=groups`) muestra además razón social y CUIT de empresas ajenas y ofrece "Quitar", "Asignar empresa" y "Nuevo grupo" sobre ellas.
- **Causa probable:** `fetchAllCompaniesWithRelations` (`modules/company/features/list/actions.server.ts`) no filtra por dueño ni por accesos
  compartidos, y es una server action invocable por cualquier sesión; `listAllCompaniesForGrouping`/`listCompanyGroups` igual.
- **Riesgo para la suite:** los tests no hacen clic en ninguna tarjeta ni en el selector de empresa (cambiaría la cookie `actualComp`).
- **Evidencia:** `tests/e2e/app/company/empresas.spec.ts` > `el listado solo muestra las compañías del usuario` (fixme).

### H-04 La foto del empleado se guarda con una URL que da 404 — corregido en código

- **Pasos:** alta de empleado con "Subir foto" > abrir el detalle.
- **Esperado:** el avatar muestra la foto.
- **Obtenido:** la subida a `/api/storage` responde 200 y el archivo queda en el bucket, pero `employees.picture` se guarda como
  `<URL de la app>/employee_photos/<dni>.png?timestamp=...` (armada con `NEXT_PUBLIC_PROJECT_URL`), que devuelve 404. El avatar queda con el spinner.
- **Corrección:** `useEmployeeForm.ts` arma la URL con `storage.getPublicUrl('employee_photos', ...)` (usa `NEXT_PUBLIC_STORAGE_PUBLIC_URL`).
  Falta confirmar en el clon que el bucket `employee-photos` sea de lectura pública.
- **Evidencia:** `alta.spec.ts` > `el detalle muestra la foto del empleado` (fixme). El test de subida (`el alta con foto sube la imagen al storage...`)
  sí pasa: verifica el objeto descargando `/api/storage?bucket=employee_photos&path=<dni>.png`.

### H-05 Crear sindicato/convenio tras recargar la página falla — corregido en código

- **Pasos:** abrir `/dashboard/company/actualCompany?tab=covenant` directamente (o recargar con F5 en esa pestaña) > "Nuevo sindicato" > nombre > "Crear sindicato".
- **Esperado:** "Sindicato creado exitosamente".
- **Obtenido:** "Ocurrio un error al crear el sindicato". Si se entra por la pestaña General y se hace clic en "Convenios" funciona.
- **Causa:** `AddGuildModal`/`AddCovenantModal` toman la empresa activa del store en el valor por defecto del formulario; tras una recarga el store se
  hidrata después del primer render y `company_id` queda vacío.
- **Corrección:** ambos componentes leen la empresa activa al momento de enviar (`useLoggedUserStore.getState()`).
- **Evidencia:** `convenios.spec.ts` > `crear un sindicato tras recargar la pestaña (?tab=covenant)` (fixme). El helper `ensureCovenantTree`
  entra "por dentro" (clic en la pestaña) para esquivarlo.

### H-06 El enlace "Registrar Contacto" da 404 — corregido en código

- **Pasos:** `/dashboard/company/actualCompany?tab=contacts` > "Registrar Contacto".
- **Obtenido:** "Pagina no encontrada" (`/dashboard/company/contact/action?action=new`, ruta inexistente).
- **Corrección:** `app/dashboard/company/actualCompany/page.tsx`: el enlace apunta a `/dashboard/company/actualCompany/contact/action?action=new`.
- **Evidencia:** `contactos.spec.ts` > `"Registrar Contacto" abre el formulario de alta` (fixme).

### H-07 El formulario de contacto se rompe al abrirse — corregido en código

- **Pasos:** `/dashboard/company/actualCompany/contact/action?action=new`.
- **Obtenido:** "Error al cargar el panel / No se pudo cargar la seccion". Consola: `TypeError: R?.find is not a function`.
- **Causa:** `fetchCustomersByCompany` devuelve `{ data, error }` y `ContactComponent` lo usa como si fuera el arreglo de clientes (`clientData?.find`).
  Igual en `RegisterWithRole` (lista de clientes al crear un invitado).
- **Corrección:** ambos desestructuran `{ data }` y usan `data ?? []`.
- **Evidencia:** `contactos.spec.ts` > `alta, edición, baja y reintegro de un contacto...` y `el formulario de contacto valida...` (fixme).
  Quedan sin ejercitar contra el clon la edición y baja de contactos.

### H-08 La edición del legajo actualiza por DNI sin filtrar por empresa — abierto (seguridad, por lectura de código)

- `updateEmployeeByDocNumber` y `updateEmployeeByDocNumberFull` (`modules/employees/features/create/actions.server.ts`) usan
  `updateMany({ where: { document_number } })` sin `company_id`. Un empleado de otra empresa con el mismo DNI se modificaría junto con el propio
  (la baja y el reintegro, en cambio, sí filtran por empresa).
- No se reprodujo (sería escribir en datos ajenos). **Contorno en los tests:** los DNI de prueba están en el rango 99.xxx.xxx, que no existe en la vida real.
- Sin test: no se puede probar sin crear otra empresa con un empleado homónimo (queda como ➖ en el inventario).

### H-09 Crear un tipo de documento obligatorio falla en la base — corregido en la base del clon

- **Pasos:** Empleados > Tipos de documentos > "Crear nuevo" > nombre + tilde "Obligatorio" > "Crear".
- **Esperado:** "Tipo de documento creado".
- **Obtenido:** toast de error `schema "auth" does not exist`. Sin el tilde "Obligatorio" el alta funciona.
- **Causa probable:** un trigger/función de la base (copia de Supabase) todavía referencia el esquema `auth` (por ejemplo `auth.uid()`) al generar
  los documentos pendientes de un tipo obligatorio. No se pudo mirar la base desde acá.
- **Corrección:** `controlar_alertas_documentos` y `log_repair_changes` usaban `auth.jwt()`/`auth.uid()`; script `prisma/cutover/04-fix-auth-references.sql`, aplicado en el clon.
- **Evidencia:** `documentos-legajo.spec.ts` > `crear un tipo de documento obligatorio` (ya habilitado y verde). Quedan sin probar las alertas de documentos pendientes tras el alta.

### H-10 Las novedades creadas no aparecen en la tabla de "Tipos de Novedades" — abierto

- **Pasos:** Empleados > Diagramas > Tipos de Novedades > "Limpiar formulario" > nombre, descripción corta, color > "Cargar novedad".
- **Esperado:** la novedad queda en la tabla "Lista de novedades de diagrama".
- **Obtenido:** toast "Novedad ... cargada con éxito" (la API responde 201 y la novedad aparece como opción de "Tipo de diagrama"), pero la tabla de esa pestaña
  queda siempre vacía, incluso recargando. Tampoco hay forma de borrar o desactivar una novedad desde la pantalla.
- **Evidencia:** verificado a mano; los tests comprueban la novedad por el selector "Tipo de diagrama" (`diagramas.spec.ts`).
  Sin `fixme` propio porque el test correcto depende de la causa (la tabla recibe `diagrams_types` por props y no se llegó a ver de dónde).

### H-11 La grilla "Diagrama Cargados" nunca muestra filas — abierto

- **Pasos:** cargar un diagrama a un empleado (por su detalle > Diagramas > Nuevo Diagrama) > Empleados > Diagramas > Diagrama Cargados > elegir al empleado.
- **Esperado:** una fila con el empleado y la sigla de la novedad en los días cargados.
- **Obtenido:** el selector dice "1 empleados seleccionados" y la grilla queda sin filas (el cartel "Selecciona al menos 1 recurso" no desaparece).
- **Causa probable:** `DiagramEmployeeView` agrupa con `emp.id === diagram.employee_id` pero `employee_id` llega como objeto (otros componentes usan
  `diagram.employee_id?.id`): consecuencia del cambio de forma de los datos al migrar a Prisma.
- **Evidencia:** `diagramas.spec.ts` > `la grilla de diagramas de personal muestra la novedad del empleado en sus días` (fixme). La carga y el listado
  desde el detalle del empleado sí funcionan y tienen test.

### H-12 El rango de fechas de la grilla de diagramas se rotula con años de cinco dígitos — abierto (cosmético)

- Empleados > Diagramas: el botón del rango muestra `28/10/02026 - 27/11/02026` (formato de fecha con `yyyyy` o relleno de ceros).
- **Evidencia:** `diagramas.spec.ts` > `el rango de fechas de la grilla se muestra con años de cuatro dígitos` (fixme).

## Observaciones (no son bugs confirmados; condicionan cómo se escriben los tests)

- **Clics anteriores a la hidratación se pierden en silencio** y varias pantallas se "resetean" al terminar de cargar su estado: el listado de empleados
  vuelve a la pestaña "activos" y recompone la barra (cierra popovers), el detalle de empresa vuelve a General, y una navegación recién hecha a veces
  rebota. Los helpers (`tests/e2e/helpers/*.ts`) reintentan las secuencias idempotentes con `expect(...).toPass()` y `hydrated()`.
- **Toasts duplicados:** hay dos `<Toaster/>` montados en las pantallas con formulario propio (el del layout y el del formulario), por eso
  `getByText(toast)` resuelve a dos elementos en algunas pantallas (los tests usan `.first()`).
- **"Eliminar Empresa" (Zona peligrosa) no tiene acción:** el botón "Eliminar" del diálogo (`DangerZoneComponent`) solo cierra el diálogo y no valida el
  nombre escrito. Los tests solo abren el diálogo y lo cierran con "Cerrar".
- **La empresa QA no se puede guardar desde "Editar Compañía":** el CUIT del seed (30999999990) no pasa la validación del dígito verificador y la empresa
  no tiene provincia cargada. El test de edición solo verifica que el formulario advierta ("El CUIT es inválido") y no envía nada.
- **Pantalla Tipos de Novedades:** abre en modo "Editar Novedad" (botones "Editar Novedad" y "Limpiar formulario") con el formulario vacío;
  hay que pulsar "Limpiar formulario" para llegar a "Cargar novedad".
- **Guardar en la edición del legajo a veces no hace nada:** en ~40% de las corridas completas (carga alta), un tercer guardado consecutivo sobre el mismo
  empleado no mostraba ningún cartel ni error, ni recargando la pantalla (nunca en corridas aisladas). No se identificó la causa; el test que lo
  detectaba se fusionó con el guardado anterior, que es estable. Merece investigarse (sospecha: catálogos de provincias/ciudades sin cargar).
- Los clientes dados de baja se acumulan en "Ver dados de baja" (paginado): los tests filtran por su nombre único.
- El filtro de apellido del listado de empleados queda en la URL (`?lastname=`), por lo que "Volver" regresa a `/dashboard/employee?lastname=...`.

## Datos que los tests dejan en la empresa QA E2E

La app no permite borrar estos elementos desde la UI; todos llevan el prefijo `QA-E2E-`.

- Empleados de prueba: quedan **dados de baja** (motivo "Renuncia"), con DNI 99.xxx.xxx.
- Clientes de prueba: quedan **dados de baja** (sus contactos también).
- Jerarquía fija de convenios: `QA-E2E-Sindicato` > `QA-E2E-Convenio` > `QA-E2E-Categoria` (se reutiliza, no se duplica).
- Tipos de documento `QA-E2E-Doc-*`: el del flujo de carga queda **desactivado** (con un documento adjunto la app no permite eliminarlo); los de
  prueba sin documentos se eliminan en el mismo test. `QA-E2E-Doc-explore` (de la exploración inicial) también quedó desactivado.
- Novedades de diagrama: `QA-E2E-Novedad` (fija, se reutiliza) y `QA-E2E-Nov-explore` (de la exploración); la pantalla no permite borrarlas. Los diagramas
  creados quedan asociados a empleados dados de baja.
- Documentos cargados a empleados de prueba (en RustFS, bucket de documentos) quedan con ellos.
- Durante la exploración inicial se crearon y se dieron de baja a mano ~20 empleados `QA-E2E-*` huérfanos; esa limpieza puntual pudo alcanzar también
  empleados `QA-E2E-*` de otras tandas de tests que corrieran en ese momento.

## Riesgos conocidos de la suite

- **Preparación compartida:** `detalle-edicion.spec.ts` y `convenios.spec.ts` llaman a `ensureCovenantTree` desde workers distintos. En un clon recién
  sembrado (sin la jerarquía) podrían crearla dos veces y romper los selectores estrictos. Hoy la jerarquía ya existe.
- **Carga del servidor:** con varios workers (y otras suites corriendo contra el mismo clon) algunas pantallas vuelven a montar sus formularios; los
  helpers reintentan lo idempotente. Un fallo que aparezca solo bajo carga se reporta, no se tapa subiendo timeouts.
