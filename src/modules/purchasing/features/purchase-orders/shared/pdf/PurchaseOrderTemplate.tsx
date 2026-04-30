/**
 * Template de PDF de Orden de Compra
 * SERVER-ONLY: se usa dentro de renderToBuffer(). No importar en componentes client.
 */

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from './styles';
import type { PurchaseOrderPDFData } from './types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LinkedDocumentsSection } from '@/shared/components/pdf/LinkedDocumentsSection';

const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente de aprobacion',
  APPROVED: 'Aprobada',
  PARTIALLY_RECEIVED: 'Recibida parcialmente',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

function formatAmount(value: number): string {
  return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface PurchaseOrderTemplateProps {
  data: PurchaseOrderPDFData;
}

export function PurchaseOrderTemplate({ data }: PurchaseOrderTemplateProps) {
  const {
    company,
    purchaseOrder,
    supplier,
    lines,
    subtotal,
    vatAmount,
    total,
    installments,
    paymentConditions,
    deliveryAddress,
    deliveryNotes,
    notes,
    linkedDocuments,
    pdfSettings,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER PERSONALIZADO (Configuración » PDF) */}
        {pdfSettings?.headerText ? (
          <Text
            style={{
              fontSize: 8,
              color: '#444',
              marginBottom: 8,
              textAlign: 'center',
              borderBottom: 1,
              borderBottomColor: '#ddd',
              paddingBottom: 4,
            }}
          >
            {pdfSettings.headerText}
          </Text>
        ) : null}

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
            <Text style={styles.title}>ORDEN DE COMPRA</Text>
            <Text style={styles.orderNumber}>
              N{'\u00B0'} {purchaseOrder.fullNumber}
            </Text>
            <Text style={styles.orderDate}>
              Fecha: {formatDate(purchaseOrder.issueDate)}
            </Text>
            <Text style={styles.orderStatus}>
              {PO_STATUS_LABELS[purchaseOrder.status] || purchaseOrder.status}
            </Text>
          </View>
        </View>

        {/* DATOS DEL PROVEEDOR */}
        <View>
          <Text style={styles.sectionTitle}>PROVEEDOR</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Razon Social:</Text>
            <Text style={styles.infoValue}>{supplier.businessName}</Text>
          </View>
          {supplier.tradeName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre Comercial:</Text>
              <Text style={styles.infoValue}>{supplier.tradeName}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CUIT:</Text>
            <Text style={styles.infoValue}>{supplier.taxId}</Text>
          </View>
          {supplier.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Domicilio:</Text>
              <Text style={styles.infoValue}>{supplier.address}</Text>
            </View>
          )}
          {supplier.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefono:</Text>
              <Text style={styles.infoValue}>{supplier.phone}</Text>
            </View>
          )}
          {supplier.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{supplier.email}</Text>
            </View>
          )}
        </View>

        {/* ENTREGA */}
        {(purchaseOrder.expectedDeliveryDate || deliveryAddress) && (
          <View>
            <Text style={styles.sectionTitle}>ENTREGA</Text>
            {purchaseOrder.expectedDeliveryDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha Esperada:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(purchaseOrder.expectedDeliveryDate)}
                </Text>
              </View>
            )}
            {deliveryAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Direccion de Entrega:</Text>
                <Text style={styles.infoValue}>{deliveryAddress}</Text>
              </View>
            )}
          </View>
        )}

        {/* LINEAS DE PRODUCTOS */}
        <View>
          <Text style={styles.sectionTitle}>DETALLE</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colCode}>Codigo</Text>
              <Text style={styles.colDesc}>Descripcion</Text>
              <Text style={styles.colQty}>Cant.</Text>
              <Text style={styles.colUnit}>Costo Unit.</Text>
              <Text style={styles.colVat}>IVA %</Text>
              <Text style={styles.colSubtotal}>Subtotal</Text>
              <Text style={styles.colTotal}>Total</Text>
            </View>

            {lines.map((line, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colCode}>
                  {line.productCode || '-'}
                </Text>
                <Text style={styles.colDesc}>{line.description}</Text>
                <Text style={styles.colQty}>{line.quantity}</Text>
                <Text style={styles.colUnit}>
                  {formatAmount(line.unitCost)}
                </Text>
                <Text style={styles.colVat}>{line.vatRate}%</Text>
                <Text style={styles.colSubtotal}>
                  {formatAmount(line.subtotal)}
                </Text>
                <Text style={styles.colTotal}>
                  {formatAmount(line.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* TOTALES */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA:</Text>
            <Text style={styles.totalValue}>{formatAmount(vatAmount)}</Text>
          </View>
        </View>

        <View style={styles.grandTotal}>
          <Text>TOTAL:</Text>
          <Text>{formatAmount(total)}</Text>
        </View>

        {/* CUOTAS / ENTREGAS */}
        {installments && installments.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>CUOTAS / ENTREGAS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colQty}>N{'\u00B0'}</Text>
                <Text style={styles.colDesc}>Fecha de Vencimiento</Text>
                <Text style={styles.colTotal}>Monto</Text>
                <Text style={styles.colDesc}>Notas</Text>
              </View>
              {installments.map((inst, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.colQty}>{inst.number}</Text>
                  <Text style={styles.colDesc}>
                    {formatDate(inst.dueDate)}
                  </Text>
                  <Text style={styles.colTotal}>
                    {formatAmount(inst.amount)}
                  </Text>
                  <Text style={styles.colDesc}>{inst.notes || ''}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CONDICIONES */}
        {(paymentConditions || deliveryNotes) && (
          <View style={styles.conditions}>
            <Text style={styles.conditionsTitle}>CONDICIONES</Text>
            {paymentConditions && (
              <Text style={styles.conditionsText}>
                Condiciones de Pago: {paymentConditions}
              </Text>
            )}
            {deliveryNotes && (
              <Text style={styles.conditionsText}>
                Notas de Entrega: {deliveryNotes}
              </Text>
            )}
          </View>
        )}

        {/* OBSERVACIONES */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>OBSERVACIONES</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* DOCUMENTOS VINCULADOS (opcional) */}
        {linkedDocuments && linkedDocuments.sections.length > 0 && (
          <LinkedDocumentsSection data={linkedDocuments} />
        )}

        {/* FIRMA (si esta empresa firma este tipo de PDF) */}
        {pdfSettings?.signatureUrl ? (
          <View style={{ marginTop: 30, alignItems: 'flex-end' }}>
            <Image
              src={pdfSettings.signatureUrl}
              style={{ width: 140, height: 60, objectFit: 'contain' }}
            />
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>Firma autorizada</Text>
          </View>
        ) : null}

        {/* FOOTER */}
        <View style={styles.footer}>
          {pdfSettings?.footerText ? (
            <Text style={{ marginBottom: 2 }}>{pdfSettings.footerText}</Text>
          ) : null}
          <Text>
            Documento generado electronicamente -{' '}
            {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
