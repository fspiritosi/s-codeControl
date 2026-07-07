import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrencyARS, formatPercentage } from '@/shared/lib/utils/formatters';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import type { ComposicionDetalle } from '@/modules/costos/shared/types/composicion.types';

export type ComposicionPDFData = {
  company: { name: string; cuit?: string | null };
  customer: { name: string };
  servicio: { nombre: string; descripcion?: string | null; cct_codigo: string; cct_nombre: string };
  detalle: ComposicionDetalle;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#222' },
  header: {
    marginBottom: 14,
    borderBottom: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 10,
  },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  companyInfo: { fontSize: 8, color: '#555', marginTop: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 8 },
  subtitle: { fontSize: 9, color: '#555', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaItem: { fontSize: 8, color: '#333' },
  metaLabel: { fontFamily: 'Helvetica-Bold' },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: 1,
    borderBottomColor: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  rowLabel: { fontSize: 9 },
  rowSub: { fontSize: 8, color: '#64748b' },
  rowValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
  },
  subtotalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
  },
});

/**
 * Devuelve todos los strings de texto que el PDF debe contener. Se usa para
 * testear la composición del documento sin depender del binario renderizado
 * (que va comprimido).
 */
export function composicionPDFStrings(data: ComposicionPDFData): string[] {
  const { company, customer, servicio, detalle } = data;
  const s = detalle.subtotales;
  const strings: string[] = [
    company.name,
    customer.name,
    servicio.nombre,
    `${servicio.cct_codigo} — ${servicio.cct_nombre}`,
    formatPeriodoLabel(detalle.periodo),
    formatCurrencyARS(s.mod),
    formatCurrencyARS(s.ocp),
    formatCurrencyARS(s.equipos),
    formatCurrencyARS(s.combustible),
    formatCurrencyARS(detalle.total_costo_directo),
    formatCurrencyARS(detalle.total_con_margenes),
    formatCurrencyARS(detalle.licencia_ordenanza.monto),
    formatCurrencyARS(detalle.precio_mensual),
  ];
  for (const o of detalle.outputs) {
    strings.push(o.nombre, formatCurrencyARS(o.valor));
  }
  return strings;
}

function CostoRow({ label, sub, valor }: { label: string; sub?: string; valor: number }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Text style={styles.rowValue}>{formatCurrencyARS(valor)}</Text>
    </View>
  );
}

export function ComposicionPDF({ data }: { data: ComposicionPDFData }) {
  const { company, customer, servicio, detalle } = data;
  const m = detalle.margenes;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          {company.cuit ? <Text style={styles.companyInfo}>CUIT: {company.cuit}</Text> : null}
          <Text style={styles.title}>Composición de costos — {formatPeriodoLabel(detalle.periodo)}</Text>
          <Text style={styles.subtitle}>{servicio.nombre}</Text>
          {servicio.descripcion ? <Text style={styles.subtitle}>{servicio.descripcion}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Cliente: </Text>
              {customer.name}
            </Text>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>CCT: </Text>
              {servicio.cct_codigo} — {servicio.cct_nombre}
            </Text>
          </View>
        </View>

        {/* Costo industrial */}
        <Text style={styles.sectionTitle}>Costo industrial</Text>
        <CostoRow label="Mano de obra directa" valor={detalle.subtotales.mod} />
        <CostoRow label="Otros costos de personal" valor={detalle.subtotales.ocp} />
        <CostoRow label="Equipos" valor={detalle.subtotales.equipos} />
        <CostoRow label="Combustible" valor={detalle.subtotales.combustible} />
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Total costo directo</Text>
          <Text style={styles.subtotalLabel}>{formatCurrencyARS(detalle.total_costo_directo)}</Text>
        </View>

        {/* Márgenes */}
        <Text style={styles.sectionTitle}>Costo de la venta (márgenes)</Text>
        <CostoRow label="Impuesto a los débitos y créditos" sub={formatPercentage(m.debcred.pct)} valor={m.debcred.monto} />
        <CostoRow label="Ingresos brutos" sub={formatPercentage(m.iibb.pct)} valor={m.iibb.monto} />
        <CostoRow label="Estructura" sub={formatPercentage(m.estructura.pct)} valor={m.estructura.monto} />
        <CostoRow label="Margen de ganancia" sub={formatPercentage(m.ganancia.pct)} valor={m.ganancia.monto} />
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Total con márgenes</Text>
          <Text style={styles.subtotalLabel}>{formatCurrencyARS(detalle.total_con_margenes)}</Text>
        </View>
        <CostoRow
          label="Licencia comercial (Ordenanza)"
          sub={formatPercentage(detalle.licencia_ordenanza.pct)}
          valor={detalle.licencia_ordenanza.monto}
        />

        {/* Precio */}
        <View style={styles.grandTotal}>
          <Text>Valor mensual del servicio</Text>
          <Text>{formatCurrencyARS(detalle.precio_mensual)}</Text>
        </View>

        {/* Outputs derivados */}
        {detalle.outputs.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Valores derivados</Text>
            {detalle.outputs.map((o) => (
              <CostoRow key={o.tipo_output_id} label={o.nombre} valor={o.valor} />
            ))}
          </>
        ) : null}

        <Text style={styles.footer} fixed>
          Documento generado automáticamente — {company.name}. Precios sujetos a las condiciones comerciales vigentes.
        </Text>
      </Page>
    </Document>
  );
}
