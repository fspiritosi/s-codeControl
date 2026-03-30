/**
 * Estilos para PDFs de Ordenes de Compra
 */

import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },

  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#666',
    marginTop: 2,
  },

  headerRight: {
    alignItems: 'flex-end',
  },

  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },

  orderNumber: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },

  orderDate: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },

  orderStatus: {
    fontSize: 8,
    marginTop: 4,
    padding: '2 6',
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },

  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 15,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottom: 1,
    borderBottomColor: '#333',
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  infoLabel: {
    width: 140,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },

  infoValue: {
    flex: 1,
    fontSize: 9,
  },

  table: {
    marginTop: 10,
    marginBottom: 10,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 5,
    fontSize: 8,
  },

  colCode: { width: '12%' },
  colDesc: { width: '26%' },
  colQty: { width: '10%', textAlign: 'center' },
  colUnit: { width: '16%', textAlign: 'right' },
  colVat: { width: '10%', textAlign: 'center' },
  colSubtotal: { width: '13%', textAlign: 'right' },
  colTotal: { width: '13%', textAlign: 'right' },

  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#000',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },

  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
    width: 200,
  },

  totalLabel: {
    width: 100,
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 9,
  },

  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 9,
  },

  conditions: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderLeft: 3,
    borderLeftColor: '#2563eb',
  },

  conditionsTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    fontSize: 9,
  },

  conditionsText: {
    fontSize: 8,
    lineHeight: 1.4,
  },

  notes: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fffbf0',
    borderLeft: 3,
    borderLeftColor: '#f0ad4e',
  },

  notesTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    fontSize: 9,
  },

  notesText: {
    fontSize: 8,
    lineHeight: 1.4,
  },

  footer: {
    marginTop: 30,
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
