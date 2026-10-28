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

> **Decisión:** igual que producción (el código es idéntico en `origin/dev`) — no se cambia en esta rama. Arreglarlo cambiaría el comportamiento que hoy tiene producción; queda para decidir aparte.

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

> **Decisión:** igual que producción — no se cambia en esta rama.

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

## Módulos Equipos y Documentos

Criterio: se corrige solo lo que impide una funcionalidad, con un arreglo chico que no cambia el comportamiento de producción. En todos los casos de
abajo el código es **idéntico en `origin/dev`** (se comparó con `git show origin/dev:<archivo>`): son restos del cambio de Supabase a Prisma/RustFS.

### H-13 La foto del equipo se guarda con una URL que da 404 — corregido en código

- **Pasos:** alta de equipo con "Subir foto" > abrir el detalle del equipo.
- **Esperado:** el avatar muestra la foto.
- **Obtenido:** la subida a `/api/storage` responde 200 y el objeto queda en `vehicle-photos` (se sirve bien en `<STORAGE_PUBLIC_URL>/vehicle-photos/<id>.png`),
  pero `vehicles.picture` se guarda como `<URL de la app>/vehicle_photos/<id>.png` (armada con `NEXT_PUBLIC_PROJECT_URL`), que devuelve 404. Es el mismo
  defecto que H-04, en el formulario de equipos.
- **Corrección:** `useVehicleForm.ts` arma la URL con `storage.getPublicUrl('vehicle_photos', ...)` (alta y edición). Falta deploy.
- **Evidencia:** `equipment/equipos.spec.ts` > `el detalle del equipo muestra la foto cargada` (fixme). Los tests de bucket y de URL firmada sí pasan.

### H-14 Editar un equipo sin dominio no guarda y la app avisa "equipo editado" — corregido en código

- **Pasos:** alta de un equipo de tipo "Otros" (sin dominio) > detalle > "Habilitar edicion" > cambiar el motor > "Guardar cambios".
- **Esperado:** el cambio persiste.
- **Obtenido:** aparece el aviso "equipo editado" pero nada se guarda. El formulario envía `domain: ''` (el alta guarda `null`) y choca con la restricción UNIQUE
  de `vehicles.domain` porque ya existe otro equipo con `''` (log del servidor: `P2002 Unique constraint failed on the fields: (domain)`). El error solo se
  escribe en consola: la pantalla muestra éxito.
- **Corrección:** `domain: values.domain?.toUpperCase() || null` en `onUpdate`. **Sigue pendiente** (cambiaría el flujo): propagar `updatedERROR` en vez de ignorarlo.
- **Evidencia:** `equipment/equipos.spec.ts` > `se puede editar el equipo y los cambios persisten` (fixme).

### H-15 La URL del QR del equipo queda mal armada — corregido en código

- **Pasos:** detalle del equipo > pestaña QR > "Copiar url".
- **Esperado:** `https://<app>/maintenance?equipment=<id>`.
- **Obtenido:** `https://<app>maintenance?equipment=<id>` (sin "/"): `NEXT_PUBLIC_BASE_URL` no lleva barra final y el código no la agrega. Los QR impresos con
  esa URL no abren la pantalla de mantenimiento.
- **Corrección:** `useVehicleForm.ts` quita barras finales y agrega "/". Con la variable con barra final también sirve.
- **Evidencia:** `equipment/equipos.spec.ts` > `el QR apunta a la pantalla pública de mantenimiento del equipo` (fixme).

### H-16 "Descargar" del listado de documentos de equipos da 404 — corregido en código

- **Pasos:** Documentos > Documentos de equipos > menú de una fila con documento cargado > "Descargar".
- **Esperado:** se baja el archivo.
- **Obtenido:** no pasa nada (toast vacío). El menú llama a `/api/storage?bucket=document_files&path=undefined`: `formatVehiculesDocuments` no incluye `document_url`
  (el de empleados sí). La descarga desde el detalle del documento funciona.
- **Corrección:** `src/shared/lib/utils.ts` agrega `document_url: doc.document_path`. Falta deploy.
- **Evidencia:** `documents/equipos.spec.ts` > `se descarga desde el listado el mismo archivo que se subió` (fixme).

### H-17 Detalles visuales de equipos y documentos — abierto (cosmético, igual que dev, no se cambia)

- Los equipos sin dominio aparecen como `null` en la columna "Equipo (Dominio)" de los documentos y en "Copiar dominio" (`resource: \`${veh?.domain}\``).
- El encabezado del detalle del equipo muestra "Tipo de equipo:" vacío (usa `vehicle.type?.name` y `type` ya es el nombre).
- El diálogo "Reemplazar documento" muestra la fecha de vencimiento como ISO crudo (`2027-10-15T03:00:00+00:00`), y el detalle del documento muestra el vencimiento un día
  antes que el listado. Reemplazar obliga a elegir de nuevo la fecha (el valor previo no pasa la validación): es el comportamiento actual.
- En 1280 px el visor de PDF del detalle del documento tapa parte de la pestaña "Actualizar" (por eso esos tests usan una ventana de 1600 px).

## Módulos Mantenimiento y Operaciones

