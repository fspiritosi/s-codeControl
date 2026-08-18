'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { torque_sheet_format } from '@/generated/prisma/client';
import { checkLabel, formatTorqueRange, TORQUE_CHECK_ITEMS, type TorqueCheckKey } from '../../shared/torque-spec';

/**
 * Certificado de torqueo (tsk-575). Reproduce el checklist en papel que hoy
 * llena la empresa a mano, tal cual, para que el formulario de carga y la
 * pantalla de reimpresión generen exactamente el mismo documento.
 *
 * Es una sola plantilla parametrizada: las dos hojas del papel (vehículos
 * chicos / colectivos) difieren solo en las fotos que se reciben por props
 * (`diagramUrl`, `vehiclePhotosUrl`) y en la tabla de torques (`specs`), no en
 * la estructura. Ambas imágenes, más el logo, son opcionales: si no vienen
 * (todavía no están los archivos definitivos) la sección se omite sin dejar
 * un hueco raro.
 */

/** Uno de los 15 ítems del checklist, con el valor cargado en el certificado. */
export type TorquePdfCheckItem = {
  key: TorqueCheckKey;
  value: boolean;
  observations?: string | null;
};

/** Fila de la tabla de referencia de torques (torque_specs) de la marca elegida. */
export type TorquePdfSpecRow = {
  configuration: string;
  nm_min: number;
  nm_max: number;
  ftlb_min: number | null;
  ftlb_max: number | null;
};

export type TorqueCertificatePdfData = {
  /** Número completo del certificado (ej: "TQ-00001"), para rastrear el papel hasta su registro. */
  fullNumber: string;
  /**
   * Formato de la hoja (LIGHT/BUS). Todavía no se usa en el layout: es la
   * costura para cuando lleguen los juegos de fotos/diagramas propios de cada
   * formato y haya que elegir cuál mostrar.
   */
  sheetFormat: torque_sheet_format;
  /** Fecha en formato ISO (YYYY-MM-DD); se formatea acá a DD/MM/YYYY. */
  date: string;
  driverName: string;
  mechanicName: string;
  /** Snapshot del vehículo al momento de emitir el certificado (no se resuelve por relación). */
  vehicleBrandName: string | null;
  vehicleDomain: string | null;
  vehicleInternNumber: string | null;
  place: string;
  toolType: string;
  calibrationDi: string | null;
  calibrationDd: string | null;
  calibrationTd: string | null;
  calibrationTi: string | null;
  checks: TorquePdfCheckItem[];
  requiredTorque: string;
  meetsRequirement: boolean;
  toleranceRangeNm: string | null;
  boltCondition: 'DRY' | 'LUBRICATED';
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 8, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1pt solid black',
    paddingBottom: 6,
    marginBottom: 6,
  },
  logo: { width: 130, height: 38, objectFit: 'contain' },
  docTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  docNumber: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right', marginTop: 2 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#eeeeee',
    padding: 3,
    marginTop: 8,
    marginBottom: 3,
  },
  box: { border: '0.5pt solid #999' },
  row: { flexDirection: 'row', borderBottom: '0.5pt solid #999' },
  cell: { padding: 3, borderRight: '0.5pt solid #999' },
  label: { fontFamily: 'Helvetica-Bold' },
  caption: { fontSize: 6, color: '#555', textAlign: 'center', marginTop: 3 },
  table: { border: '0.5pt solid #999' },
  th: {
    flexDirection: 'row',
    backgroundColor: '#eeeeee',
    borderBottom: '0.5pt solid #999',
    fontFamily: 'Helvetica-Bold',
  },
  checkbox: {
    width: 7,
    height: 7,
    border: '0.5pt solid black',
    marginRight: 3,
    textAlign: 'center',
    fontSize: 6,
    lineHeight: 1.1,
  },
  inlineCheck: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  diagram: { width: '100%', height: 140, objectFit: 'contain', marginBottom: 4 },
  photos: { width: 130, height: 130, objectFit: 'contain', marginLeft: 6 },
  bullet: { flexDirection: 'row', marginTop: 1 },
  signatureBox: { marginTop: 24, alignItems: 'flex-end' },
  signatureLine: { width: 170, borderTop: '0.5pt solid black', paddingTop: 2 },
  signatureLabel: { textAlign: 'center' },
});

/** Casilla SI/NO: marca con "X" si `checked` es true. */
function Mark({ checked, width }: { checked: boolean; width: string }) {
  return (
    <View style={[styles.cell, { width, alignItems: 'center', justifyContent: 'center' }]}>
      <Text>{checked ? 'X' : ''}</Text>
    </View>
  );
}

