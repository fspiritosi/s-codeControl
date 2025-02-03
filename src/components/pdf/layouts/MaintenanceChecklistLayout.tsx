'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

interface MaintenanceChecklistLayoutProps {
  title: string;
  singurl?: string | null;
  subtitle: string;
  data: {
    fecha?: string;
    dominio?: string;
    kilometraje?: string;
    hora?: string;
    observaciones?: string;
    chofer?: string;
  };
  logoUrl?: string;
  items: Array<{
    title?: boolean;
    label: string;
    result?: string;
    section?: string;
  }>;
}

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 9,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  pageCompact: {
    padding: 25,
    fontSize: 9,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  border: {
    position: 'absolute',
    top: 25,
    left: 25,
    right: 25,
    bottom: 25,
    border: '1pt solid black',
  },
  borderCompact: {
    position: 'absolute',
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    border: '1pt solid black',
  },
  contentWrapper: {
    position: 'relative',
    height: '100%',
    padding: 8,
  },
  contentWrapperCompact: {
    position: 'relative',
    height: '100%',
    padding: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1pt solid black',
    backgroundColor: 'white',
    marginBottom: 5,
  },
  headerLeft: {
    width: '30%',
  },
  headerRight: {
    width: '70%',
    alignItems: 'flex-end',
  },
  logo: {
    marginLeft: 10,
    width: 100,
    height: 45,
    objectFit: 'contain',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 2,
  },
  headerSubText: {
    fontSize: 7,
    textAlign: 'right',
    marginBottom: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  infoGridCompact: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  infoColumn: {
    flex: 1,
    paddingHorizontal: 3,
  },
  infoColumnCompact: {
    flex: 1,
    paddingHorizontal: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 1,
    alignItems: 'center',
  },
  infoRowCompact: {
    flexDirection: 'row',
    marginVertical: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 8,
    marginRight: 2,
  },
  infoValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    marginLeft: 2,
    fontSize: 8,
    minHeight: 10,
  },
  tablesContainer: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
  },
  tablesContainerCompact: {
    flexDirection: 'row',
    gap: 5,
    padding: 5,
  },
  tableColumn: {
    flex: 1,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 3,
  },
  tableCompact: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeaderCompact: {
    backgroundColor: '#f0f0f0',
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  tableHeaderTextCompact: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    minHeight: 14,
    padding: 1,
  },
  tableRowCompact: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    minHeight: 16,
    padding: 1,
  },
  tableCellLeft: {
    flex: 1,
    paddingLeft: 2,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  tableCellLeftCompact: {
    flex: 1,
    paddingLeft: 2,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  tableCellRight: {
    width: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellRightCompact: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 7,
  },
  tableCellTextCompact: {
    fontSize: 7,
  },
  terminology: {
    marginVertical: 3,
    padding: 3,
    backgroundColor: '#f0f0f0',
  },
  terminologyCompact: {
    marginVertical: 3,
    padding: 3,
    backgroundColor: '#f0f0f0',
  },
  terminologyTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  terminologyTitleCompact: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  terminologyOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  terminologyOptionsCompact: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  terminologyText: {
    fontSize: 7,
  },
  terminologyTextCompact: {
    fontSize: 7,
  },
  warning: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningCompact: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 2,
  },
  footer: {
    marginTop: 8,
    padding: 3,
    marginBottom: 70,
  },
  footerCompact: {
    marginTop: 10,
    padding: 5,
  },
  observaciones: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 5,
  },
  observacionesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  observacionesLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginRight: 2,
  },
  observacionesValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    minHeight: 12,
    fontSize: 7,
    textAlign: 'justify',
    lineHeight: 1.2,
  },
  signatureContainer: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    alignItems: 'center',
    width: 150,
    paddingBottom: 8,
  },
  signatureImage: {
    width: 100,
    height: 50,
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 7,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export const MaintenanceChecklistLayout = ({
  title,
  subtitle,
  data,
  logoUrl,
  items,
  singurl,
}: MaintenanceChecklistLayoutProps) => {
  // Separar los items por secciones
  const sections = {
    luces: [] as typeof items,
    interior: [] as typeof items,
    seguridad: [] as typeof items,
    mecanica: [] as typeof items,
  };

  let currentSection = '';

  items.forEach((item) => {
    if (item.title) {
      switch (item.label) {
        case 'LUCES':
          currentSection = 'luces';
          break;
        case 'INTERIOR':
          currentSection = 'interior';
          break;
        case 'SEGURIDAD / ACCESORIOS':
          currentSection = 'seguridad';
          break;
        case 'MECANICA/MOTOR':
          currentSection = 'mecanica';
          break;
      }
    } else if (currentSection) {
      sections[currentSection as keyof typeof sections].push(item);
    }
  });

  const renderTable = (title: string, items: typeof sections.luces) => (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>{title}</Text>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.tableRow}>
          <View style={styles.tableCellLeft}>
            <Text style={styles.tableCellText}>{item.label}</Text>
          </View>
          <View style={styles.tableCellRight}>
            <Text style={styles.tableCellText}>{item.result || ''}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSignature = () => (
    <View style={styles.signatureContainer}>
      {singurl &&!singurl.endsWith('_files/')  ? <Image style={styles.signatureImage} src={singurl} /> : data.chofer ? <Text>Sin firma</Text> : null}
      <Text style={styles.signatureText}>FIRMA DEL CONDUCTOR</Text>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border} fixed />
        <View style={styles.contentWrapper}>
          <View style={styles.header} fixed>
            <View style={styles.headerLeft}>{logoUrl && <Image style={styles.logo} src={logoUrl} />}</View>
            <View style={styles.headerRight}>
              <Text style={styles.headerText}>{title}</Text>
              <Text style={styles.headerSubText}>Hoja 1 de 1</Text>
              <Text style={styles.headerSubText}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha:</Text>
                <Text style={styles.infoValue}>{data?.fecha || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dominio:</Text>
                <Text style={styles.infoValue}>{data?.dominio || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Chofer:</Text>
                <Text style={styles.infoValue}>{data?.chofer || ''}</Text>
              </View>
            </View>

            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kilometraje:</Text>
                <Text style={styles.infoValue}>{data?.kilometraje || ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hora:</Text>
                <Text style={styles.infoValue}>{data?.hora || ''}</Text>
              </View>
            </View>
          </View>

          <View style={styles.terminology}>
            <Text style={styles.terminologyTitle}>TERMINOLOGIA A UTILIZAR</Text>
            <View style={styles.terminologyOptions}>
              <Text style={styles.terminologyText}>1: Faltante</Text>
              <Text style={styles.terminologyText}>2: Roto</Text>
              <Text style={styles.terminologyText}>3: Regular / Dañado</Text>
              <Text style={styles.terminologyText}>4: Rayado</Text>
              <Text style={styles.terminologyText}>5: Golpeado / Abollado</Text>
              <Text style={styles.terminologyText}>6: OK</Text>
            </View>
          </View>

          <Text style={styles.warning}>
            NOTA: Complete según corresponda (1 al 6 o G/R/F) Ampliar en observaciones anomalias.
          </Text>

          <View style={styles.tablesContainer}>
            <View style={styles.tableColumn}>
              {renderTable('LUCES', sections.luces)}
              {renderTable('INTERIOR', sections.interior)}
            </View>
            <View style={styles.tableColumn}>
              {renderTable('SEGURIDAD/ACCESORIOS', sections.seguridad)}
              {renderTable('MECANICA/MOTOR', sections.mecanica)}
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.observacionesRow}>
              <Text style={styles.observacionesLabel}>Observaciones:</Text>
              <Text style={styles.observacionesValue}>{data?.observaciones}</Text>
            </View>
          </View>
          {renderSignature()}
        </View>
      </Page>
    </Document>
  );
};
