'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

interface VehicleInspectionLayoutProps {
  subtitle: string;
  data: {
    fecha?: string;
    conductor?: string;
    interno?: string;
    dominio?: string;
    kilometraje?: string;
    hora?: string;
    observaciones?: string;
  };
  logoUrl?: string;
  singurl?: string | null;
  items: Array<{
    title?: boolean;
    label: string;
    result?: string;
    section?: string;
  }>;
  title: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  border: {
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
    marginLeft: 10,
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
  pageNumber: {
    fontSize: 8,
    textAlign: 'right',
    marginBottom: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  infoColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 9,
    marginRight: 2,
  },
  infoValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    marginLeft: 2,
    fontSize: 9,
    minHeight: 12,
  },
  tablesContainer: {
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
    marginBottom: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
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
  tableCellRight: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 7,
  },
  footer: {
    marginTop: 10,
    padding: 5,
  },
  observacionesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  observacionesLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 2,
  },
  observacionesValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    minHeight: 12,
  },
  signatureContainer: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    alignItems: 'center',
    width: 150,
    paddingBottom: 10,
  },
  signatureImage: {
    width: 120,
    height: 60,
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  terminologyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  terminologyContainer: {
    marginVertical: 5,
    padding: 5,
    backgroundColor: '#f0f0f0',
  },
  terminologyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  terminologyText: {
    fontSize: 8,
    // fontWeight: 'bold',
  },
  noteText: {
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
});

