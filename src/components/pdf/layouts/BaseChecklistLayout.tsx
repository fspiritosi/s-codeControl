'use client';

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

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
    width: 120,
    height: 50,
    objectFit: 'contain',
  },
  headerRight: {
    width: '70%',
    alignItems: 'flex-end',
    // paddingRight: 10,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    marginTop: 10,
  },
  infoColumn: {
    width: '50%',
    paddingRight: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 25,
    padding: 4,
  },
  infoLabel: {
    fontSize: 10,
  },
  infoValue: {
    flex: 1,
    borderBottom: '1pt solid #000',
    marginLeft: 4,
    paddingBottom: 2,
  },
  terminology: {
    marginBottom: 10,
    marginTop: 0,
    padding: 5,
    backgroundColor: '#f0f0f0',
  },
  terminologyTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  terminologyOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50,
  },
  terminologyText: {
    textAlign: 'center',
  },
  warning: {
    color: 'red',
    fontWeight: 'bold',
    // marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  table: {
    // marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e6e6e6',
    borderBottom: '1pt solid #000',
  },
  tableColumn1: {
    width: '60%',
    padding: 2,
    borderRight: '1pt solid #000',
    fontSize: 9,
  },
  tableColumn2: {
    width: '20%',
    padding: 2,
    borderRight: '1pt solid #000',
    textAlign: 'center',
    fontSize: 9,
  },
  tableColumn3: {
    width: '20%',
    padding: 2,
    textAlign: 'center',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    minHeight: 20,
  },
  footer: {
    margin: 10,
  },
  footerText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 50,
    borderTop: '1pt solid #000',
    width: '50%',
    textAlign: 'center',
    paddingTop: 5,
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
    aspectRatio: 16 / 9,
    marginBottom: 1,
  },
  signatureText: {
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

interface BaseChecklistProps {
  title?: string;
  singurl?: string | null;
  subtitle?: string;
  logoUrl?: string;
  data: {
    fecha?: string;
    conductor?: string;
    interno?: string;
    dominio?: string;
    servicio?: string;
    marca?: string;
    modelo?: string;
    kilometers?: string;
    aptoParaOperar?: 'SI' | 'NO';
    items: {
      label: string;
      result?: string;
      observations?: string;
    }[];
  };
}

export const BaseChecklistLayout = ({
  title = 'CHECK LIST INSPECCION DIARIA',
  subtitle = 'Vigencia: 23-09-2024 REV: 00',
  logoUrl,
  data,
  singurl,
}: BaseChecklistProps) => {
  const itemsPerPage = 30;
  const pages = Math.ceil(data.items.length / itemsPerPage);

  console.log('singurl', singurl);

  const renderSignature = () => (
    <View style={styles.signatureContainer}>
      {singurl && !singurl.endsWith('_files/') ? (
        <Image style={styles.signatureImage} src={singurl} />
      ) : data.conductor ? (
        <Text>Sin firma</Text>
      ) : null}
      <Text style={styles.signatureText}>FIRMA DEL CONDUCTOR</Text>
    </View>
  );

  return (
    <Document>
      {Array.from({ length: pages }).map((_, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.border} fixed />
          <View style={styles.contentWrapper}>
            <View style={styles.header} fixed>
              <View style={styles.headerLeft}>{logoUrl && <Image style={styles.logo} src={logoUrl} />}</View>
              <View style={styles.headerRight}>
                <Text style={styles.headerText}>{title}</Text>
                <Text style={styles.headerSubText}>
                  Hoja {pageIndex + 1} de {pages}
                </Text>
                <Text style={styles.headerSubText}>{subtitle}</Text>
              </View>
            </View>

            <View style={styles.content}>
              {pageIndex === 0 && (
                <>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Interno:</Text>
                        <Text style={styles.infoValue}>{data.interno || ''}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Dominio/patente:</Text>
                        <Text style={styles.infoValue}>{data.dominio || ''}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Kilometraje:</Text>
                        <Text style={styles.infoValue}>{data.kilometers || ''}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nombre del conductor:</Text>
                        <Text style={styles.infoValue}>{data.conductor || ''}</Text>
                      </View>
                    </View>

                    <View style={styles.infoColumn}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Servicio/Proyecto:</Text>
                        <Text style={styles.infoValue}>{data.servicio || ''}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Marca:</Text>
                        <Text style={styles.infoValue}>{data.marca || ''}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Modelo:</Text>
                        <Text style={styles.infoValue}>{data.modelo || ''}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fecha:</Text>
                        <Text style={styles.infoValue}>{data.fecha || ''}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.terminology}>
                    <Text style={styles.terminologyTitle}>TERMINOLOGIA A UTILIZAR PARA EL LLENADO DEL CHECK</Text>
                    <View style={styles.terminologyOptions}>
                      <Text style={styles.terminologyText}>S: SI</Text>
                      <Text style={styles.terminologyText}>N: NO</Text>
                    </View>
                  </View>

                  <Text style={styles.warning}>
                    ES FUNDAMENTAL QUE SE VERIFIQUEN LOS SIGUIENTES PUNTOS ANTES DE INICIAR RECORRIDO.
                  </Text>
                </>
              )}

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableColumn1}>Aspectos de verificar</Text>
                  <Text style={styles.tableColumn2}>RESULTADO SI-NO</Text>
                  <Text style={styles.tableColumn3}>OBSERVACIONES</Text>
                </View>

                {data.items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableColumn1}>{item.label}</Text>
                    <Text style={styles.tableColumn2}>{item.result || ''}</Text>
                    <Text style={styles.tableColumn3}>{item.observations || ''}</Text>
                  </View>
                ))}
              </View>

              {pageIndex === pages - 1 && (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>INDIQUE SI O NO SEGÚN RESULTADO DE VERIFICACION</Text>
                  <Text style={styles.footerText}>
                    APTO PARA OPERAR:{' '}
                    {data.aptoParaOperar ? <Text style={{ fontWeight: 'bold' }}>{data.aptoParaOperar}</Text> : 'SI NO'}
                  </Text>
                </View>
              )}
            </View>
            {renderSignature()}
          </View>
        </Page>
      ))}
    </Document>
  );
};
