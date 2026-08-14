'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import {
  evaluationMethodLabel,
  topicLabel,
  TRAINING_EVALUATION_METHODS,
  TRAINING_TOPICS,
} from '../../shared/record-fields';

/**
 * Registro de capacitación (tsk-540). Reproduce el formulario en papel que usa
 * la empresa.
 *
 * Se emite en dos modos:
 *  - provisorio: se descarga en cualquier momento para seguir el avance, aunque
 *    falten los campos que carga HSE al cierre. Lleva marca de agua.
 *  - definitivo: al cerrar la capacitación.
 *
 * La tabla mantiene las cinco columnas del formulario original. La fecha en que
 * cada empleado completó y el tiempo que le llevó NO van acá: el cliente pidió
 * que la planilla muestre solo la duración estimada de la capacitación.
 */

export type TrainingRecordRow = {
  number: number;
  full_name: string;
  position: string;
  signature_url: string | null;
  result: string;
};

export type TrainingRecordHeader = {
  title: string;
  dictated_at: string | null;
  deadline_at: string | null;
  estimated_duration_minutes: number | null;
  location: string | null;
  instructor_name: string | null;
  instructor_position: string | null;
  instructor_licenses: string | null;
  instructor_signature_url: string | null;
  topics: string[];
  teaching_resources: string | null;
  material_delivered: boolean | null;
  material_delivered_detail: string | null;
  evaluation_methods: string[];
  effectiveness_method: string | null;
  requires_new_actions: boolean | null;
  new_actions_detail: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  watermark: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 60,
    color: '#e5e5e5',
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-30deg)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1pt solid black',
    paddingBottom: 6,
    marginBottom: 6,
  },
  logo: { width: 150, height: 42, objectFit: 'contain' },
  docTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  row: { flexDirection: 'row', borderBottom: '0.5pt solid #999' },
  cell: { padding: 4, borderRight: '0.5pt solid #999' },
  label: { fontFamily: 'Helvetica-Bold' },
  block: { padding: 4, borderBottom: '0.5pt solid #999' },
  checkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  check: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  box: {
    width: 8,
    height: 8,
    border: '0.5pt solid black',
    marginRight: 3,
    textAlign: 'center',
    fontSize: 7,
    lineHeight: 1.1,
  },
  table: { marginTop: 8, border: '0.5pt solid #999' },
  th: {
    flexDirection: 'row',
    backgroundColor: '#eeeeee',
    borderBottom: '0.5pt solid #999',
    fontFamily: 'Helvetica-Bold',
  },
  signatureCell: { height: 28, justifyContent: 'center', alignItems: 'center' },
  signatureImg: { height: 24, objectFit: 'contain' },
  instructorSignature: { height: 32, objectFit: 'contain', marginBottom: 2 },
  footNote: { marginTop: 10, fontSize: 7, color: '#444' },
  pageNumber: { position: 'absolute', bottom: 12, right: 28, fontSize: 8, color: '#444' },
});

// Anchos de las cinco columnas del formulario original.
const COLS = { number: '6%', name: '36%', position: '20%', signature: '20%', result: '18%' };

function Check({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={styles.check}>
      <Text style={styles.box}>{checked ? 'X' : ' '}</Text>
      <Text>{label}</Text>
    </View>
  );
}