/** Casilla inline con etiqueta, del estilo "☐ Seco  ☐ Lubricado". */
function InlineCheck({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={styles.inlineCheck}>
      <Text style={styles.checkbox}>{checked ? 'X' : ''}</Text>
      <Text>{label}</Text>
    </View>
  );
}

function formatDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function TorqueCertificateLayout({
  data,
  specs,
  logoUrl,
  diagramUrl,
  vehiclePhotosUrl,
}: {
  data: TorqueCertificatePdfData;
  /** Specs de la marca del vehículo, ya filtradas/ordenadas por el caller. */
  specs: TorquePdfSpecRow[];
  logoUrl?: string | null;
  /** Imagen del diagrama de secuencia de apriete. Opcional: todavía no hay archivo definitivo. */
  diagramUrl?: string | null;
  /** Fotos del vehículo que acompañan la tabla de la sección 4. Opcional. */
  vehiclePhotosUrl?: string | null;
}) {
  const checksByKey = new Map(data.checks.map((c) => [c.key, c]));

  const previousItems = TORQUE_CHECK_ITEMS.filter((i) => i.group === 'previous');
  const torqueItems = TORQUE_CHECK_ITEMS.filter((i) => i.group === 'tightening' && i.key.startsWith('torque_'));
  const wheelIndicatorItems = TORQUE_CHECK_ITEMS.filter(
    (i) => i.group === 'tightening' && i.key.startsWith('ind_rueda_')
  );

  return (
    <Document title={`Checklist de torqueo — ${data.vehicleDomain ?? data.vehicleInternNumber ?? ''}`}>
      <Page size="A4" style={styles.page}>
        {/* Encabezado: logo de la empresa (opcional) + título + número de certificado */}
        <View style={styles.header}>
          {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : <Text> </Text>}
          <View>
            <Text style={styles.docTitle}>CHECKLIST DE TORQUEO</Text>
            <Text style={styles.docNumber}>{data.fullNumber}</Text>
          </View>
        </View>

        {/* 1. Datos Generales */}
        <Text style={styles.sectionTitle}>1. Datos Generales</Text>
        <View style={styles.box}>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '34%' }]}>
              <Text>
                <Text style={styles.label}>Fecha: </Text>
                {formatDate(data.date)}
              </Text>
            </View>
            <View style={[styles.cell, { width: '33%' }]}>
              <Text>
                <Text style={styles.label}>Conductor: </Text>
                {data.driverName}
              </Text>
            </View>
            <View style={[styles.cell, { width: '33%', borderRight: 'none' }]}>
              <Text>
                <Text style={styles.label}>Mecánico: </Text>
                {data.mechanicName}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, { width: '34%' }]}>
              <Text>
                <Text style={styles.label}>Vehículo: </Text>
                {data.vehicleBrandName ?? ''}
              </Text>
            </View>
            <View style={[styles.cell, { width: '33%' }]}>
              <Text>
                <Text style={styles.label}>Patente: </Text>
                {data.vehicleDomain ?? ''}
              </Text>
            </View>
            <View style={[styles.cell, { width: '33%', borderRight: 'none' }]}>
              <Text>
                <Text style={styles.label}>N° Interno: </Text>
                {data.vehicleInternNumber ?? ''}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, { width: '34%' }]}>
              <Text>
                <Text style={styles.label}>Lugar: </Text>
                {data.place}
              </Text>
            </View>
            <View style={[styles.cell, { width: '66%', borderRight: 'none' }]}>
              <Text>
                <Text style={styles.label}>Herramienta de Torque (tipo/Modelo): </Text>
                {data.toolType}
              </Text>
            </View>
          </View>

          <View style={[styles.row, { borderBottom: 'none' }]}>
            <View style={[styles.cell, { width: '100%', borderRight: 'none' }]}>
              <Text>
                <Text style={styles.label}>Calibración Vigente — </Text>
                <Text style={styles.label}>DI: </Text>
                {data.calibrationDi ?? ''}
                {'   '}
                <Text style={styles.label}>DD: </Text>
                {data.calibrationDd ?? ''}
                {'   '}
                <Text style={styles.label}>TD: </Text>
                {data.calibrationTd ?? ''}
                {'   '}
                <Text style={styles.label}>TI: </Text>
                {data.calibrationTi ?? ''}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.caption}>
          DI (Delantera Izquierda) - DD (Delantera Derecha) – TI (Trasera Izquierda) - TD (Trasera Derecha)
        </Text>

        {/* 2. Verificación Previas */}
        <Text style={styles.sectionTitle}>2. Verificación Previas</Text>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.cell, { width: '46%' }]}>Ítem</Text>
            <Text style={[styles.cell, { width: '9%', textAlign: 'center' }]}>SI</Text>
            <Text style={[styles.cell, { width: '9%', textAlign: 'center' }]}>NO</Text>
            <Text style={[styles.cell, { width: '36%', borderRight: 'none' }]}>Observaciones</Text>
          </View>
          {previousItems.map((item) => {
            const check = checksByKey.get(item.key);
            return (
              <View key={item.key} style={styles.row}>
                <Text style={[styles.cell, { width: '46%' }]}>{checkLabel(item.key)}</Text>
                <Mark checked={check?.value === true} width="9%" />
                <Mark checked={check?.value === false} width="9%" />
                <Text style={[styles.cell, { width: '36%', borderRight: 'none' }]}>{check?.observations ?? ''}</Text>
              </View>
            );
          })}
        </View>

        {/* 3. Especificaciones de Torque */}
        <Text style={styles.sectionTitle}>3. Especificaciones de Torque</Text>
        <View style={styles.box}>
          <View style={[styles.row, { alignItems: 'center', padding: 3 }]}>
            <Text>
              <Text style={styles.label}>Torque requerido: </Text>
              {data.requiredTorque}
            </Text>
            <View style={styles.inlineCheck}>
              <Text style={styles.label}>Cumple: </Text>
            </View>
            <InlineCheck checked={data.meetsRequirement === true} label="SI" />
            <InlineCheck checked={data.meetsRequirement === false} label="NO" />
          </View>
          <View style={[styles.row, { padding: 3 }]}>
            <Text>
              <Text style={styles.label}>Rango de tolerancia: </Text>
              {data.toleranceRangeNm ?? ''} Nm
            </Text>
          </View>
          <View style={[styles.row, { alignItems: 'center', padding: 3, borderBottom: 'none' }]}>
            <Text style={styles.label}>Condiciones de perno y/o tuerca:</Text>
            <InlineCheck checked={data.boltCondition === 'DRY'} label="Seco" />
            <InlineCheck checked={data.boltCondition === 'LUBRICATED'} label="Lubricado" />
          </View>
        </View>

        {/* 4. Secuencia de apriete */}
        <Text style={styles.sectionTitle}>4. Secuencia de apriete</Text>
        {diagramUrl ? <Image style={styles.diagram} src={diagramUrl} /> : null}
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.table, { flexGrow: 1 }]}>
            <View style={styles.th}>
              <Text style={[styles.cell, { width: '32%' }]}>Torque</Text>
              <Text style={[styles.cell, { width: '9%', textAlign: 'center' }]}>SI</Text>
              <Text style={[styles.cell, { width: '9%', textAlign: 'center' }]}>NO</Text>
              <Text style={[styles.cell, { width: '32%' }]}>Ind. rueda</Text>
              <Text style={[styles.cell, { width: '9%', textAlign: 'center' }]}>SI</Text>
              <Text style={[styles.cell, { width: '9%', textAlign: 'center', borderRight: 'none' }]}>NO</Text>
            </View>
            {torqueItems.map((torqueItem, i) => {
              const wheelItem = wheelIndicatorItems[i];
              const torqueCheck = checksByKey.get(torqueItem.key);
              const wheelCheck = wheelItem ? checksByKey.get(wheelItem.key) : undefined;
              return (
                <View key={torqueItem.key} style={styles.row}>
                  <Text style={[styles.cell, { width: '32%' }]}>{checkLabel(torqueItem.key)}</Text>
                  <Mark checked={torqueCheck?.value === true} width="9%" />
                  <Mark checked={torqueCheck?.value === false} width="9%" />
                  <Text style={[styles.cell, { width: '32%' }]}>{wheelItem ? checkLabel(wheelItem.key) : ''}</Text>
                  <Mark checked={wheelCheck?.value === true} width="9%" />
                  <Mark checked={wheelCheck?.value === false} width="9%" />
                </View>
              );
            })}
          </View>
          {vehiclePhotosUrl ? <Image style={styles.photos} src={vehiclePhotosUrl} /> : null}
        </View>

        {/* 5. Secuencias de apriete (tabla de referencia por marca) */}
        <Text style={styles.sectionTitle}>5. Secuencias de apriete</Text>
        <Text>
          <Text style={styles.label}>{data.vehicleBrandName ?? ''}: </Text>
          El torque de apriete recomendado es de:
        </Text>
        <View style={{ marginTop: 2 }}>
          {specs.map((spec) => (
            <View key={spec.configuration} style={styles.bullet}>
              <Text>{'• '}</Text>
              <Text>
                {spec.configuration}: {formatTorqueRange(spec)}
              </Text>
            </View>
          ))}
        </View>

        {/* Firma del mecánico: va en blanco, se firma a mano sobre el papel impreso. */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Firma mecánico</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
