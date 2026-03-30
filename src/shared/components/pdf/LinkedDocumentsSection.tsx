/**
 * Componente @react-pdf para renderizar documentos vinculados dentro de un PDF.
 * SERVER-ONLY: se usa dentro de templates que se renderizan con renderToBuffer().
 * No importar en componentes client.
 */

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { LinkedDocumentsData } from './linked-documents-types';

const ldStyles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  mainTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    paddingBottom: 3,
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    paddingVertical: 3,
  },
  colLabel: {
    flex: 2,
    fontSize: 8,
  },
  colDate: {
    width: '18%',
    fontSize: 8,
    textAlign: 'center' as const,
  },
  colAmount: {
    width: '20%',
    fontSize: 8,
    textAlign: 'right' as const,
  },
  colStatus: {
    width: '15%',
    fontSize: 8,
    textAlign: 'center' as const,
  },
  headerText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#555',
  },
});

interface Props {
  data: LinkedDocumentsData;
}

export function LinkedDocumentsSection({ data }: Props) {
  if (data.sections.length === 0) return null;

  return (
    <View style={ldStyles.container}>
      <Text style={ldStyles.mainTitle}>DOCUMENTOS VINCULADOS</Text>

      {data.sections.map((section, sIdx) => (
        <View key={sIdx} style={ldStyles.section}>
          <Text style={ldStyles.sectionTitle}>{section.title}</Text>

          {/* Header */}
          <View style={ldStyles.tableHeader}>
            <View style={ldStyles.colLabel}>
              <Text style={ldStyles.headerText}>
                {section.columns[0] || 'Documento'}
              </Text>
            </View>
            {section.columns[1] && (
              <View style={ldStyles.colDate}>
                <Text style={ldStyles.headerText}>{section.columns[1]}</Text>
              </View>
            )}
            {section.columns[2] && (
              <View style={ldStyles.colAmount}>
                <Text style={ldStyles.headerText}>{section.columns[2]}</Text>
              </View>
            )}
            {section.columns[3] && (
              <View style={ldStyles.colStatus}>
                <Text style={ldStyles.headerText}>{section.columns[3]}</Text>
              </View>
            )}
          </View>

          {/* Rows */}
          {section.records.map((record, rIdx) => (
            <View key={rIdx} style={ldStyles.tableRow}>
              <Text style={ldStyles.colLabel}>{record.label}</Text>
              {record.date !== undefined && (
                <Text style={ldStyles.colDate}>{record.date}</Text>
              )}
              {record.amount !== undefined && (
                <Text style={ldStyles.colAmount}>{record.amount}</Text>
              )}
              {record.status !== undefined && (
                <Text style={ldStyles.colStatus}>{record.status}</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