Mismo criterio que arriba. Se corrigió solo lo que es un resto de la migración (H-18, H-26); el resto es código **idéntico en `origin/dev`** y queda como
"igual que producción — no se cambia" (con `test.fixme` en el spec). La función de base `log_repair_changes` ya no falla: crear, editar y cambiar de estado una
solicitud escribe sus eventos sin errores de `auth`.

### H-18 La foto de la solicitud de reparación nunca llega al bucket `repair-images` — corregido en código

- **Pasos:** Mantenimiento > Solicitud de mantenimiento > elegir equipo y tipo > cargar una foto en la tarjeta 1 > "Agregar reparacion" > "Registrar solicitudes".
- **Esperado:** la solicitud queda creada y la foto se guarda en `repair-images` (y se ve en el detalle).
- **Obtenido:** la solicitud se crea y `user_images` guarda la ruta, pero la foto no se sube: `/api/storage` responde **400** ("Parámetros inválidos") porque la ruta
  empieza con "/" (`/<dominio>/<tipo>-(<fecha>)/user-image/0`) y `isSafePath` rechaza las rutas con barra inicial. El error se pierde (la subida corre en un `forEach(async)` sin
  `await`) y la URL pública da 404. Lo mismo pasa con las imágenes que adjunta el mecánico al finalizar (`/<dominio>/.../mechanic-images/0`). Supabase Storage
  ignoraba las barras iniciales.
- **Corrección:** `src/shared/lib/storage/handlers.server.ts` quita las barras iniciales de `path`/`paths` antes de validar (GET, upload, remove, list y signed-url). Falta deploy.
- **Evidencia:** `maintenance/solicitudes.spec.ts` > `al crear la solicitud, la foto queda en repair-images...` y `al finalizar la solicitud, la imagen del mecánico...` (fixme).
  Los tests que suben la imagen por la API en la ruta guardada (sin barra) sí pasan: bucket, URL pública 200 `image/png`, mismo contenido y carga en el detalle.

### H-19 Un equipo sin kilometraje (tipo "Otros") no puede tener solicitudes de reparación — abierto (igual que producción, no se cambia)

- **Pasos:** equipo de tipo "Otros" (guarda `kilometer = null`) > Mantenimiento > Solicitud de mantenimiento > equipo, tipo, descripción > "Agregar reparacion".
- **Esperado:** la reparación se agrega a la lista.
- **Obtenido:** no pasa nada y no hay aviso. El campo "Kilometraje" está oculto para equipos que no son vehículos, pero valida: al elegir el equipo se carga `null` y el
  esquema falla con "Expected string, received null" (mensaje en un campo oculto). Con un vehículo con kilometraje funciona.
- **Evidencia:** `maintenance/solicitudes.spec.ts` > `se puede agregar una solicitud para un equipo "Otros" sin kilometraje` (fixme). Los demás tests usan un vehículo con kilometraje.

### H-20 En "Cargar Items" el selector de servicio queda vacío — abierto (igual que producción, no se cambia)

- **Pasos:** Empresa > Servicios > Cargar Items > elegir cliente > abrir "Servicio".
- **Esperado:** los servicios del cliente.
- **Obtenido:** lista vacía, no se puede crear un ítem. `ServiceItemsForm` lee `responseData.services` pero la API responde `{ success, data: { services } }`.
- **Evidencia:** `maintenance/servicios.spec.ts` > `alta de un ítem del servicio por el formulario...` (fixme). El ítem de prueba se crea por la API (`POST /api/services/items`).

### H-21 Editar un ítem de servicio devuelve 500 — abierto (igual que producción, no se cambia)

- **Pasos:** Cargar Items > "Editar" de un ítem > cambiar la descripción > "Editar".
- **Obtenido:** `PUT /api/services/items` responde 500 ("Failed to update service item") y la pantalla no muestra el aviso de éxito. El formulario manda la unidad de medida como texto
  (`"1"`) y Prisma espera un entero (con el número, la API responde 200).
- **Evidencia:** `maintenance/servicios.spec.ts` > `se puede editar la descripción del ítem` (fixme). Dar de baja el ítem sí funciona.

### H-22 El listado de partes diarios muestra la fecha un día antes — abierto (igual que producción, no se cambia)

- **Pasos:** Operaciones > "Crear Parte Diario" > elegir una fecha > mirar el listado y el encabezado "Fecha:" del parte.
- **Obtenido:** se ve el día anterior (el parte del 12/11 aparece como 11/11): la fecha `yyyy-MM-dd` se interpreta como medianoche UTC y se pinta en hora local (Argentina, UTC-3).
  El filtro de fechas del listado usa la misma lectura.
- **Evidencia:** `operations/partes-diarios.spec.ts` > `el parte diario se lista con la fecha que se eligió al crearlo` (fixme). Los demás tests buscan el parte por la fecha tal como se muestra (`listedDate`).

### H-23 Al agregar o editar una fila del parte diario la pantalla falla aunque se guarda — abierto (igual que producción, no se cambia)

