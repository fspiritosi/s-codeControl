/**
 * Template de PDF de Orden de Retiro de Mercaderia (ORM)
 * SERVER-ONLY: se usa dentro de renderToBuffer(). No importar en componentes client.
 */

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from './styles';
import type { WithdrawalOrderPDFData } from './types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const WO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente de aprobacion',
  APPROVED: 'Aprobada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

interface WithdrawalOrderTemplateProps {
  data: WithdrawalOrderPDFData;
}

export function WithdrawalOrderTemplate({ data }: WithdrawalOrderTemplateProps) {
  const {
    company,
    withdrawalOrder,
    warehouse,
    employee,
    vehicle,
    lines,
    notes,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logo ? (
              <Image style={styles.logo} src={company.logo} />
            ) : null}
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              {company.cuit ? (
                <Text style={styles.companyInfo}>CUIT: {company.cuit}</Text>
              ) : null}
              {company.address ? (
                <Text style={styles.companyInfo}>{company.address}</Text>
              ) : null}
              {company.phone ? (
                <Text style={styles.companyInfo}>Tel: {company.phone}</Text>
              ) : null}
              {company.email ? (
                <Text style={styles.companyInfo}>{company.email}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>ORDEN DE RETIRO</Text>
            <Text style={styles.orderNumber}>
              N{'\u00B0'} {withdrawalOrder.fullNumber}
            </Text>
            <Text style={styles.orderDate}>
              Fecha: {formatDate(withdrawalOrder.requestDate)}
            </Text>
            <Text style={styles.orderStatus}>
              {WO_STATUS_LABELS[withdrawalOrder.status] || withdrawalOrder.status}
            </Text>
          </View>
        </View>

        {/* ALMACEN */}
        <View>
          <Text style={styles.sectionTitle}>ALMACEN</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{warehouse.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Codigo:</Text>
            <Text style={styles.infoValue}>{warehouse.code}</Text>
          </View>
        </View>

        {/* EMPLEADO SOLICITANTE */}
        {employee && (
          <View>
            <Text style={styles.sectionTitle}>SOLICITANTE</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>
                {employee.lastName} {employee.firstName}
              </Text>
            </View>
          </View>
        )}

        {/* VEHICULO DESTINO */}
        {vehicle && (
          <View>
            <Text style={styles.sectionTitle}>VEHICULO DESTINO</Text>
            {vehicle.domain ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dominio:</Text>
                <Text style={styles.infoValue}>{vehicle.domain}</Text>
              </View>
            ) : null}
            {vehicle.internNumber ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>N{'\u00B0'} Interno:</Text>
                <Text style={styles.infoValue}>{vehicle.internNumber}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* TABLA DE MATERIALES */}
        <View>
          <Text style={styles.sectionTitle}>MATERIALES A RETIRAR</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colCode}>Codigo</Text>
              <Text style={styles.colProduct}>Producto</Text>
              <Text style={styles.colQty}>Cantidad</Text>
              <Text style={styles.colUnit}>Unidad</Text>
              <Text style={styles.colNotes}>Notas</Text>
            </View>

            {lines.map((line, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colCode}>{line.productCode}</Text>
                <Text style={styles.colProduct}>{line.productName}</Text>
                <Text style={styles.colQty}>{line.quantity}</Text>
                <Text style={styles.colUnit}>{line.unitOfMeasure}</Text>
                <Text style={styles.colNotes}>{line.notes || '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* OBSERVACIONES */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>OBSERVACIONES</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>
            Documento generado electronicamente -{' '}
            {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
