'use client';

import { Image, Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

interface VehicleInspectionLayoutProps {
  title: string;
  subtitle: string;
  data: {
    fecha?: string;
    conductor?: string;
    interno?: string;
    dominio?: string;
    kilometraje?: string;
    hora?: string;
    luces?: Record<string, string>;
    seguridad?: Record<string, string>;
    interior?: Record<string, string>;
    mecanica?: Record<string, string>;
    observaciones?: string;
  };
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  border: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    border: '1pt solid black',
  },
  contentWrapper: {
    position: 'relative',
    height: '100%',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1pt solid black',
    backgroundColor: 'white',
  },
  headerLeft: {
    width: '30%',
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: 'contain',
  },
  headerRight: {
    width: '70%',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  headerSubText: {
    fontSize: 8,
    textAlign: 'right',
    marginBottom: 2,
  },
  content: {
    height: '100%',
  },
  infoGrid: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    minHeight: 25,
    padding: 4,
  },
  infoLabel: {
    width: '30%',
    fontWeight: 'bold',
    paddingLeft: 4,
  },
  infoValue: {
    width: '70%',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#e6e6e6',
    padding: 5,
    marginBottom: 10,
    textAlign: 'center',
    borderBottom: '1pt solid black',
  },
  itemRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    minHeight: 25,
    padding: 4,
  },
  itemLabel: {
    width: '60%',
    borderRight: '1pt solid #000',
    padding: 4,
  },
  itemResult: {
    width: '40%',
    textAlign: 'center',
    padding: 4,
  },
  observaciones: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  observacionesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    backgroundColor: '#e6e6e6',
    padding: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  signature: {
    width: '100%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
  },
});

export const VehicleInspectionLayout = ({ title, subtitle, data, logoUrl }: VehicleInspectionLayoutProps) => {
  const renderSection = (title: string, items?: Record<string, string>) => {

    console.log(items,'items');
    if (!items) return null;
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Object.entries(items).map(([key, value], index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{key}</Text>
            <Text style={styles.itemResult}>{value === 'true' ? 'SI' : value === 'false' ? 'NO' : value || '-'}</Text>
          </View>
        ))}
      </View>
    );
  };

  console.log(data,'data');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border} fixed />
        <View style={styles.contentWrapper}>
          <View style={styles.header} fixed>
            <View style={styles.headerLeft}>
              {logoUrl && (
                <Image style={styles.logo} src={logoUrl} />
              )}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerText}>{title}</Text>
              <Text style={styles.headerSubText}>Hoja 1 de 1</Text>
              <Text style={styles.headerSubText}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha:</Text>
                <Text style={styles.infoValue}>{data.fecha || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hora:</Text>
                <Text style={styles.infoValue}>{data.hora || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Conductor:</Text>
                <Text style={styles.infoValue}>{data.conductor || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Interno:</Text>
                <Text style={styles.infoValue}>{data.interno || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dominio:</Text>
                <Text style={styles.infoValue}>{data.dominio || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kilometraje:</Text>
                <Text style={styles.infoValue}>{data.kilometraje || ''}</Text>
              </View>
            </View>

            {renderSection('LUCES', data.luces)}
            {renderSection('SEGURIDAD', data.seguridad)}
            {renderSection('INTERIOR', data.interior)}
            {renderSection('MECÁNICA', data.mecanica)}

            {data.observaciones && (
              <View style={styles.observaciones}>
                <Text style={styles.observacionesTitle}>OBSERVACIONES:</Text>
                <Text>{data.observaciones}</Text>
              </View>
            )}

            <View style={styles.footer}>
              <View style={styles.signature}>
                <View style={styles.signatureLine} />
                <Text>Firma del Conductor</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