- **Pasos:** abrir un parte ("Ver Completo") > "Agregar Fila" > completar > "Agregar Fila" (y luego editar la fila y "Guardar Cambios").
- **Esperado:** aviso "Fila agregada correctamente al parte diario." y la fila en la tabla.
- **Obtenido:** la fila se guarda (POST/PUT 200) pero la pantalla no la muestra ni avisa hasta reabrir el parte: las APIs responden `{ data: { data: [fila] } }` y el código lee
  `data[0].id` (alta) o `.map` (edición), lo que falla (en consola: `Cannot read properties of undefined`). El alta de empleados y equipos de la fila (que sigue a ese paso) tampoco corre.
  Lo mismo ocurre con el parte recién creado: su diálogo se abre sin id (`newDailyReport[0]` es `undefined`), y el aviso "Ya existe un parte diario para esta fecha" nunca aparece
  (lee `exists` sin el sobre `data`), por lo que se pueden crear partes duplicados para una fecha.
- **Evidencia:** `operations/partes-diarios.spec.ts` > `al agregar una fila se muestra en la tabla y avisa que se agregó` (fixme). Los tests reabren el parte para comprobar lo guardado.

### H-24 La jornada elegida al agregar la fila no se guarda — abierto (igual que producción, no se cambia)

- El POST de la fila no incluye `working_day`: la fila queda sin jornada y al editarla "Jornada" vuelve a ser obligatoria. El test la elige de nuevo antes de guardar.

### H-25 La carpeta del documento del parte diario se llama "true" — abierto (igual que producción, no se cambia)

- **Obtenido:** los documentos se guardan en `daily-reports` como `true/<cliente>/<servicio>/<ítem>/<dd-mm-aaaa>-<remito>.<ext>` en vez de `<empresa>/...`: `DailyReport.tsx` llama a
  `dailyColumns(..., canEdit, customers, services, items, companyName)` y la función espera `(..., companyName, customers, services, items, canEdit)`. Además `canEdit`
  (la regla de 6 días) queda siempre verdadero.
- **Evidencia:** `operations/partes-diarios.spec.ts` > `el documento se guarda en la carpeta con el nombre de la empresa` (fixme). El test de bucket acepta cualquier carpeta inicial.

### H-26 "Descargar" del visor del documento del parte diario no baja nada — corregido en código

- **Pasos:** Operaciones > parte > fila con documento > "Ver Documento" > "Descargar".
- **Obtenido:** no pasa nada. El botón hace `fetch(<URL pública de RustFS>)` desde el navegador y el storage **no envía cabeceras CORS** (con Supabase sí): el navegador lo bloquea
  (`Failed to fetch`). La URL pública directa (enlaces, visor) sí funciona. Si hay otras pantallas que hagan `fetch` a la URL pública, fallan igual; la causa de fondo es la configuración
  CORS de RustFS (infraestructura).
- **Corrección:** `DocumentView.tsx` baja el archivo por `/api/storage` (mismo origen) con `storage.download('daily_reports', row.document_path)`. Falta deploy.
- **Evidencia:** `operations/partes-diarios.spec.ts` > `"Descargar" baja el mismo archivo que se subió` (fixme).

## Módulos HSE y Formularios

Mismo criterio: todo lo que sigue es código **idéntico en `origin/dev`** (lo de `modules/hse` y `modules/forms` salvo las actions migradas a Prisma), así que queda como
"igual que producción — no se cambia" con `test.fixme`, salvo H-27 (cosmético, arreglo de una línea que no cambia el comportamiento). Los archivos de HSE sí funcionan por
`/api/storage`: subir (documento y material), servirlos por su URL pública con el mismo contenido y descargar desde la tarjeta del listado.

### H-27 El diálogo "Editar Documento" no entra en una pantalla de 720 px de alto — corregido en código

- **Pasos:** HSE > Documentos > Borradores > "Editar" en una pantalla de 1280x720.
- **Obtenido:** con el archivo actual el diálogo es más alto que la pantalla y no se desplaza: "Guardar Cambios" queda fuera de la vista y no se puede pulsar.
- **Corrección:** `Document-upload-dialog.tsx`: `max-h-[90vh] overflow-y-auto` en el `DialogContent` (solo estilo). Falta deploy y verlo en pantalla.
- **Evidencia:** `hse/documentos.spec.ts` > `el diálogo de edición se puede usar en una pantalla de 720 px de alto (H-27)` (fixme); el test de edición usa una pantalla de 1000 px.

### H-28 Editar un documento HSE sin tocar el archivo lo reemplaza por uno vacío — abierto (igual que producción, no se cambia)

- **Pasos:** HSE > Documentos > un borrador > "Editar" > cambiar título o descripción > "Guardar Cambios" (sin elegir archivo).
- **Obtenido:** al abrir el diálogo en modo edición se arma un `File` vacío con el nombre y el tamaño del original (`Document-upload-dialog.tsx`, efecto de `initialData`) y el envío lo toma
  como archivo nuevo (`size > 0` por el tamaño falseado): sube un objeto de **0 bytes** a `documents/<ts>.pdf`, el documento pasa a apuntar a él y el archivo original queda huérfano en el bucket.
  Medido en el clon: el objeto nuevo responde 200 con 0 bytes. Producción tiene el mismo código y la misma ruta `documents/`.
- **Arreglo sugerido (chico):** no cargar ese `File` falso en el formulario y tratar como archivo nuevo solo el que elige la persona. No se aplicó porque cambia lo que pasa hoy en producción.
- **Evidencia:** `hse/documentos.spec.ts` > `editar un documento sin cambiar el archivo conserva su contenido (H-28)` (fixme). El test de edición pasa (título y descripción cambian) y la limpieza borra el original y el vacío.

