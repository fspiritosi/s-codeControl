# Versionado de capacitaciones HSE — Diseño

**Ticket:** TKT-827 (Transporte SP) · **Fecha:** 2026-11-10 · **Módulo:** `src/modules/hse/features/training`

## Intención

Una capacitación se publicó sin el material adjunto. Hoy no se puede corregir: si al
menos un empleado ya la rindió (cualquier intento, aprobado o no), la UI bloquea la
edición de materiales y evaluación, y solo se pueden eliminar los borradores.

La corrección no puede ser una edición: lo que rindieron los empleados tiene que
quedar trazable frente a una auditoría, tal como lo rindieron. Por eso la solución es
**versionar**: la versión publicada se congela y se crea una versión nueva, que
reemplaza a la anterior cuando se publica.

## Objetivos

- Corregir una capacitación publicada que ya tiene intentos, sin perder lo que pasó
  con la versión anterior.
- Que la versión anterior quede cerrada con su registro definitivo y con el detalle de
  quién la hizo y quién no.
- Que todos los empleados tengan que rendir la versión nueva, incluidos los que
  aprobaron la anterior.
- Que el número de versión se vea en lo que ven y firman los empleados.

## No objetivos

- Editar en el lugar una capacitación con intentos. La regla actual se mantiene.
- Eliminar capacitaciones con intentos. La regla actual se mantiene: solo se eliminan
  los borradores.
- Comparar versiones, mostrar qué cambió entre una y otra, o fusionar resultados.
- Avisar automáticamente a los empleados cuando se publica una versión nueva.
- **Cambios en el portal donde rinden los empleados.** No vive en este repo: acá
  ningún código crea intentos ni guarda firmas, y las páginas
  `src/app/hse/training` muestran datos de prueba. El cliente lo dejó fuera de
  alcance. Ver "Dependencia con el portal del empleado".

## Anti-objetivos (sería un fracaso aunque funcione)

- Que la v1 cambie en algo después de que existe la v2: sus intentos, firmas,
  materiales, preguntas o su registro definitivo.
- Que un archivo de material que usa la v1 se borre de Storage porque se quitó de
  la v2.
- Que un empleado que aprobó la v1 figure como capacitado en la v2 sin haberla rendido.
- Que haya dos versiones de la misma capacitación disponibles para rendir al mismo
  tiempo.

## Comportamiento (decidido con el cliente)

### 1. Crear una versión nueva

- La acción **"Nueva versión"** aparece en capacitaciones **Publicadas que tienen al
  menos un intento** (el mismo criterio que hoy bloquea la edición:
  `attempts.length > 0`).
- Crea la v2 como **Borrador** y copia de la v1: título, descripción, datos del acta
  (todos los campos de `TrainingRecordData`, incluidos los de cierre de HSE vacíos),
  `passing_score`, `test_limit_time`, materiales, preguntas con sus opciones y
  etiquetas. No copia asignaciones, intentos, respuestas, lecturas de material ni
  firmas.
- Una vez creada, la v2 se edita como cualquier borrador: se pueden agregar, quitar o
  reemplazar materiales y preguntas.
- *(Decisión de diseño)* Puede haber **una sola versión en preparación a la vez** por
  capacitación. Si ya existe, "Nueva versión" lleva a ese borrador en lugar de crear
  otro.
- *(Decisión de diseño)* Si la capacitación publicada **no tiene intentos**, no se
  ofrece versionar: se sigue editando directamente, como hoy.

### 2. Mientras la v2 está en borrador

- La v1 sigue **Publicada** y se puede rendir normalmente.
- La tarjeta de la v1 muestra el aviso **"v2 en preparación"** con un enlace al
  borrador.
- La v2 aparece en la pestaña Borrador del listado con su número de versión.
- Si se elimina el borrador de la v2, la v1 sigue igual que antes.

### 3. Publicar la v2

Es una **única operación atómica**. O pasa todo o no pasa nada:

1. La v2 tiene que pasar `validateForPublish`, igual que cualquier publicación
   (TKT-826).
2. La v1 pasa a **Cerrada**, con `closed_at` y `closed_by` del usuario que publica.
   Los campos de cierre de HSE que estén **vacíos** se completan automáticamente:
   - `effectiveness_method` = "Cerrada por cambio de versión"
   - `requires_new_actions` = `true`, `new_actions_detail` = "Se emite la versión N"
     *(texto propuesto; el cliente no lo objetó)*

   *(Decisión de diseño)* Si el referente de HSE ya los cargó a mano, **no se
   pisan**: son datos del acta que van al registro ante una auditoría.
3. Se genera el **registro definitivo de la v1** con los empleados que la aprobaron,
   por el mismo mecanismo que usa hoy el cierre formal. *(Decisión de diseño)* El
   registro indica siempre "Cerrada por cambio de versión (reemplazada por la
   versión N)", estén como estén los campos de HSE.
4. Los empleados que **no aprobaron** la v1 quedan como **"No realizada por cambio de
   versión"** en esa versión, no como pendientes ni como vencidos.
5. Las **constancias de la v1 archivadas en el legajo** de los empleados
   (`documents_employees` creadas por `archiveCertificateInEmployeeFile`) se
   **vencen** en ese momento *(decidido con el cliente)*: `state = 'vencido'` y
   `validity` = fecha de publicación de la v2. Se ubican por `document_path`, que
   es `capacitaciones/{company_id}/{employee_id}/{attemptId}.pdf`, con los ids de
   los intentos de la v1. Siguen en el legajo como historial: no se borran ni se
   desactivan. Ojo: el trigger `log_document_employee_changes` exige `user_id` (ver
   el comentario en `archiveCertificateInEmployeeFile`), así que el update tiene que
   llevar el usuario que publica.
