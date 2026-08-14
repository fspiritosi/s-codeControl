'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { topicLabel } from '../../shared/record-fields';

/**
 * Constancia individual de capacitación aprobada (tsk-540).
 *
 * Es el documento que se archiva en el legajo del empleado, bajo el tipo
 * "Capacitación", con el vencimiento que definió el referente de HSE. A
 * diferencia del registro grupal, acá sí figura la fecha exacta en que la
 * persona completó la capacitación.
 */

export type TrainingCertificateData = {
  employee_full_name: string;
  employee_document: string | null;
  employee_position: string | null;
  training_title: string;
  topics: string[];
  dictated_at: string | null;
  completed_at: string | null;
  estimated_duration_minutes: number | null;
  location: string | null;
  score: number | null;
  max_score: number;
  valid_until: string | null;
  instructor_name: string | null;
  instructor_position: string | null;
  instructor_licenses: string | null;
  instructor_signature_url: string | null;
  employee_signature_url: string | null;
  company_name: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1pt solid black',
    paddingBottom: 8,
  },
  logo: { width: 150, height: 42, objectFit: 'contain' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 28, marginBottom: 4 },
  subtitle: { fontSize: 10, textAlign: 'center', color: '#555', marginBottom: 24 },
  body: { lineHeight: 1.6, textAlign: 'justify' },
  strong: { fontFamily: 'Helvetica-Bold' },
  detailBox: { marginTop: 22, border: '0.5pt solid #999', padding: 10 },
  detailRow: { flexDirection: 'row', marginBottom: 3 },
  detailLabel: { width: '38%', fontFamily: 'Helvetica-Bold' },
  detailValue: { width: '62%' },
  signatures: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 46 },
  signatureBlock: { width: '40%', alignItems: 'center' },
  signatureImg: { height: 40, objectFit: 'contain', marginBottom: 2 },
  signatureLine: { borderTop: '0.5pt solid black', width: '100%', marginTop: 2, paddingTop: 3, textAlign: 'center' },
  small: { fontSize: 8, color: '#555', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 7, color: '#666', textAlign: 'center' },
});

function formatDate(value: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
}

export function TrainingCertificateLayout({
  data,
  logoUrl,
}: {
  data: TrainingCertificateData;
  logoUrl?: string | null;
}) {
  return (
    <Document title={`Constancia — ${data.training_title} — ${data.employee_full_name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : <Text> </Text>}
          <Text style={{ fontSize: 10, textAlign: 'right' }}>{data.company_name ?? ''}</Text>
        </View>

        <Text style={styles.title}>CONSTANCIA DE CAPACITACIÓN</Text>
        <Text style={styles.subtitle}>Realización y aprobación</Text>

        <Text style={styles.body}>
          Se deja constancia de que <Text style={styles.strong}>{data.employee_full_name}</Text>
          {data.employee_document ? `, documento ${data.employee_document}` : ''}
          {data.employee_position ? `, que se desempeña como ${data.employee_position}` : ''}, realizó y{' '}
          <Text style={styles.strong}>aprobó</Text> la capacitación{' '}
          <Text style={styles.strong}>{data.training_title}</Text>, completándola el{' '}
          <Text style={styles.strong}>{formatDate(data.completed_at)}</Text>.
        </Text>

        <View style={styles.detailBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Capacitación</Text>
            <Text style={styles.detailValue}>{data.training_title}</Text>
          </View>
          {data.topics.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Temas incluidos</Text>
              <Text style={styles.detailValue}>{data.topics.map(topicLabel).join(', ')}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha de la capacitación</Text>
            <Text style={styles.detailValue}>{formatDate(data.dictated_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha en que la completó</Text>
            <Text style={styles.detailValue}>{formatDate(data.completed_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duración</Text>
            <Text style={styles.detailValue}>{formatDuration(data.estimated_duration_minutes)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lugar</Text>
            <Text style={styles.detailValue}>{data.location ?? ''}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Resultado</Text>
            <Text style={styles.detailValue}>
              {data.score ?? 0}/{data.max_score} – Aprobado
            </Text>
          </View>
          {data.valid_until && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Válida hasta</Text>
              <Text style={styles.detailValue}>{formatDate(data.valid_until)}</Text>
            </View>
          )}
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            {data.employee_signature_url ? (
              <Image style={styles.signatureImg} src={data.employee_signature_url} />
            ) : (
              <View style={{ height: 40 }} />
            )}
            <Text style={styles.signatureLine}>{data.employee_full_name}</Text>
            <Text style={styles.small}>Firma del empleado</Text>
          </View>

          <View style={styles.signatureBlock}>
            {data.instructor_signature_url ? (
              <Image style={styles.signatureImg} src={data.instructor_signature_url} />
            ) : (
              <View style={{ height: 40 }} />
            )}
            <Text style={styles.signatureLine}>{data.instructor_name ?? ''}</Text>
            <Text style={styles.small}>{data.instructor_position ?? 'Capacitador'}</Text>
            {data.instructor_licenses ? <Text style={styles.small}>{data.instructor_licenses}</Text> : null}
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generado por CodeControl. La firma del empleado fue registrada digitalmente al aprobar la
          capacitación.
        </Text>
      </Page>
    </Document>
  );
}