### H-29 "Descargar" del detalle del documento HSE (pestaña Versiones) no baja nada — abierto (igual que producción, no se cambia)

- **Pasos:** HSE > Documentos > "Ver Detalle" > Versiones > "Descargar" (versión actual o anterior).
- **Obtenido:** `DocumentDetail.tsx` arma un enlace `<a download>` con la ruta del archivo (`<empresa>/<ts>.pdf`) en vez de bajarlo por `/api/storage`: el navegador pide
  `/dashboard/hse/document/<id>/<empresa>/<ts>.pdf` y la descarga se cancela. La tarjeta del listado sí descarga bien (usa `storage.download`). En producción `file_path` también es una ruta.
- **Arreglo sugerido (chico):** usar `storage.download('documents-hse', path)` como el listado.
- **Evidencia:** `hse/documentos.spec.ts` > `versiones: Descargar en el detalle entrega el archivo de la versión actual (H-29)` (fixme).

### H-30 Guardar la lista de materiales de una capacitación borra del bucket los archivos de los materiales anteriores — abierto (igual que producción, no se cambia)

- **Pasos:** capacitación > Materiales > agregar un material y guardar > agregar otro y guardar.
- **Obtenido:** `updateTrainingMaterials` borra de `training-materials` los archivos de **todos** los materiales que ya existían (también los que no se reemplazan) y vuelve a insertar sus filas con
  la misma URL: el material 1 queda con su fila pero el objeto ya no está (404 en su URL pública y en "Ver Material"). Medido en el clon.
- **Evidencia:** `hse/capacitaciones.spec.ts` > `guardar un material nuevo conserva el archivo de los materiales anteriores (H-30)` (fixme).

### H-31 Eliminar una capacitación no borra sus materiales del bucket — abierto (igual que producción, no se cambia)

- **Pasos:** capacitación en borrador con materiales > "Eliminar".
- **Obtenido:** `deleteTraining` llama a `storageServer.remove('documents', <URLs completas>)`: bucket equivocado y URLs en vez de rutas. Los objetos de `training-materials` quedan huérfanos. Medido en el clon.
- **Evidencia:** `hse/capacitaciones.spec.ts` > `eliminar la capacitación borra sus materiales del bucket training-materials (H-31)` (fixme). El test limpia los objetos por la API de storage.

### H-32 El flujo de formularios no se puede certificar: sin alta por pantalla y sin datos en la empresa QA E2E — abierto (sin test del flujo)

- Los formularios son tipos de checklist (`custom_form`, la columna `form` es un **objeto**: "Transporte SP-ANAY - CHK - HYS - 01/03/04" y "CHK - HYS - 01/03/04" en las empresas reales). El alta por pantalla (`NewForm`/`CreatedForm`/`FormDisplay`)
  no tiene ruta (la pestaña "Crear nuevo formulario" está comentada en `app/dashboard/forms/page.tsx`) y la empresa QA E2E no tiene ninguno (`/dashboard/forms` muestra "Sin resultados"),
  así que no hay formulario que completar, ver ni eliminar. Tampoco hay acción de eliminar. Para certificarlo hace falta que `scripts/e2e/seed-qa.sql` copie un tipo de checklist a la empresa QA.
- **`form.find is not a function`:** viene de `FormCardContainer.tsx:91` (`curr.form.find(...)`, pensado para una columna `form` en forma de arreglo): con una empresa que tiene tipos de checklist y la
  columna como objeto lanza ese error en `/dashboard/forms/new`. Código idéntico a `origin/dev`. No se reprodujo con la empresa QA (sin formularios) en `/dashboard/forms/new`, `/dashboard/help` ni `/dashboard/hse`
  (el log del servidor no registró el error en esas visitas), y no afecta a las pantallas de checklist (`/dashboard/forms/[id]`), que no usan ese componente.
- **Evidencia:** `hse/formularios.spec.ts` solo verifica que `/dashboard/forms` y `/dashboard/forms/new` cargan.

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

- **Documentos multirecurso (empleados y equipos):** el formulario no muestra ningún aviso: al terminar cierra el diálogo (los tests esperan eso).
- **Tipo "Documento de baja":** el formulario lo fuerza a obligatorio y, al crearlo, genera un pendiente por **todos** los empleados de la empresa (activos e
  inactivos). Los tests lo crean y lo desactivan dentro del mismo test; las filas de "Documentos de baja" están paginadas, por eso se busca por apellido.
- **"Renovar" (detalle de un documento):** el botón existe junto a "Reemplazar" y "Eliminar", pero no se probó.

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

## Datos que los tests de Equipos y Documentos dejan en la empresa QA E2E

- Equipos `QA-E2E-*` (Eq, DocEq, DocMA, DocMB, Vtv): quedan **dados de baja** (motivo "Fundido"). Sus documentos cargados siguen en RustFS (`document-files`) y la foto de
  `QA-E2E-Eq-*` en `vehicle-photos`.
