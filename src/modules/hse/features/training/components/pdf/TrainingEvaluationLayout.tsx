'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

/**
 * Hoja de evaluación individual (tsk-540).
 *
 * El pie del formulario en papel pide remitir "original, evaluación y material"
 * a RRHH: esta es la evaluación, con las preguntas, lo que respondió el empleado
 * y el resultado.
 */

export type TrainingEvaluationAnswer = {
  question: string;
  answer: string;
  correct_answer: string | null;
  is_correct: boolean | null;
};

export type TrainingEvaluationData = {
  employee_full_name: string;
  employee_document: string | null;
  training_title: string;
  completed_at: string | null;
  attempt_number: number;
  score: number | null;
  max_score: number;
  passed: boolean | null;
  passing_score: number;
  answers: TrainingEvaluationAnswer[];
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1pt solid black',
    paddingBottom: 6,
    marginBottom: 10,
  },
  logo: { width: 140, height: 40, objectFit: 'contain' },
  docTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  meta: { border: '0.5pt solid #999', padding: 6, marginBottom: 10 },
  metaRow: { flexDirection: 'row', marginBottom: 2 },
  metaLabel: { width: '30%', fontFamily: 'Helvetica-Bold' },
  question: { marginBottom: 8, paddingBottom: 6, borderBottom: '0.5pt solid #ddd' },
  questionText: { fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  answerRow: { flexDirection: 'row', marginTop: 1 },
  answerLabel: { width: '22%', color: '#555' },
  correct: { color: '#15803d' },
  wrong: { color: '#b91c1c' },
  resultBox: { marginTop: 12, border: '0.5pt solid #999', padding: 8 },
  resultLine: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  pageNumber: { position: 'absolute', bottom: 14, right: 32, fontSize: 8, color: '#444' },
});

function formatDate(value: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function TrainingEvaluationLayout({
  data,
  logoUrl,
}: {
  data: TrainingEvaluationData;
  logoUrl?: string | null;
}) {
  return (
    <Document title={`Evaluación — ${data.training_title} — ${data.employee_full_name}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : <Text> </Text>}
          <Text style={styles.docTitle}>EVALUACIÓN DE CAPACITACIÓN</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Empleado</Text>
            <Text>
              {data.employee_full_name}
              {data.employee_document ? ` — ${data.employee_document}` : ''}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Capacitación</Text>
            <Text>{data.training_title}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text>{formatDate(data.completed_at)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Intento</Text>
            <Text>{data.attempt_number}</Text>
          </View>
        </View>

        {data.answers.map((answer, index) => (
          <View key={index} style={styles.question} wrap={false}>
            <Text style={styles.questionText}>
              {index + 1}. {answer.question}
            </Text>
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Respuesta:</Text>
              <Text style={answer.is_correct === null ? undefined : answer.is_correct ? styles.correct : styles.wrong}>
                {answer.answer || '(sin responder)'}
              </Text>
            </View>
            {answer.is_correct === false && answer.correct_answer && (
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Correcta:</Text>
                <Text style={styles.correct}>{answer.correct_answer}</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.resultBox}>
          <Text style={styles.resultLine}>
            Resultado: {data.score ?? 0}/{data.max_score} – {data.passed ? 'Aprobado' : 'Desaprobado'}
          </Text>
          <Text style={{ marginTop: 3, color: '#555' }}>Puntaje mínimo para aprobar: {data.passing_score}</Text>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
