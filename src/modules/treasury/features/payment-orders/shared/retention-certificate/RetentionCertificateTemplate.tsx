import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { RetentionCertificatePDFData } from './types';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 12,
    marginBottom: 12,
  },
  companyBlock: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  logo: { width: 56, height: 56, objectFit: 'contain' },
  companyName: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  companyInfo: { fontSize: 8, color: '#555', marginTop: 2 },
  certBlock: { alignItems: 'flex-end', minWidth: 200 },
  certTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  certNumber: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  certMeta: { fontSize: 9, color: '#444', marginTop: 1 },

  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: 4,
    marginTop: 12,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: '35%', color: '#555', fontSize: 9 },
  value: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold' },

  amountsBox: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: { fontSize: 10, color: '#555' },
  amountValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  amountTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTop: 1,
    borderTopColor: '#0f172a',
  },
  amountTotalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  amountTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  inWords: { marginTop: 8, fontSize: 9, fontStyle: 'italic', color: '#444' },

  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 200,
    alignItems: 'center',
    borderTop: 1,
    borderTopColor: '#0f172a',
    paddingTop: 4,
  },
  signatureImage: {
    width: 130,
    height: 50,
    objectFit: 'contain',
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#777',
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
  },
});

const SCOPE_LABEL = {
  NATIONAL: 'Nacional',
  PROVINCIAL: 'Provincial',
  MUNICIPAL: 'Municipal',
} as const;

const BASE_LABEL = {
  NET: 'Neto gravado',
  TOTAL: 'Total',
  VAT: 'IVA',
} as const;

function fmtAmount(n: number) {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | string) {
  return format(new Date(d), 'dd/MM/yyyy', { locale: es });
}

export function RetentionCertificateTemplate({ data }: { data: RetentionCertificatePDFData }) {
  const { company, certificate, taxType, paymentOrder, retainee, baseAmount, rate, amount, amountInWords, notes, pdfSettings } = data;

  const headerText = pdfSettings?.headerText?.trim() || '';
  const footerText = pdfSettings?.footerText?.trim() || '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {headerText ? (
          <Text style={{ fontSize: 8, color: '#777', textAlign: 'center', marginBottom: 6 }}>
            {headerText}
          </Text>
        ) : null}

        <View style={styles.header}>
          <View style={styles.companyBlock}>
            {company.logo ? <Image src={company.logo} style={styles.logo} /> : null}
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              {company.cuit ? (
                <Text style={styles.companyInfo}>CUIT: {company.cuit}</Text>
              ) : null}
              {company.address ? (
                <Text style={styles.companyInfo}>{company.address}</Text>
              ) : null}
              {company.email ? (
                <Text style={styles.companyInfo}>{company.email}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.certBlock}>
            <Text style={styles.certTitle}>COMPROBANTE DE RETENCIÓN</Text>
            <Text style={styles.certNumber}>N° {certificate.number}</Text>
            <Text style={styles.certMeta}>Emitido: {fmtDate(certificate.issueDate)}</Text>
            <Text style={styles.certMeta}>Período: {certificate.period}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sujeto retenido</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Razón social</Text>
          <Text style={styles.value}>{retainee.businessName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CUIT</Text>
          <Text style={styles.value}>{retainee.taxId}</Text>
        </View>
        {retainee.address ? (
          <View style={styles.row}>
            <Text style={styles.label}>Domicilio</Text>
            <Text style={styles.value}>{retainee.address}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Datos del régimen</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Régimen</Text>
          <Text style={styles.value}>
            {taxType.name} ({taxType.code})
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Alcance</Text>
          <Text style={styles.value}>
            {SCOPE_LABEL[taxType.scope]}
            {taxType.jurisdiction ? ` — ${taxType.jurisdiction}` : ''}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Base de cálculo</Text>
          <Text style={styles.value}>{BASE_LABEL[taxType.calculationBase]}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Comprobante origen</Text>
          <Text style={styles.value}>
            Orden de pago {paymentOrder.fullNumber} · {fmtDate(paymentOrder.date)}
          </Text>
        </View>

        <View style={styles.amountsBox}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Base imponible</Text>
            <Text style={styles.amountValue}>{fmtAmount(baseAmount)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Alícuota aplicada</Text>
            <Text style={styles.amountValue}>{rate}%</Text>
          </View>
          <View style={styles.amountTotal}>
            <Text style={styles.amountTotalLabel}>Importe retenido</Text>
            <Text style={styles.amountTotalValue}>{fmtAmount(amount)}</Text>
          </View>
          <Text style={styles.inWords}>Son: {amountInWords}</Text>
        </View>

        {notes ? (
          <>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={{ fontSize: 9 }}>{notes}</Text>
          </>
        ) : null}

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            {pdfSettings?.signatureUrl ? (
              <Image src={pdfSettings.signatureUrl} style={styles.signatureImage} />
            ) : null}
            <Text>Firma del agente de retención</Text>
          </View>
        </View>

        {footerText ? (
          <Text style={styles.footer} fixed>
            {footerText}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}