- Tipos de documento `QA-E2E-Doc*`: quedan **desactivados** (con documentos cargados la app no permite eliminarlos). Ninguno queda obligatorio y activo.
- Empleados `QA-E2E-doc*`: quedan dados de baja. Documentos eliminados desde el detalle vuelven a estado pendiente (no desaparecen la fila).
- VTV: el turno agendado queda **cancelado**.
- De la exploración inicial quedaron (también limpios) el equipo `QA-E2E-Nmvs5q7vr` y los tipos `QA-E2E-explore-*`.

## Datos que los tests de Mantenimiento y Operaciones dejan en la empresa QA E2E

- Certificados de torqueo: **uno por corrida** (la app no permite borrarlos); quedan asociados a un vehículo `QA-E2E-Torque-*` dado de baja. Su PDF se genera en el navegador, no se guarda.
- Vehículos `QA-E2E-Rep-*` y `QA-E2E-Torque-*`: quedan dados de baja (motivo "Fundido"). Los tipos de reparación `QA-E2E-Reparacion-*` se **eliminan** al final y la app borra en cascada
  sus solicitudes; las imágenes subidas por los tests a `repair-images` se borran del bucket.
- Servicios `QA-E2E-Servicio*` e ítems `QA-E2E-Item*` y sus clientes `QA-E2E-ClienteSrv-*` / `QA-E2E-ClienteOp-*`: quedan **desactivados / dados de baja**.
- Partes diarios: **uno por corrida** (la app no permite borrarlos); el de prueba queda "cerrado", con una fila `Fila de prueba QA` ejecutada y su documento en `daily-reports`
  (`true/QA-E2E-ClienteOp-*/.../<dd-mm-aaaa>-<remito>.pdf`). Cada corrida usa el primer día libre entre 5 días atrás y 60 días adelante: con ~65 partes acumulados el test avisa que no hay fechas libres.
- El selector de archivos de las solicitudes lo abre un `<input>` creado al hacer clic en la tarjeta: los tests contestan el evento `filechooser` y reintentan el clic hasta ver la vista previa.
- Con una imagen de 1x1 píxel el optimizador de Next (`/_next/image`) devuelve un archivo que el navegador no decodifica (`naturalWidth` 0): las pruebas de "carga en pantalla" usan una imagen real de 48x48 generada en el test (`solidPng`).

## Datos que los tests de HSE y Formularios dejan en la empresa QA E2E

- Tipo de documento HSE `QA-E2E-HSE-Tipo` y capacitador `QA-E2E-Capacitador`: fijos, se crean la primera vez y se reutilizan (la app no permite eliminarlos).
- Documento `QA-E2E-HseVersiones` (**uno solo**): se publica la primera vez y cada corrida le suma una versión (no se puede eliminar un documento vigente); sus archivos (uno por versión) quedan en `documents-hse/<empresa>/`.
  Durante el desarrollo de la suite quedaron además 7 documentos vigentes `QA-E2E-HseVer-*` (uno por corrida de prueba) que la app no deja borrar.
- Capacitación `QA-E2E-CapCiclo` (**una sola**, con el acta completa): cada corrida pasa de Archivado a Publicado y vuelve a Archivado, y queda archivada.
- Los documentos y capacitaciones de prueba en borrador se eliminan (con su archivo, y el original huérfano que deja H-28); los materiales de `training-materials` los borra el test (H-31).
- Los documentos se cargan "a todos los empleados activos" de la empresa QA E2E: solo hay empleados de prueba, no se envía ningún mail.

## Datos que los tests de Compras y Almacenes dejan en la empresa QA E2E

- Proveedor fijo `QA-E2E-Proveedor` (sin email: aprobar una orden no envía mails) y almacenes fijos `QA-E2E-Almacen-A` / `QA-E2E-Almacen-B`: se crean una vez y se reutilizan (H-35).
- Proveedor `QA-E2E-Prov-*` (**uno por corrida**, con cheque y cuenta bancaria) y almacén `QA-E2E-Almacen-*` (**uno por corrida**, con stock transferido): no se pueden dar de baja (H-35). El producto de prueba de cada spec se **desactiva**.
- Orden de compra del flujo de estados: **una por corrida**, queda "Cancelada" (aprobada y cancelada); la del adjunto se elimina. Sus adjuntos en `purchase-orders` los borra el test.
- Facturas de compra: se confirman y se **eliminan**; sus PDF en `purchase-invoices` los borra el test (H-36).
- Remito de recepción: **uno por corrida**, queda "Anulado" (se confirmó y se anuló: el stock vuelve a 0). Orden de retiro: **dos por corrida**, una "Completada" (descontó 3 unidades del almacén A) y una "Cancelada".
- Stock de productos de prueba (desactivados) en los almacenes fijos y movimientos de ajuste/transferencia/retiro/recepción asociados.

## Riesgos conocidos de la suite

- **Preparación compartida:** `detalle-edicion.spec.ts` y `convenios.spec.ts` llaman a `ensureCovenantTree` desde workers distintos. En un clon recién
  sembrado (sin la jerarquía) podrían crearla dos veces y romper los selectores estrictos. Hoy la jerarquía ya existe.
- **Detalle de almacén bajo carga:** con varios workers, a veces la app vuelve sola al listado justo después de abrir el detalle de un almacén (visto 4 veces en ~10 corridas, sin causa clara);
  `openStockDialog` repite el recorrido completo. Los almacenes fijos acumulan un producto por corrida y sus tablas paginan de a 10: los tests filtran por `?search=`.
