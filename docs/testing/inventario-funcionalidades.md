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
| Compras | Proveedores: alta con cheque y cuenta bancaria, detalle con los métodos de pago, edición (`purchasing/proveedores.spec.ts`) | ✅ |
| Compras | Proveedores: baja / eliminar (H-35) | ➖ la app no lo ofrece; el proveedor de prueba queda activo |
| Compras | Órdenes de compra: alta, estados enviar a aprobación > aprobar (sin email del proveedor: no hay mail) > cancelar, eliminar un borrador (`purchasing/ordenes.spec.ts`) | ✅ |
| Compras | Órdenes de compra: adjunto PDF en el bucket privado `purchase-orders`: objeto en la ruta `<empresa>/<orden>/`, "Ver" abre la URL firmada con el mismo contenido, la ruta sin firma no se lee, eliminar el adjunto lo borra del bucket | ✅ |
| Compras | Órdenes de compra: rechazar, imputar facturas/gastos, PDF de la orden, revisión de precios | ➖ fuera del alcance acordado |
| Compras | Órdenes de compra: eliminar una orden con adjunto borra el archivo (H-37) | ⬜ `test.fixme`: igual que producción |
| Compras | Facturas de compra: alta con PDF (sin usar la lectura por IA), objeto en `purchase-invoices`, URL pública 200 con el mismo contenido, "Ver PDF" firmada, reemplazar y quitar el adjunto, confirmar, eliminar (`purchasing/facturas.spec.ts`) | ✅ |
| Compras | Facturas de compra: "Cargar desde factura" (IA), notas de crédito, editar, percepciones, descuentos | ➖ la IA envía el archivo a un proveedor externo; el resto fuera del alcance acordado |
| Compras | Facturas de compra: eliminar una factura con adjunto borra el PDF (H-36) | ⬜ `test.fixme`: igual que producción |
| Compras | Remitos de recepción: alta manual, confirmar (ingresa stock) y anular (revierte stock) (`purchasing/recepciones.spec.ts`) | ✅ |
| Compras | Remitos de recepción: recibir desde una orden o factura, detalle, fecha mostrada (H-34) | ➖ fuera del alcance acordado / H-34 igual que producción |
| Compras | Gastos, cuenta corriente del proveedor, pagos | ➖ fuera del alcance acordado |
| Almacenes | Productos: alta, edición y desactivación (`warehouse/productos.spec.ts`) | ✅ |
| Almacenes | Almacenes: alta, edición, ajuste de stock con su movimiento y transferencia entre almacenes (`warehouse/almacenes.spec.ts`) | ✅ |
| Almacenes | Almacenes: desactivar (H-35) | ➖ la app no lo ofrece; el almacén de prueba queda activo |
| Almacenes | Retiros (ORM): alta, enviar a aprobación > aprobar > completar (descuenta stock y genera el movimiento) y cancelar (`warehouse/retiros.spec.ts`) | ✅ |
| Almacenes | Retiros: PDF de la orden, empleado y equipo asociados, rechazar | ➖ fuera del alcance acordado |
| Ventas | Puntos de venta: alta, edición (nombre y estado), configurar numeración, eliminar un punto sin comprobantes (`sales/puntos-de-venta.spec.ts`) | ✅ |
| Ventas | Facturas de venta: borrador, editar, confirmar (numeración interna del punto de venta; no se llama a ARCA/AFIP, el CAE es un campo manual que no se completa), PDF, anular, eliminar un borrador, cuenta corriente del cliente (`sales/facturas.spec.ts`) | ✅ |
| Ventas | Facturas de venta: botón de PDF en la interfaz (H-38) | ➖ la ruta del PDF funciona pero ninguna pantalla la enlaza; igual que producción |
| Ventas | Facturas de venta: notas de crédito/débito, factura B, moneda USD, percepciones, descuentos, otros cargos | ➖ fuera del alcance acordado |
| Ventas | Recibos de cobro: crear contra una factura confirmada, confirmar (la factura pasa a Cobrada), detalle, PDF, anular (la factura vuelve a Confirmada), eliminar un borrador (`sales/recibos.spec.ts`) | ✅ |
| Ventas | Recibos: medios de pago y retenciones informativos, editar, cobro parcial | ➖ fuera del alcance acordado |
| Ventas | Cuenta corriente: la factura confirmada aparece en el estado de cuenta del cliente (dentro de `sales/facturas.spec.ts`) | ✅ |
| Comercial | Clientes: alta con condición de IVA, listado, detalle con servicio y contacto, edición, baja (`commercial/clientes.spec.ts`) | ✅ (la app no borra clientes; el de prueba queda dado de baja. `QA-E2E-Cliente-Ventas` es fijo y queda activo) |
| Comercial | Cotizaciones | ➖ pantalla "en desarrollo" (sin funciones): solo se comprueba el mensaje |
| Tesorería | Cajas físicas: alta, edición, abrir sesión, ingreso, cerrar sesión, desactivar (`treasury/cajas.spec.ts`) | ✅ (la app no borra cajas; las de prueba quedan inactivas) |
| Tesorería | Órdenes de pago: alta con pago a cuenta y retención en efectivo, editar, PDF, confirmar (egreso de caja + certificado de retención), marcar como pagada (proveedor fijo sin email: no hay mail), anular una confirmada (repone la caja) (`treasury/ordenes-pago.spec.ts`) | ✅ |
| Tesorería | Retenciones: la retención de la orden aparece con su certificado y el PDF del certificado se genera (dentro de `treasury/ordenes-pago.spec.ts`; tipo fijo `QA_E2E_RET` en Configuración > Impuestos) | ✅ |
| Tesorería | Saldos pendientes: factura de compra confirmada con su saldo, crear la orden desde la selección (queda "Programada"), anular la orden la devuelve a "Sin OP" (`treasury/saldos-pendientes.spec.ts`) | ✅ |
| Tesorería | Cuentas bancarias, cheques, pago con transferencia/cheque, orden con facturas y notas de crédito, exportar Excel | ➖ fuera del alcance acordado |
| Ventas / Tesorería | Archivos: la orden de pago, el certificado de retención y los PDF de factura y recibo de venta se generan al pedirlos; no se guardan en ningún bucket (no hay objetos para comprobar) | ✅ |
| Costos | Tablero con accesos a cada pantalla y topes imponibles (solo carga y diálogo, sin guardar: tabla global, H-42) (`costos/pantallas.spec.ts`) | ✅ |
| Costos | Configuración CCT: convenio fijo `QA-E2E-CCT`, categorías (crear, editar, eliminar), conceptos (crear, editar, desactivar) (`costos/servicio-composicion.spec.ts`) | ✅ |
| Costos | Configuración CCT: reactivar un concepto desactivado (H-41), valores por categoría, nueva paritaria | ⬜ `test.fixme` H-41 igual que producción / ➖ fuera del alcance acordado |
| Costos | Conceptos de equipo: crear, editar, eliminar (`costos/catalogo-equipos.spec.ts`) | ✅ |
| Costos | Tipos de equipo: costear el tipo "Tractor", asociar y sacar un concepto | ✅ (el costo del tipo no se puede borrar, H-43) |
| Costos | Equipos: cargar y editar el costo de un equipo, costo mensual en el listado | ✅ (el equipo se da de baja; su costo queda) |
| Costos | Servicios: servicio fijo `QA-E2E-Servicio` (cliente y CCT fijos), editar márgenes, listado | ✅ (no se puede borrar, H-43) |
| Costos | Otros costos de personal (OCP): agregar y editar un ítem, pantalla transversal, eliminar | ✅ |
| Costos | Mano de obra: asignar un chofer con la categoría fija, editar, pantalla transversal, quitar | ✅ |
| Costos | Equipos del servicio: asignar y quitar un vehículo | ✅ |
| Costos | Combustible: cargar un registro de un vehículo y período, eliminar | ✅ |
| Costos | Composición: generar el período fijo 2026-01 (upsert), detalle, listado, recalcular | ✅ |
| Costos | Archivos: PDF de la composición en el bucket PRIVADO `costos-pdfs` (`<empresa>/composicion/<servicio>/<período>.pdf`): "Exportar PDF" entrega una URL firmada (200, `%PDF-`), la ruta sin firma no se lee, recalcular lo reescribe en el mismo objeto | ✅ |
| Costos | Fórmula polinómica: inicializar desde la composición (componentes I001-I004), editar la descripción | ✅ (no se puede borrar, H-43) |
| Costos | Fórmula polinómica: componentes, índices mensuales, retroactivos; salidas (outputs) de la composición; liquidación de sueldos | ➖ fuera del alcance acordado (flujo principal) |
| Configuración | PDF: subir la firma PNG al bucket público `logo` (`pdf-signatures/<empresa>.png`, URL pública 200 con los mismos bytes, la imagen carga), conservar tras recargar, encabezado/pie/PDFs firmados (se restauran), eliminar la firma (`settings/pdf.spec.ts`) | ✅ |
| Configuración | PDF: eliminar la firma borra el objeto del bucket (H-40) | ⬜ `test.fixme`: igual que producción |
| Configuración | PDF: email por tipo de PDF | ➖ fuera del alcance acordado |
| Configuración | Logo de la empresa: vista previa en "Editar Compañía" y subida al bucket `logo` con URL pública 200, objeto de prueba borrado (`settings/empresa-logo.spec.ts`) | ✅ |
| Configuración | Logo de la empresa: guardar desde el formulario | ➖ la empresa QA no se puede guardar (CUIT inválido y sin provincia, ver hallazgos) y cambiarlos no se puede deshacer |
| Configuración | Parámetros de empleados: puesto jerárquico (crear, editar, deshabilitar) (`settings/parametros-impuestos.spec.ts`) | ✅ (los puestos no se borran: queda deshabilitado) |
| Configuración | Impuestos: tipo de retención (crear, editar, desactivar, eliminar); Cálculos: cotización del dólar (crear, editar, eliminar) | ✅ |
| Configuración | IA / Proveedores: el formulario carga, sin guardar claves (configuración global) | ✅ |
| Configuración | Roles y permisos, diagramas de trabajo, tipos de contrato, percepciones, índices | ➖ fuera del alcance acordado |
| Notificaciones | Listado vacío, pestaña "Sin leer", campana del encabezado (`notifications/notificaciones.spec.ts`) | ✅ |
| Notificaciones | Marcar leída / limpiar | ➖ la empresa QA tiene un solo usuario y no se generan notificaciones por pantalla (el cron no se dispara) |
| Ayuda | La pantalla carga con el formulario de reporte (`notifications/ayuda.spec.ts`) | ✅ |
| Ayuda | Crear ticket | ➖ llama al servicio externo TASKAPP, no configurado en el clon (H-46) |
| Admin | `/admin/panel` y `/admin/tablas` cargan para el usuario QA sin redirigir (`admin/admin.spec.ts`) | ✅ (el layout no valida el rol: H-44) |
| Admin | `/admin/auditor`: hoy cae en "Error en administracion" (H-45); redirección de clientes (H-44) | ⬜ `test.fixme`: igual que producción |
| Admin | Acciones de escritura (crear usuario, alterar catálogos globales) | ➖ afectan datos globales de la plataforma |