export const VehicleInspectionLayout = ({
  title,
  subtitle,
  data,
  logoUrl,
  items,
  singurl,
}: VehicleInspectionLayoutProps) => {
  const ITEMS_PER_COLUMN = 34;

  // Función para dividir los items en secciones
  const splitItemsInSections = (items: any) => {
    const sections: Array<typeof items> = [];
    let currentSection: typeof items = [];

    items.forEach((item: any) => {
      if (item.title) {
        if (currentSection.length > 0) {
          sections.push([...currentSection]);
        }
        currentSection = [item];
      } else {
        currentSection.push(item);
      }
    });

    if (currentSection.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  // Función para distribuir las secciones en columnas y páginas
  const distributeItemsInPagesAndColumns = () => {
    const sections = splitItemsInSections(items);
    const pages: Array<{ leftItems: typeof items; rightItems: typeof items }> = [];
    let currentPage = { leftItems: [] as typeof items, rightItems: [] as typeof items };
    let currentColumnItems = 0;
    let isLeftColumn = true;

    // Procesar todas las secciones excepto las últimas 3
    for (let i = 0; i < sections.length - 3; i++) {
      const section = sections[i];

      if (currentColumnItems + section.length > ITEMS_PER_COLUMN) {
        if (isLeftColumn) {
          isLeftColumn = false;
          currentColumnItems = 0;
        } else {
          pages.push(currentPage);
          currentPage = { leftItems: [] as typeof items, rightItems: [] as typeof items };
          isLeftColumn = true;
          currentColumnItems = 0;
        }
      }

      if (isLeftColumn) {
        currentPage.leftItems.push(...section);
      } else {
        currentPage.rightItems.push(...section);
      }
      currentColumnItems += section.length;
    }

    // Si hay items en la página actual y no está vacía, la guardamos
    if (currentPage.leftItems.length > 0 || currentPage.rightItems.length > 0) {
      pages.push(currentPage);
    }

    // Crear una nueva página para las últimas 3 secciones
    const lastThreeSections = sections.slice(-3);
    const lastPage = {
      leftItems: [...lastThreeSections[0], ...lastThreeSections[1]],
      rightItems: [...lastThreeSections[2]],
    };
    pages.push(lastPage);

    return pages;
  };

  const pages = distributeItemsInPagesAndColumns();

  const renderHeader = (pageNumber: number, totalPages: number) => (
    <View style={styles.header} fixed>
      <View style={styles.headerLeft}>{logoUrl && <Image style={styles.logo} src={logoUrl} />}</View>
      <View style={styles.headerRight}>
        <Text style={styles.headerText}>{title}</Text>
        <Text style={styles.headerSubText}>{subtitle}</Text>
        <Text style={styles.pageNumber}>
          Página {pageNumber} de {totalPages}
        </Text>
      </View>
    </View>
  );

  const renderInfoGrid = () => (
    <View style={styles.infoGrid}>
      <View style={styles.infoColumn}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha:</Text>
          <Text style={styles.infoValue}>{data?.fecha}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Conductor:</Text>
          <Text style={styles.infoValue}>{data?.conductor}</Text>
        </View>
      </View>
      <View style={styles.infoColumn}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Interno:</Text>
          <Text style={styles.infoValue}>{data?.interno}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dominio:</Text>
          <Text style={styles.infoValue}>{data?.dominio}</Text>
        </View>
      </View>
      <View style={styles.infoColumn}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kilometraje:</Text>
          <Text style={styles.infoValue}>{data?.kilometraje}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hora:</Text>
          <Text style={styles.infoValue}>{data?.hora}</Text>
        </View>
      </View>
    </View>
  );

  const renderTerminology = () => (
    <View style={styles.terminologyContainer}>
      <Text style={styles.terminologyTitle}>TERMINOLOGIA A UTILIZAR</Text>
      <View style={styles.terminologyRow}>
        <Text style={styles.terminologyText}>N: Normal</Text>
        <Text style={styles.terminologyText}>R: Reparado</Text>
        <Text style={styles.terminologyText}>NC: No Corresponde</Text>
      </View>
      <Text style={styles.noteText}>
        NOTA: Complete con la inicial según corresponda. Ampliar en observaciones la accion que efectuó si corresponde
      </Text>
    </View>
  );

  const renderTableColumns = (pageItems: { leftItems: typeof items; rightItems: typeof items }) => (
    <View style={styles.tablesContainer}>
      <View style={styles.tableColumn}>
        <View style={styles.table}>
          {pageItems.leftItems.map((item, index) =>
            item.title ? (
              <View key={`title-${index}`} style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>{item.label}</Text>
              </View>
            ) : (
              <View key={`row-${index}`} style={styles.tableRow}>
                <View style={styles.tableCellLeft}>
                  <Text style={styles.tableCellText}>{item.label}</Text>
                </View>
                <View style={styles.tableCellRight}>
                  <Text style={styles.tableCellText}>{item.result}</Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>

      <View style={styles.tableColumn}>
        <View style={styles.table}>
          {pageItems.rightItems.map((item, index) =>
            item.title ? (
              <View key={`title-${index}`} style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>{item.label}</Text>
              </View>
            ) : (
              <View key={`row-${index}`} style={styles.tableRow}>
                <View style={styles.tableCellLeft}>
                  <Text style={styles.tableCellText}>{item.label}</Text>
                </View>
                <View style={styles.tableCellRight}>
                  <Text style={styles.tableCellText}>{item.result}</Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>
    </View>
  );

  console.log( singurl ? 'siiiii' : data.conductor ?'nooooo' : 'nulllll')
  console.log( singurl,'singurl')
  console.log(data.conductor,'conductor')
  const renderSignature = () => (
    <View style={styles.signatureContainer}>
      {singurl && !singurl.endsWith('_files/') ? <Image style={styles.signatureImage} src={singurl} /> : data.conductor ? <Text>Sin firma</Text> : null}
      <Text style={styles.signatureText}>FIRMA DEL CONDUCTOR</Text>
    </View>
  );

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          <View style={styles.border} fixed />
          <View style={styles.contentWrapper}>
            {renderHeader(pageIndex + 1, pages.length)}
            {pageIndex === 0 && renderInfoGrid()}
            {renderTerminology()}
            {renderTableColumns(pageItems)}
            {pageIndex === pages.length - 1 && (
              <>
                <View style={styles.footer}>
                  <View style={styles.observacionesRow}>
                    <Text style={styles.observacionesLabel}>Observaciones:</Text>
                    <Text style={styles.observacionesValue}>{data?.observaciones}</Text>
                  </View>
                </View>
                {renderSignature()}
              </>
            )}
          </View>
        </Page>
      ))}
    </Document>
  );
};