- **Carga del servidor:** con varios workers (y otras suites corriendo contra el mismo clon) algunas pantallas vuelven a montar sus formularios; los
  helpers reintentan lo idempotente. Un fallo que aparezca solo bajo carga se reporta, no se tapa subiendo timeouts.

### H-33 Eliminar un borrador HSE ya no borra el archivo del bucket — abierto (pendiente de investigar)

- **Pasos:** HSE > Documentos > Borradores > "Eliminar" en un borrador con archivo.
- **Esperado:** el documento sale del listado y el objeto desaparece de `documents-hse`.
- **Obtenido (desde el deploy 24d955fa):** sale del listado, pero el objeto sigue en el bucket. Antes del deploy el test pasaba; no hay errores en el log del servidor.
- **Impacto:** archivos huérfanos en el bucket; el documento se elimina bien. Test en `test.fixme` hasta investigarlo.

### H-34 Las fechas de los listados de remitos de recepción y de órdenes de retiro se ven un día antes — abierto (igual que producción, no se cambia)

- **Pasos:** crear un remito (fecha 2026-10-28) o una orden de retiro con la fecha por defecto y mirar la columna "Fecha recepción" / "Fecha" del listado, con el navegador en hora de Argentina.
- **Obtenido:** muestra 27/10/2026. `columns.tsx` hace `format(new Date(row.original.reception_date), 'dd/MM/yyyy')` (y lo mismo con `request_date`) sobre una fecha guardada a medianoche UTC: en UTC-3 cae el día anterior.
  Las facturas y las órdenes de compra sí usan `formatDateUTC` y se ven bien.
- **Arreglo sugerido (chico):** usar `formatDateUTC` en las dos columnas. Cambia lo que ve el usuario en producción, por eso no se aplica.
- **Evidencia:** visto en el listado durante `purchasing/recepciones.spec.ts`; los tests no comprueban la fecha.

### H-35 La app no permite dar de baja ni eliminar proveedores y almacenes — abierto (igual que producción, no se cambia)

- **Obtenido:** `deleteSupplier` (proveedores) y `toggleWarehouseActive` (almacenes) existen en el código pero ninguna pantalla los usa; el formulario de edición tampoco cambia el estado. Las órdenes de compra aprobadas y los
  remitos y retiros confirmados solo se cancelan/anulan (no se eliminan); solo el borrador se elimina.
- **Impacto:** los datos de prueba no se pueden limpiar por la interfaz. La suite usa un proveedor fijo (`QA-E2E-Proveedor`) y dos almacenes fijos (`QA-E2E-ALM-A`, `QA-E2E-ALM-B`) que se crean una vez y se reutilizan.

### H-36 Eliminar una factura de compra no borra su PDF del bucket — abierto (igual que producción, no se cambia)

- **Pasos:** crear una factura con PDF > "Eliminar" desde el listado (dueño de la empresa).
- **Obtenido:** la factura desaparece pero el objeto sigue en `purchase-invoices` (`deletePurchaseInvoice` no llama a `storageServer.remove`). Medido en el clon. "Quitar" el adjunto desde el detalle sí borra el archivo.
- **Evidencia:** `purchasing/facturas.spec.ts` > `eliminar una factura con adjunto borra también el PDF del bucket (H-36)` (fixme). El test de flujo quita el adjunto antes de eliminar y limpia el bucket.

### H-37 Eliminar una orden de compra con adjuntos no borra sus archivos del bucket — abierto (igual que producción, no se cambia)

- **Pasos:** orden en borrador con un adjunto > "Eliminar" desde el listado.
- **Obtenido:** la orden y sus filas de adjuntos (cascada en la base) se eliminan, pero el objeto sigue en `purchase-orders`. Medido en el clon.
- **Evidencia:** `purchasing/ordenes.spec.ts` > `eliminar una orden con adjunto borra también el archivo del bucket (H-37)` (fixme). Eliminar el adjunto desde el detalle sí lo borra.

> **Nota sobre H-33, H-36 y H-37 (misma causa probable):** al eliminar un documento HSE, una factura o una OC con archivo, la acción llama a `storageServer.remove(...)` sin error en el log, pero el objeto sigue en el bucket. Se probó borrar objeto por objeto (`DeleteObjectCommand`) en vez de `DeleteObjects` y no cambió el resultado. El borrado desde el cliente (`/api/storage`, op `remove`) sí funciona. Pendiente de investigar (posible diferencia de clave entre lo guardado en la base y el objeto). Impacto: archivos huérfanos, no pérdida de datos.

### H-38 Las facturas y los recibos de venta no tienen botón para ver o descargar su PDF — abierto (igual que producción, no se cambia)

- **Obtenido:** las rutas `GET /api/sales/invoices/:id/pdf` y `GET /api/sales/receipts/:id/pdf` generan el PDF correctamente (200, `application/pdf`), pero ninguna pantalla de Ventas (listado, detalle de factura, detalle del recibo) enlaza a ellas. En Tesorería la orden de pago ("Descargar PDF") y el certificado de retención sí tienen enlace.
- **Evidencia:** `git show origin/dev:` de `SalesInvoiceDetail.tsx` y `ReceiptDetailModal.tsx` no referencia `/api/sales`. `sales/facturas.spec.ts` y `sales/recibos.spec.ts` prueban el PDF pidiendo la ruta directamente. Los PDF no se guardan en ningún bucket (se generan al pedirlos).

