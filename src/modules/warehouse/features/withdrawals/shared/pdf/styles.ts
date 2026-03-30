/**
 * Estilos para PDFs de Ordenes de Retiro de Mercaderia (ORM)
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

  // Columnas de la tabla de materiales (sin precio/IVA/total)
  colCode: { width: '15%' },
  colProduct: { width: '35%' },
  colQty: { width: '12%', textAlign: 'center' },
  colUnit: { width: '13%', textAlign: 'center' },
  colNotes: { width: '25%' },

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
});