6. La v2 pasa a **Publicada**, con **todos los empleados en 0**, incluidos los que
   aprobaron la v1.

Cerrar la v1 por cambio de versión **no** debe exigir `validateForClose`, que sí
exige el cierre formal normal. La v1 puede haberse publicado antes de que existiera
la validación del acta (tsk-540) y tener campos vacíos. Ese cierre siempre tiene que
poder hacerse.

### 4. Número de versión

- Cada capacitación tiene un número de versión. Las existentes son la **v1**.
- Se muestra en el listado, en el detalle, en el portal del empleado, en la
  **constancia** (`TrainingCertificateLayout`) y en el **registro**
  (`TrainingRecordLayout`), por ejemplo "Difusión de Seguridad… (versión 2)".
- *(Decisión de diseño)* En la constancia y el registro de una v1 de una
  capacitación que nunca se versionó, no se muestra el número, para no cambiar los
  PDF de todas las capacitaciones existentes. Se muestra desde que la capacitación
  tiene más de una versión.

### 5. Listado y detalle (opción A, elegida por el cliente)

- El listado muestra **una sola tarjeta por capacitación: la versión vigente**, con su
  número ("v2") y la línea "Reemplaza a la v1 (cerrada el dd/mm, N aprobados)".
- Las versiones anteriores no tienen tarjeta propia. Se consultan en una pestaña
  nueva **"Versiones"** del detalle, con una fila por versión: número, estado,
  fecha de publicación, aprobados sobre el total y acceso al registro (provisorio si
  está vigente, definitivo si está cerrada). Desde cada fila se puede abrir el detalle
  de esa versión, en solo lectura si está cerrada.
- La pestaña Empleados de una versión cerrada por cambio de versión muestra a los que
  aprobaron como aprobados y al resto como "No realizada por cambio de versión".

### 6. Dependencia con el portal del empleado (fuera de alcance)

El portal donde rinden los empleados está en otra app y no se modifica. Este diseño
supone que el portal:

- Ofrece para rendir solo capacitaciones con `status = 'Publicado'`. Así la v1 deja
  de estar disponible cuando pasa a Cerrada, y no hay dos versiones abiertas a la vez.
- Calcula aprobado o pendiente por `training_id`. Así la v2, que es otra fila de
  `trainings` sin intentos, le aparece pendiente a todos, incluidos los que aprobaron
  la v1.

Si el portal no se comporta así, esos dos puntos no se cumplen y hay que tratarlo en
otro ticket. Del lado de este repo se puede verificar con los datos: después de
publicar una v2, la v1 tiene que estar Cerrada y la v2 sin intentos.

Un intento de la v1 que está empezado y sin terminar cuando se publica la v2 lo
resuelve el portal. En este repo, la v1 cerrada no incorpora gente nueva al registro.

No se mandan mails automáticos al publicar. Para avisar se usa "Enviar recordatorio
a todos", como hoy.

## Restricciones

- **Arquitectura del repo** (CLAUDE.md): las server actions van en
  `src/modules/hse/features/training/actions.server.ts` (o en un archivo nuevo del
  mismo feature) y no hay imports entre módulos.
- **Migraciones solo con ADD**, como las de tsk-540: columnas nuevas nullable o con
  default, sin romper los datos existentes. Todas las capacitaciones actuales quedan
  como v1 sin versión anterior.
- **Materiales compartidos en Storage:** la v2 copia las filas de
  `training_materials` apuntando a los mismos archivos. Quitar un material de la v2
  o eliminar el borrador de la v2 nunca debe borrar el archivo de Storage si otra
  versión lo referencia.
- **Atomicidad:** publicar la v2 y cerrar la v1 van en una transacción (Prisma
  `$transaction`). Hoy `updateTrainingStatus` usa el cliente de Supabase. Para esta
  operación conviene Prisma, como ya hacen `closeTraining` y
  `updateTrainingRecordFields`.
- **Multiempresa:** todas las consultas filtran por `company_id` (cookie
  `actualComp`), como el resto del feature.
- Los permisos siguen el criterio actual: Invitado y Auditor no versionan.

## Queda a criterio de quien implemente

- El modelo de datos. Una opción razonable es agregar a `trainings` las columnas
  `version_number int default 1`, `previous_version_id uuid null` (referencia a la
  versión anterior) y algo que marque el cierre por cambio de versión
  (`superseded_by_id` o `closed_reason`). Lo que se elija tiene que permitir
  reconstruir la cadena de versiones y distinguir "cerrada por cambio de versión" de
  "cerrada normalmente".
- Si "No realizada por cambio de versión" se guarda o se calcula. Calcularlo
  (empleado sin intento aprobado en una versión cerrada por cambio de versión) evita
  escribir filas y alcanza para lo que se pidió.
- Cómo se genera el registro definitivo de la v1 dentro de la operación, siempre que
  el resultado sea el mismo que el del cierre formal actual.
- Los textos exactos de botones y avisos, respetando los que figuran en este documento.
- Cómo se unifica el borrado de archivos de material. Hoy `deleteTraining` borra en
  el bucket `documents` y `updateTrainingMaterials` en `training-materials`. Lo único
  que no se negocia es la restricción de "Materiales compartidos en Storage".
- Qué pasa si la v1 se cierra o se archiva a mano mientras la v2 está en borrador:
  bloquearlo, o validarlo al publicar la v2.