### H-39 En el listado de facturas, el menú de la fila queda abierto después de anular desde el diálogo — abierto (igual que producción, no se cambia)

- **Pasos:** menú "..." de una factura confirmada > "Anular" > "Anular" en el diálogo.
- **Obtenido:** la factura se anula ("Factura anulada") pero el menú de la fila reaparece abierto y, mientras está abierto, oculta el resto de la tabla (la fila deja de ser accesible). Es cosmético; el test recarga el listado para verificar el estado.

## Costos, configuración, notificaciones, ayuda y admin

### H-40 "Eliminar firma" (Configuración > PDF) no borra el archivo del bucket — abierto (igual que producción, no se cambia)

- **Pasos:** Configuración > PDF > subir una firma PNG > "Eliminar firma".
- **Obtenido:** la firma desaparece de la pantalla (`pdf_settings.signature_image_url` queda en null), pero el objeto `pdf-signatures/<empresa>.png` sigue en el bucket público `logo` y su URL sigue respondiendo 200. `removeSignatureImage` solo toca la base. Medido en el clon.
- **Evidencia:** `settings/pdf.spec.ts` (fixme "eliminar la firma borra también el objeto del bucket"); el `afterAll` del spec borra el objeto por la API de storage. Misma causa de fondo que H-33/H-36/H-37 (archivos huérfanos).

### H-41 En Costos > Configuración CCT, un concepto desactivado desaparece y no se puede reactivar — abierto (igual que producción, no se cambia)

- **Pasos:** pestaña Conceptos de un convenio > desactivar un concepto (ícono del ojo) > activar el filtro "Inactivos".
- **Obtenido:** `listarCCTs` trae solo `conceptos` con `is_active: true`, así que "Inactivos" nunca muestra nada y el concepto no se puede volver a activar desde la pantalla (solo por base). Además los conceptos del convenio no se pueden borrar.
- **Arreglo sugerido (chico):** quitar el filtro `where: { is_active: true }` del `include` de `listarCCTs` (la pantalla ya filtra por activo). No se aplica porque cambia lo que ve el usuario en producción.
- **Evidencia:** `costos/servicio-composicion.spec.ts` (fixme H-41). Por esto la suite crea un concepto nuevo por corrida y lo deja desactivado (invisible en la pantalla).

### H-42 Topes imponibles: tabla global y `crearTope`/`actualizarTope` sin control de permisos — abierto (igual que producción, no se cambia)

- **Obtenido:** `tope_imponible` no tiene `company_id` y las acciones `crearTope` y `actualizarTope` no validan rol ni permiso: cualquier usuario autenticado de cualquier empresa puede crear un tope desde `/dashboard/costos/topes-imponibles` (el texto de la pantalla dice "solo administradores del sistema pueden modificar"). El valor entra en los cálculos de todas las empresas. La pantalla no ofrece editar ni borrar.
- **Por qué no se prueba el alta:** un tope creado por la prueba sería global y no se puede borrar. `costos/pantallas.spec.ts` solo comprueba que la pantalla y el diálogo abren.

### H-43 Costos: no hay pantalla para borrar servicios, composiciones, fórmulas, el costo de un tipo ni el de un equipo — abierto (igual que producción, no se cambia)

- **Obtenido:** existen `deleteServicio` y `eliminarCostoTipoEquipo` pero ninguna pantalla los usa; no hay acción de borrado para composiciones ni fórmulas (la fórmula polinómica de un servicio solo se crea una vez y se edita); un CCT, sus conceptos y el costo de un equipo tampoco se borran. Mismo patrón que H-35.
- **Impacto en la suite:** hay datos fijos que quedan en la empresa QA (ver "Datos que quedan"): CCT, categoría, servicio con su composición, fórmula y costo del tipo "Tractor". El PDF de la composición se sobrescribe en la misma ruta (upsert).

### H-44 El layout de `/admin` no valida el rol: un usuario cliente entra al panel de plataforma — abierto (igual que producción, no se cambia)

- **Pasos:** con el usuario QA (rol `CodeControlClient`) abrir `/admin/panel` y `/admin/tablas`.
- **Obtenido:** ambas cargan sin redirigir (el panel con datos de ejemplo y el botón "Crear Usuario"; tablas con los catálogos globales de industria, puesto, etc. y menús de acción). El layout solo lee al usuario y no comprueba el rol. Sin sesión, las rutas devuelven 500 (`prisma.profile.findMany` con id vacío) en vez de redirigir al login.
- **Impacto:** exposición de pantallas (y acciones de escritura sobre catálogos globales, como `CreateDialog`) a clientes. No se probó ninguna escritura.
- **Evidencia:** `admin/admin.spec.ts` (fixme "un usuario cliente no puede entrar al panel de administración").

### H-45 El auditor (`/admin/auditor`) lista documentos de todas las empresas y la tabla se rompe — abierto (igual que producción, no se cambia)