function formatDate(value: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function TrainingRecordLayout({
  header,
  rows,
  logoUrl,
  draft = false,
}: {
  header: TrainingRecordHeader;
  rows: TrainingRecordRow[];
  logoUrl?: string | null;
  draft?: boolean;
}) {
  return (
    <Document title={`Registro de capacitación — ${header.title}`}>
      <Page size="A4" style={styles.page} wrap>
        {draft && (
          <Text style={styles.watermark} fixed>
            PROVISORIO
          </Text>
        )}

        {/* El encabezado y los datos de la capacitación se repiten en cada hoja:
            el cliente lo pidió explícitamente para cuando la lista no entra en
            una sola página. */}
        <View fixed>
          <View style={styles.header}>
            {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : <Text> </Text>}
            <Text style={styles.docTitle}>REGISTRO DE CAPACITACIÓN</Text>
          </View>

          <View style={{ border: '0.5pt solid #999' }}>
            <View style={styles.row}>
              <View style={[styles.cell, { width: '33%' }]}>
                <Text>
                  <Text style={styles.label}>Fecha: </Text>
                  {formatDate(header.dictated_at)}
                </Text>
              </View>
              <View style={[styles.cell, { width: '33%' }]}>
                <Text>
                  <Text style={styles.label}>Duración: </Text>
                  {formatDuration(header.estimated_duration_minutes)}
                </Text>
              </View>
              <View style={[styles.cell, { width: '34%', borderRight: 'none' }]}>
                <Text>
                  <Text style={styles.label}>Lugar: </Text>
                  {header.location ?? ''}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.cell, { width: '66%' }]}>
                <Text>
                  <Text style={styles.label}>Capacitador/es: </Text>
                  {header.instructor_name ?? ''}
                </Text>
                {header.instructor_position ? <Text>{header.instructor_position}</Text> : null}
                {header.instructor_licenses ? <Text>{header.instructor_licenses}</Text> : null}
              </View>
              <View style={[styles.cell, { width: '34%', borderRight: 'none', alignItems: 'center' }]}>
                <Text style={styles.label}>Firma:</Text>
                {header.instructor_signature_url ? (
                  <Image style={styles.instructorSignature} src={header.instructor_signature_url} />
                ) : (
                  <Text style={{ color: '#888' }}>Sin firma</Text>
                )}
              </View>
            </View>

            <View style={styles.block}>
              <Text>
                <Text style={styles.label}>Título de capacitación: </Text>
                {header.title}
              </Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.label}>Temas incluidos:</Text>
              <View style={styles.checkRow}>
                {TRAINING_TOPICS.map((topic) => (
                  <Check key={topic.value} checked={header.topics.includes(topic.value)} label={topicLabel(topic.value)} />
                ))}
              </View>
            </View>

            <View style={styles.block}>
              <Text>
                <Text style={styles.label}>Recursos didácticos utilizados: </Text>
                {header.teaching_resources ?? ''}
              </Text>
            </View>

            <View style={styles.block}>
              <View style={styles.checkRow}>
                <Text style={styles.label}>Material escrito / digital entregado:</Text>
                <Check checked={header.material_delivered === true} label="Sí" />
                <Check checked={header.material_delivered === false} label="No" />
                <Text>
                  <Text style={styles.label}>¿Cuál? </Text>
                  {header.material_delivered_detail ?? ''}
                </Text>
              </View>
            </View>

            <View style={styles.block}>
              <Text>
                <Text style={styles.label}>Método de evaluación de la eficacia: </Text>
                {header.effectiveness_method ?? ''}
              </Text>
            </View>

            <View style={[styles.block, { borderBottom: 'none' }]}>
              <Text style={styles.label}>Evaluación:</Text>
              <View style={styles.checkRow}>
                {TRAINING_EVALUATION_METHODS.map((method) => (
                  <Check
                    key={method.value}
                    checked={header.evaluation_methods.includes(method.value)}
                    label={evaluationMethodLabel(method.value)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.th} fixed>
            <Text style={[styles.cell, { width: COLS.number }]}>N°</Text>
            <Text style={[styles.cell, { width: COLS.name }]}>APELLIDO Y NOMBRE</Text>
            <Text style={[styles.cell, { width: COLS.position }]}>PUESTO</Text>
            <Text style={[styles.cell, { width: COLS.signature }]}>FIRMA</Text>
            <Text style={[styles.cell, { width: COLS.result, borderRight: 'none' }]}>RESULTADO EVALUACIÓN</Text>
          </View>

          {rows.length === 0 && (
            <View style={styles.row}>
              <Text style={[styles.cell, { width: '100%', borderRight: 'none', color: '#888' }]}>
                Todavía no hay empleados que hayan aprobado la capacitación.
              </Text>
            </View>
          )}

          {rows.map((row) => (
            <View key={row.number} style={styles.row} wrap={false}>
              <Text style={[styles.cell, { width: COLS.number }]}>{row.number}</Text>
              <Text style={[styles.cell, { width: COLS.name }]}>{row.full_name}</Text>
              <Text style={[styles.cell, { width: COLS.position }]}>{row.position}</Text>
              <View style={[styles.cell, styles.signatureCell, { width: COLS.signature }]}>
                {row.signature_url ? (
                  <Image style={styles.signatureImg} src={row.signature_url} />
                ) : (
                  <Text style={{ color: '#888' }}>Sin firma</Text>
                )}
              </View>
              <Text style={[styles.cell, { width: COLS.result, borderRight: 'none' }]}>{row.result}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8, border: '0.5pt solid #999', padding: 4 }}>
          <View style={styles.checkRow}>
            <Text style={styles.label}>¿Se requieren nuevas acciones?</Text>
            <Check checked={header.requires_new_actions === true} label="Sí" />
            <Check checked={header.requires_new_actions === false} label="No" />
          </View>
          {header.requires_new_actions ? <Text>Indicar cuáles: {header.new_actions_detail ?? ''}</Text> : null}
        </View>

        <Text style={styles.footNote}>
          *Debe remitirse original, evaluación y material al área de recursos humanos / *No se deben dejar campos en
          blanco / *Los formularios deben ser firmados por todos los asistentes a la capacitación sin excepción.
        </Text>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
