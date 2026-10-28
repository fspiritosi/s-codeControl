# Inventario de funcionalidades y cobertura E2E

Suite: Playwright en `tests/e2e/` contra el sistema desplegado (`E2E_BASE_URL`). Empresa de prueba "QA E2E" (`scripts/e2e/seed-qa.sql`).
Estado: ⬜ pendiente · ✅ hecho · ➖ justificado sin test.

| Módulo | Pantallas / acciones | Estado |
|---|---|---|
| Auth | login ok/error, ruta protegida, sesión, health, crons sin secreto, storage sin sesión | ✅ |
| Empresa | Listado de compañías: pestañas Compañías / Grupos compartidos, tarjeta QA E2E (`empresas.spec.ts`) | ✅ |
| Empresa | Listado de compañías: mostrar solo las propias (H-03, fuga entre empresas) | ⬜ `test.fixme`: bug abierto |
| Empresa | Grupos compartidos: crear/asignar/quitar empresas de un grupo | ➖ opera sobre empresas de otros clientes; solo se verifica que la vista cargue |
| Empresa | Alta de empresa (`/dashboard/company/new`): formulario y validaciones | ✅ |
| Empresa | Alta de empresa: crear una compañía y eliminarla | ➖ no hay borrado confiable y crear/cambiar de empresa mueve la cookie `actualComp` |
| Empresa | Detalle: pestaña General, las 8 pestañas por `?tab=`, Documentación (listado y columnas) (`detalle.spec.ts`) | ✅ |
| Empresa | Editar compañía: abrir con datos, validación de CUIT, cancelar | ✅ |
| Empresa | Editar compañía: guardar cambios | ➖ el CUIT del seed no valida y la empresa QA no tiene provincia; guardar cambiaría datos que no se pueden restaurar |
| Empresa | Zona peligrosa: abrir y cerrar el diálogo | ✅ |
| Empresa | Eliminar empresa | ➖ destructivo (el botón "Eliminar" del diálogo tampoco tiene acción) |
| Empresa | Documentos de la empresa: subir/descargar | ➖ la pestaña Documentación solo lista; los documentos de empresa se cargan desde el módulo Documentos |
| Empresa | Usuarios: tabla del dueño, invitados, diálogos Agregar Usuario/Invitado, validaciones, no compartir con uno mismo (`usuarios-portal.spec.ts`) | ✅ |
| Empresa | Usuarios: crear usuario / invitar por mail / eliminar acceso | ➖ envía mails y crea perfiles reales |
| Empresa | Clientes: listado, alta, validaciones, duplicado, edición, baja, "Ver dados de baja", reintegro (`clientes.spec.ts`) | ✅ (la edición pasa por el formulario del módulo Comercial) |
| Empresa | Clientes: borrar | ➖ la UI solo permite dar de baja; los clientes de prueba quedan dados de baja |
| Empresa | Contactos: listado y columnas | ✅ |
| Empresa | Contactos: registrar, editar, baja, reintegro | ⬜ `test.fixme`: H-06 (enlace 404) y H-07 (formulario roto), corregidos en código, falta deploy |
| Empresa | Convenios: árbol Sindicato > Convenio > Categoría, validación, uso en el alta de empleados (`convenios.spec.ts`) | ✅ |
| Empresa | Convenios: crear tras recargar la pestaña (H-05) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Empresa | Convenios: dar de baja sindicato/convenio/categoría | ➖ el árbol no ofrece la acción (la jerarquía de prueba tiene nombres fijos y se reutiliza) |
| Empresa | Servicios: ver Mantenimiento > Servicios (`maintenance/servicios.spec.ts`) | ✅ |
| Empresa | Portal de empleados: contadores y solapas vacías | ✅ |
| Empresa | Portal de empleados: aprobar/bloquear solicitudes | ➖ requiere un empleado con cuenta en el portal (envía mails) |
| Empleados | Listado: pestañas, filtros por apellido/nombre/estado, "Limpiar", columnas, paginación, Excel, menú de fila, enlaces (`listado.spec.ts`) | ✅ |
| Empleados | Alta: validaciones (vacío, CUIL, longitudes, dependencias), alta completa, duplicados de CUIL y legajo (`alta.spec.ts`) | ✅ |
| Empleados | Alta con foto: subida al storage y descarga | ✅ |
| Empleados | Alta con foto: el avatar del detalle (H-04) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Empleados | Alta/edición: quedarse en el listado después de guardar (H-01) | ⬜ `test.fixme`: bug abierto |
| Empleados | Detalle en solo lectura y edición en las tres pestañas (`detalle-edicion.spec.ts`) | ✅ (con sindicato/convenio/categoría) |
| Empleados | Edición de un empleado sin sindicato (H-02) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Empleados | Baja desde el listado y desde el detalle, empleados inactivos, reintegro (`baja-reactivacion.spec.ts`) | ✅ |
| Empleados | Borrar un empleado | ➖ el sistema no lo permite; los de prueba quedan dados de baja (DNI 99.xxx.xxx) |
| Empleados | Edición con el mismo DNI en otra empresa (H-08) | ➖ habría que escribir en datos de otra empresa |
| Empleados | Documentos del legajo: crear tipo, cargar, listar, descargar, historial en el menú, pestaña Documentación del detalle (`documentos-legajo.spec.ts`) | ✅ |
| Empleados | Tipos de documentos: crear, validar nombre, eliminar sin documentos | ✅ (desactivar solo se usa como limpieza, sin aserción; editar un tipo ⬜ pendiente) |
| Empleados | Tipo de documento obligatorio: crear (H-09, corregido en la base) | ✅ |
| Empleados | Alertas/documentos pendientes tras el alta con tipos obligatorios | ➖ un tipo obligatorio activo contamina a otras suites; solo se prueba el de baja (creado y desactivado en el mismo test) |
| Empleados | Documentos: mensual, multirecurso, historial, reemplazar, eliminar y documentos de baja (`documents/empleados.spec.ts`) | ✅ |
| Empleados | Diagramas: crear novedad, cargar días desde el detalle, listarlos (`diagramas.spec.ts`) | ✅ |
| Empleados | Diagramas: grilla "Diagrama Cargados" (H-11) y rótulo de fechas (H-12) | ⬜ `test.fixme`: bugs abiertos |
| Empleados | Diagramas: tabla de Tipos de Novedades, editar/borrar novedades (H-10) | ⬜ la tabla no lista las novedades |
| Empleados | Convenios colectivos (pestaña de Empleados) | ✅ (mismo árbol que en Empresa) |
| Equipos | Pantalla Equipos: pestañas y acceso al alta, validación del alta vacía (`equipment/equipos.spec.ts`) | ✅ |
| Equipos | Alta con foto, listado de activos con búsqueda | ✅ |
| Equipos | Foto: objeto en `vehicle-photos`, URL pública 200, URL firmada sin sesión (RustFS) | ✅ |
| Equipos | Foto en el detalle (H-13) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Equipos | Detalle en solo lectura y pestañas (Equipo, Valor de compra, Documentos, Reparaciones, QR) | ✅ |
| Equipos | Editar y guardar (H-14) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Equipos | QR: pestaña con descargar/imprimir/copiar | ✅ |
| Equipos | QR: URL copiada correcta (H-15) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Equipos | Baja (inactivos) y reintegro desde el menú de la fila | ✅ |
| Equipos | Borrar un equipo | ➖ la app solo permite dar de baja; los de prueba quedan dados de baja |
| Equipos | Filtros por columna, orden, paginación, Excel, columnas | ➖ fuera del alcance acordado (certificar flujos principales) |
| Equipos | Alta de marca, modelo y tipo desde el formulario | ➖ marcas y modelos son catálogos globales sin borrado: crearlos dejaría datos permanentes para otras empresas |
| Equipos | Valor de compra, Reparaciones, Mantenimiento (pestaña) | ➖ pertenecen al módulo de mantenimiento/costos; solo se verifica que el detalle abra |
| Equipos | "Afectado a" (asignar a clientes) | ➖ requiere clientes activos; se cubre en Empresa > Clientes |
| Documentos | Pantalla Documentos: pestañas, columnas y accesos de carga de empleados, equipos y empresa (`documents/pantallas.spec.ts`) | ✅ |
| Documentos | Tipos de documento de equipos: crear con vencimiento, editar, desactivar (`documents/equipos.spec.ts`) | ✅ |
| Documentos | Tipos de documento: mensual, multirecurso, VTV y de baja | ✅ (se crean y se desactivan; ninguno queda obligatorio y activo) |
| Documentos | Tipos de documento: eliminar con documentos cargados | ➖ la app no lo permite (solo desactivar) |
| Documentos | Equipos: cargar documento no multirecurso con vencimiento, estado "presentado" | ✅ |
| Documentos | Equipos: descarga desde RustFS (se compara el contenido) desde el detalle | ✅ |
| Documentos | Equipos: descarga desde el menú del listado (H-16) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Documentos | Equipos: historial, detalle del documento, reemplazar, eliminar (vuelve a pendiente) | ✅ |
| Documentos | Equipos: mensual con período y solapa "Documentos mensuales" (`documents/equipos-mensual-multi.spec.ts`) | ✅ |
| Documentos | Equipos: multirecurso a dos equipos y descarga desde el detalle | ✅ |
| Documentos | Empleados: mensual, multirecurso, historial, reemplazar, eliminar, documentos de baja (`documents/empleados.spec.ts`) | ✅ |
| Documentos | Empresa: listado y columnas | ✅ |
| Documentos | Empresa: subir/reemplazar/eliminar | ➖ solo existen pendientes de tipos "Empresa" obligatorios (contaminan a otras suites) |
| Documentos | Documentos pendientes: subir un faltante desde "Documento No Multirecurso" | ✅ (carga de tipos opcionales; los pendientes obligatorios no se generan en las pruebas) |
| Documentos | "Auditar alertas" (Empleados/Equipos) | ➖ dispara el envío de avisos por mail |
| Documentos | Renovar documento (detalle) | ⬜ pendiente |
| Calendario | Calendario de vencimientos: documento del mes en su día y leyendas (`documents/vencimientos.spec.ts`) | ✅ |
| VTV | Listado (documento tipo VTV), agendar turno, cancelar turno desde Gestionar | ✅ |
| VTV | Gestionar: orden/turno/marcar realizada, pestaña Calendario | ➖ fuera del alcance acordado |
| Mantenimiento | Tipos de reparación: crear, modificar, eliminar (limpieza) (`maintenance/solicitudes.spec.ts`) | ✅ |
| Mantenimiento | Solicitud de reparación con foto: crear, queda pendiente en "Solicitudes activas", eventos del trigger `log_repair_changes` | ✅ |
| Mantenimiento | Foto de la solicitud: imagen en `repair-images`, URL pública 200 `image/png`, mismo contenido y carga en el detalle (subida por la API en la ruta guardada) | ✅ |
| Mantenimiento | Foto de la solicitud: que la app la suba al crear la solicitud (H-18) | ⬜ `test.fixme`: corregido en código, falta deploy |
| Mantenimiento | Mecánico: pasar a "En reparación" y finalizar con imagen, aparece en "Solicitudes finalizadas", imagen del mecánico en `repair-images` | ✅ (la subida desde la app: H-18, `test.fixme`) |
| Mantenimiento | Solicitud para un equipo "Otros" sin kilometraje (H-19) | ⬜ `test.fixme`: bug abierto, igual que producción |
| Mantenimiento | Solicitudes: carga múltiple, cancelar desde el detalle de usuario, filtros, orden, paginación, Excel | ➖ fuera del alcance acordado (la carga múltiple usa el mismo flujo con varios equipos) |
| Mantenimiento | Servicios: crear (cliente y servicio), editar nombre, dar de baja, ver en la tabla | ✅ (`maintenance/servicios.spec.ts`) |
| Mantenimiento | Ítems de servicio: ver en la tabla y dar de baja | ✅ (creado por la API de la app) |
| Mantenimiento | Ítems de servicio: crear y editar por el formulario (H-20, H-21) | ⬜ `test.fixme`: bugs abiertos, igual que producción |
| Mantenimiento | Certificados de torqueo: crear (descarga del PDF), listado, detalle, reimprimir PDF (`maintenance/torque.spec.ts`) | ✅ |
| Mantenimiento | Certificados de torqueo: borrar / editar | ➖ la app no lo permite (son registros emitidos) |
| Operaciones | Partes diarios: crear un parte, listado "abierto", ver completo, cerrar (`operations/partes-diarios.spec.ts`) | ✅ |
| Operaciones | Partes diarios: fecha mostrada, aviso y tabla al agregar la fila, jornada guardada (H-22, H-23, H-24) | ⬜ `test.fixme`: bugs abiertos, igual que producción |
| Operaciones | Fila del parte: agregar, pasar a "ejecutado" (se comprueba reabriendo el parte) | ✅ |
| Operaciones | Documento adjunto: subir (remito + archivo), "Ver Documento", objeto en `daily-reports`, URL pública con el mismo contenido | ✅ |
| Operaciones | Documento adjunto: "Descargar" desde el visor (H-26) y carpeta con el nombre de la empresa (H-25) | ⬜ `test.fixme`: H-26 corregido en código (falta deploy), H-25 abierto |
| Operaciones | Fila: eliminar, reprogramar, cancelar, reemplazar documento, "Detalle de Partes diarios", Excel, empleados y equipos de la fila | ➖ fuera del alcance acordado (el alta de empleados y equipos de la fila no corre por H-23) |
| HSE | Documentos: tipo de documento fijo, subir (PDF) a Borradores, archivo en `documents-hse`, URL pública 200 con el mismo contenido, vista previa y descarga desde la tarjeta por `/api/storage` (`hse/documentos.spec.ts`) | ✅ |
| HSE | Documentos: editar un borrador, eliminarlo (el archivo sale del bucket) | ✅ |
| HSE | Documentos: publicar y nueva versión (archivo nuevo en el bucket, el anterior se conserva, historial en "Versiones") | ✅ |
| HSE | Documentos: editar sin cambiar el archivo, descargar desde el detalle, diálogo en pantalla chica (H-28, H-29, H-27) | ⬜ `test.fixme`: H-28 y H-29 igual que producción; H-27 corregido en código, falta deploy |
| HSE | Capacitaciones: crear, subir materiales (PDF) a `training-materials` con URL pública 200, "Ver Material" y "Descargar" del visor, pregunta de evaluación, editar, eliminar borrador (`hse/capacitaciones.spec.ts`) | ✅ |
| HSE | Capacitaciones: publicar y archivar (una capacitación fija con acta completa; Archivado -> Publicado -> Archivado) | ✅ |
| HSE | Capacitaciones: conservar los materiales anteriores al guardar y borrar los archivos al eliminar (H-30, H-31) | ⬜ `test.fixme`: igual que producción |
| HSE | Capacitaciones: asignación a empleados, recordatorios, intentos y evaluación del empleado, ruta pública `/hse/training`, estadísticas, etiquetas, tipos de documento HSE | ➖ fuera del alcance acordado (los recordatorios envían mails) |
| Formularios | Pantallas `/dashboard/forms` y `/dashboard/forms/new` cargan (`hse/formularios.spec.ts`) | ✅ |
| Formularios | Crear un tipo de checklist, completarlo, ver respuestas, eliminar (H-32) | ⬜ sin alta por pantalla y sin tipos de checklist en la empresa QA: hace falta ampliar el seed |
