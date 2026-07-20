/**
 * Estilos compartidos para los PDFs del módulo de Ventas (facturas y recibos).
 */

import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111',
  },

  // ---- Header ----
  header: {
    marginBottom: 16,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  companyInfo: {
    fontSize: 8,
    color: '#555',
    marginTop: 2,
  },

  // Cuadro central del tipo de comprobante (A / B)
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
    width: 46,
    paddingVertical: 6,
    marginHorizontal: 8,
  },
  voucherLetter: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  voucherCode: {
    fontSize: 6,
    color: '#555',
    marginTop: 2,
  },

  headerRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  docMeta: {
    fontSize: 8,
    color: '#555',
    marginTop: 2,
  },

  // ---- Secciones ----
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: 1,
    borderBottomColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    width: 130,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
  },

  // ---- Tablas ----
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8,
  },

  // Columnas de líneas de factura
  colIdx: { width: '5%' },
  colDesc: { width: '37%' },
  colQty: { width: '10%', textAlign: 'right' },
  colUnit: { width: '16%', textAlign: 'right' },
  colVat: { width: '10%', textAlign: 'right' },
  colSub: { width: '22%', textAlign: 'right' },
  // Variante cuando NO se discrimina IVA (factura B): la descripción se ensancha
  colDescWide: { width: '47%' },

  // ---- Totales ----
  totalsSection: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    width: 240,
  },
  totalLabel: {
    textAlign: 'right',
    paddingRight: 12,
    fontSize: 9,
    flex: 1,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 9,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 1.5,
    borderColor: '#000',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },

  // ---- CAE ----
  caeSection: {
    marginTop: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  caeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  caeLabel: {
    width: 160,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  caeValue: {
    fontSize: 8,
  },

  // ---- Recibo: columnas ----
  rcInvNum: { width: '35%' },
  rcInvDate: { width: '20%' },
  rcInvTotal: { width: '22%', textAlign: 'right' },
  rcInvApplied: { width: '23%', textAlign: 'right' },

  rcPayMethod: { width: '30%' },
  rcPayDetail: { width: '50%' },
  rcPayAmount: { width: '20%', textAlign: 'right' },

  rcWhType: { width: '28%' },
  rcWhRate: { width: '16%', textAlign: 'right' },
  rcWhCert: { width: '34%' },
  rcWhAmount: { width: '22%', textAlign: 'right' },

  // ---- Observaciones ----
  notes: {
    marginTop: 14,
    padding: 8,
    backgroundColor: '#fffbf0',
    borderLeft: 3,
    borderLeftColor: '#f0ad4e',
  },
  notesTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    fontSize: 9,
  },
  notesText: {
    fontSize: 8,
    lineHeight: 1.4,
  },

  // ---- Footer ----
  footer: {
    marginTop: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
  },

  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  smallText: {
    fontSize: 7,
    color: '#666',
  },
});