- **Obtenido:** `fetchPresentedDocumentsForAuditor` trae los documentos "presentado" sin filtrar por empresa (886 de equipos y 2.139 de empleados en el clon, copia de producción). En el cliente, `AuditorPage` ya formatea la fecha como `dd/MM/yyyy` y la columna `date` la vuelve a pasar por `new Date(...)`: con un día mayor a 12 lanza `RangeError: Invalid time value` y la pantalla cae en "Error en administracion". Se ve con cualquier usuario que llegue a esa ruta (H-44).
- **Arreglo sugerido (chico):** no volver a parsear el valor ya formateado en `AuditorColumns` (o guardar la fecha ISO y formatear una sola vez). Se corrige un error en producción, por eso no se aplica.
- **Evidencia:** `admin/admin.spec.ts` (fixme "el auditor muestra la tabla…" y un test que documenta la pantalla de error actual).

### H-46 Ayuda: crear un ticket depende del servicio externo TASKAPP, no configurado en el clon — nota

- La pantalla `/dashboard/help` carga (contadores en 0, formulario, adjuntos). "Enviar reporte" llama a TASKAPP y por eso no se prueba. `help.spec`: solo carga.

### Notas de la corrida de costos/configuración

- **Logo de la empresa:** "Editar Compañía" no se puede guardar con la empresa QA (el CUIT del seed no valida y no tiene provincia, ver el hallazgo previo) y otros specs dependen de ese CUIT, así que no se cambió. Se prueba la vista previa del formulario y la subida al bucket `logo` con la misma operación que usa el formulario (`/api/storage`, op `upload`), con un objeto de prueba que se borra.
- **Notificaciones:** la empresa QA tiene un solo usuario y el evento nunca notifica a quien lo dispara; no hay forma de generarlas por pantalla. Solo se prueba el estado vacío.
- No se vieron errores de base del tipo `schema "auth" does not exist` en ninguna de las pantallas probadas.

## Datos que los tests de costos y configuración dejan en la empresa QA E2E

- CCT fijo `QA-E2E-CCT` (convenio "QA-E2E-Convenio", desde 2026-01) con la categoría fija `QA-FIJA` (H-43: no se borran). Cada corrida crea un concepto de convenio `QAE2E_<id>` y lo deja **desactivado** (invisible en pantalla, H-41); las categorías de prueba por corrida se eliminan.
- Servicio fijo `QA-E2E-Servicio` (cliente fijo `QA-E2E-Cliente-Ventas`, CCT fijo) con margen IIBB 3%, su **composición del período 2026-01** (se sobrescribe en cada corrida, igual que su PDF `<empresa>/composicion/<servicio>/2026-01.pdf` en `costos-pdfs`) y su **fórmula polinómica** (componentes I001-I004, descripción editada en cada corrida). Las asignaciones de chofer, equipo, combustible y los ítems OCP se quitan al final de cada corrida (el `afterAll` vacía lo que haya quedado de una corrida fallida).
- Costo del tipo de equipo "Tractor" (creado una vez, no se puede borrar). Por corrida: un empleado (dado de baja) y dos equipos de prueba (dados de baja); el equipo del spec de catálogo conserva su costo.
- Configuración: un puesto jerárquico `QA-E2E-Puesto-*` por corrida, **deshabilitado** (la app no los borra). El tipo de retención y la cotización de la prueba se eliminan; la retención fija `QA_E2E_RET` no se toca. El encabezado, el pie y los PDFs firmados de Configuración > PDF se restauran a los valores originales y la firma (objeto en `logo/pdf-signatures/`) se borra del bucket.

### H-47 Los specs de costos son frágiles si corren en paralelo — resuelto en la suite

- Los dos archivos de costos comparten el convenio, el servicio y la composición de la empresa QA: en paralelo se pisan y fallan de forma intermitente. Con un solo worker pasan 20/20.
- Se ejecutan en proyectos encadenados (`costos-1` → `costos-2` en `playwright.config.ts`) y en CI en un job aparte con `--workers=1` (`e2e-costos`), fuera de los shards. Local: `npx playwright test --project=setup --project=costos-1 --project=costos-2 --workers=1`.

### H-48 Editar un cliente desde Comercial no guardaba (500) — corregido

- `updateCustomer` pasaba `cuit` y `client_phone` como string crudo del `FormData` a columnas `BigInt`: Prisma 7 lo rechaza y devolvía "Internal Server Error". Se convierten a `BigInt` antes de actualizar (no cambia ningún flujo, solo hace posible guardar).

### H-49 La pestaña Servicios de la empresa falla de forma intermitente en el clon — igual que producción en el código, no se cambia

- `ServiceComponent` pide tres endpoints propios por la URL pública (`NEXT_PUBLIC_BASE_URL`) desde el servidor; a veces el panel muestra "Error al cargar el panel" (visto ECONNRESET). Solo, el tab carga en 0,5–2 s. Los tests recargan y la suite corre con 2 reintentos en CI.

### H-50 Las tablas de clientes paginan de a 10 y ordenan por CUIT

- Con muchos clientes QA acumulados, el recién creado cae en otra página: los helpers (`customerRow`) avanzan de página hasta encontrarlo. Limpieza aplicada a la base del clon (solo `QA-E2E-cliente-*` de la empresa QA).
