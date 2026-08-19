# Certificado de torqueo (tsk-575)

## Qué se pide

Sergio necesita cargar los datos de un torqueo y **imprimir un certificado**. Hoy
lo hacen en papel, con dos hojas distintas: una para vehículos chicos y otra para
colectivos.

El producto es el PDF. El registro en sistema existe para poder reimprimir sin
volver a cargar todo, no como historial de análisis.

## Las dos hojas

Difieren en exactamente dos cosas:

| | Hoja "chicos" | Hoja "colectivos" |
|---|---|---|
| Fotos | Sprinter | Iveco Daily y colectivos grandes |
| Tabla de torques | Mercedes Benz: 9+1, 15+1, 19+1 | Iveco: 1+8, 24+1, 31+1, 41+1, 43+1, 44+1 |

Todo lo demás —datos generales, 7 verificaciones previas, especificaciones de
torque, diagramas de secuencia de apriete, los 8 tildes de apriete e indicadores,
y la firma— es idéntico.

### Contenido del formulario

1. **Datos generales**: fecha, conductor, mecánico, vehículo, patente, N° interno,
   lugar, herramienta de torque (tipo/modelo) y calibración vigente para las
   cuatro ruedas: DI (delantera izquierda), DD (delantera derecha), TD (trasera
   derecha), TI (trasera izquierda).
2. **Verificaciones previas** — 7 ítems Sí/No con observaciones: área de trabajo
   seguro, EPP, base firme y vehículo inmovilizado, herramienta de torque en
   condiciones, tornillería en buen estado, secuencia de apriete disponible,
   estado de checkpoint.
3. **Especificaciones de torque**: torque requerido, si cumple (sí/no), rango de
   tolerancia en Nm, y condición del perno o tuerca (seco / lubricado).
4. **Secuencia de apriete**: los tres diagramas de ruedas, más 8 tildes Sí/No —
   torque delantero y trasero por lado, e indicador de rueda delantero y trasero
   por lado.
5. **Tabla de torques de referencia** según la marca.
6. **Firma del mecánico**.

## Decisiones tomadas

**El vehículo se elige del sistema.** Patente, número interno y marca se
completan solos a partir del equipo seleccionado. Menos errores de tipeo y el
certificado queda vinculado al equipo.

**La tabla de torques sale de la marca; el formato de hoja lo elige el usuario.**
Esta es la decisión menos obvia y la más importante. La distinción del papel
(chicos vs colectivos) es de *tamaño*, pero la tabla de torques que trae cada
hoja es de *marca* — Mercedes en una, Iveco en la otra. Un colectivo
Mercedes-Benz, que son habituales en la flota, caería en la hoja de colectivos y
saldría impreso con valores de Iveco. En un documento sobre torques eso no es
cosmético: son valores distintos. Por eso las dos cosas se resuelven por separado.

Tampoco se puede derivar el formato del catálogo de tipos de vehículo: hoy tiene
Auto, Camioneta, Camión y Maquinaria pesada, sin "colectivo" ni "minibús", y ese
catálogo además difiere entre local y producción.

**Snapshot de los datos del vehículo.** El certificado guarda patente, interno y
marca tal como estaban al emitirlo. Un documento ya entregado no puede cambiar
porque después se corrigió la patente del equipo en el sistema. Mismo criterio
que las constancias de capacitación (tsk-540).

**Vive en Mantenimiento**, junto a reparaciones y servicios, que es donde ya vive
el trabajo de taller sobre equipos.

**Se guarda con listado y reimpresión.** No se archiva en el legajo del equipo.

## Modelo de datos

Tres tablas nuevas. Migración ADD-only.

### `torque_specs`
Tabla de referencia de torques por marca.

- `company_id`, `brand_id` → `brand_vehicles`
- `configuration` (`"9+1"`, `"24+1"`, …)
- `nm_min`, `nm_max`, `ftlb_min`, `ftlb_max`
- `is_active`

Se siembra con los valores de las dos hojas: 3 filas de Mercedes-Benz y 6 de
Iveco. **Sin ABM en esta versión**: si aparece otra marca se agrega por
migración. No se construye una pantalla de configuración que nadie pidió.

### `torque_certificates`
- `company_id`, `number` + `full_number` (correlativo `TQ-00001`)
- `vehicle_id` → `vehicles`
- `sheet_format` (enum: hoja de chicos / hoja de colectivos)
- `date`, `driver_name`, `mechanic_name`, `place`
- `tool_type`, y las cuatro calibraciones: `calibration_di`, `calibration_dd`,
  `calibration_td`, `calibration_ti`
- `required_torque`, `meets_requirement`, `tolerance_range_nm`,
  `bolt_condition` (enum: seco / lubricado)
- Snapshot: `vehicle_domain`, `vehicle_intern_number`, `vehicle_brand_name`
- `created_by`, `created_at`

### `torque_certificate_checks`
Los 15 tildes: las 7 verificaciones previas y los 8 de secuencia de apriete.

- `certificate_id`, `item_key`, `value` (bool), `observations`

Se eligió tabla hija por sobre 15 columnas booleanas o un JSON opaco: es legible
y permite después preguntar "cuántas veces falló EPP" sin parsear nada.

## Pantallas

- `/dashboard/maintenance/torque` — listado con DataTable estándar (filtro por
  columna, como el resto del sistema)
- `/dashboard/maintenance/torque/new` — formulario de carga
- `/dashboard/maintenance/torque/[id]` — detalle con reimpresión

En el formulario, al elegir el equipo se completan patente, interno y marca, y
**se muestra en pantalla la tabla de torques de esa marca**, solo lectura. Es
para lo mismo que existe en el papel: que el mecánico vea los valores mientras
carga.

## El PDF

**Una sola plantilla parametrizada**, no dos. Recibe el juego de fotos según el
formato elegido y las filas de torque según la marca. Duplicar el layout
significaría 200 líneas repetidas que se desincronizan a la primera corrección.

Reusa el patrón de `src/modules/hse/features/checklist/components/pdf/layouts` y
toma el logo de `pdf_settings`, como el resto de los PDFs del sistema.

La firma del mecánico va como **línea en blanco** para firmar a mano, igual que
el papel. No hay firma digital.

## Riesgo abierto: las imágenes

Los diagramas de secuencia de apriete y las fotos de vehículos disponibles son
**escaneos de fotos de papel**, torcidos y de baja resolución. Puestos en un PDF
nuevo se van a ver mal y el certificado va a parecer una fotocopia.

Tres salidas posibles, sin definir todavía:

1. Pedirle a Sergio los archivos originales del Word.
2. Redibujar los tres diagramas de apriete como vectores. Son círculos con
   números: es viable y quedarían nítidos a cualquier tamaño.
3. Dejar las fotos de vehículos afuera y conservar solo los diagramas, que son lo
   que aporta información real.

**No bloquea el desarrollo** —se puede construir todo con placeholders— pero sí
bloquea la entrega final al cliente.

## Fuera de alcance

- ABM de la tabla de torques (se siembra por migración).
- Archivar el certificado en el legajo del equipo.
- Firma digital del mecánico.
- Derivar automáticamente el formato de hoja del tipo de vehículo.

## Verificación

- Un certificado de un vehículo Mercedes-Benz imprime la tabla Mercedes; uno de
  Iveco imprime la de Iveco, **independientemente del formato de hoja elegido**.
- Cambiar la patente de un equipo después de emitir un certificado no altera el
  PDF ya emitido.
- El listado permite reimprimir sin recargar datos.
- Los 15 tildes y sus observaciones se persisten y se reflejan en el PDF.
- El correlativo no se repite dentro de una misma empresa.
