/**
 * Template de PDF de Factura de Venta (también NC/ND).
 * SERVER-ONLY: se usa dentro de renderToBuffer(). No importar en componentes client.
 */

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { SalesInvoicePDFData } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

function formatAmount(value: number): string {
  return `$${value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface InvoiceTemplateProps {
  data: SalesInvoicePDFData;
}

/** Agrupa el IVA de las líneas por alícuota (para discriminar en facturas A). */
function vatByRate(lines: SalesInvoicePDFData['lines']): Array<{ rate: number; amount: number }> {
  const map = new Map<number, number>();
  for (const l of lines) {
    if (l.vatAmount <= 0) continue;
    map.set(l.vatRate, (map.get(l.vatRate) ?? 0) + l.vatAmount);
  }
  return Array.from(map.entries())
    .map(([rate, amount]) => ({ rate, amount }))
    .sort((a, b) => a.rate - b.rate);
}

export function InvoiceTemplate({ data }: InvoiceTemplateProps) {
  const { company, customer, invoice, lines, perceptions, otherCharges, totals, notes } = data;
  const isTypeA = invoice.isTypeA;
  const vatRows = vatByRate(lines);
  const descStyle = isTypeA ? styles.colDesc : styles.colDescWide;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logo ? <Image style={styles.logo} src={company.logo} /> : null}
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

          {/* Cuadro central con la letra del comprobante */}
          <View style={styles.headerCenter}>
            <Text style={styles.voucherLetter}>{invoice.letter}</Text>
            <Text style={styles.voucherCode}>COMP.</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.title}>{invoice.voucherLabel}</Text>
            <Text style={styles.docNumber}>N{'°'} {invoice.fullNumber}</Text>
            <Text style={styles.docMeta}>Fecha: {formatDate(invoice.issueDate)}</Text>
            {invoice.dueDate ? (
              <Text style={styles.docMeta}>Vencimiento: {formatDate(invoice.dueDate)}</Text>
            ) : null}
            {invoice.pointOfSaleNumber !== undefined ? (
              <Text style={styles.docMeta}>
                Punto de venta: {String(invoice.pointOfSaleNumber).padStart(4, '0')}
              </Text>
            ) : null}
            {invoice.currency && invoice.currency !== 'ARS' ? (
              <Text style={styles.docMeta}>Moneda: {invoice.currency}</Text>
            ) : null}
          </View>
        </View>

        {/* COMPROBANTE ASOCIADO (NC/ND) */}
        {invoice.originalInvoiceNumber ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Comprobante asociado:</Text>
            <Text style={styles.infoValue}>{invoice.originalInvoiceNumber}</Text>
          </View>
        ) : null}

        {/* DATOS DEL CLIENTE */}
        <View>
          <Text style={styles.sectionTitle}>DATOS DEL RECEPTOR</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Razón Social:</Text>
            <Text style={styles.infoValue}>{customer.name}</Text>
          </View>
          {customer.taxId ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CUIT/DNI:</Text>
              <Text style={styles.infoValue}>{customer.taxId}</Text>
            </View>
          ) : null}
          {customer.taxCondition ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Condición IVA:</Text>
              <Text style={styles.infoValue}>{customer.taxCondition}</Text>
            </View>
          ) : null}
          {customer.address ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Domicilio:</Text>
              <Text style={styles.infoValue}>{customer.address}</Text>
            </View>
          ) : null}
        </View>

        {/* DETALLE */}
        <View>
          <Text style={styles.sectionTitle}>DETALLE</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colIdx}>#</Text>
              <Text style={descStyle}>Descripción</Text>
              <Text style={styles.colQty}>Cant.</Text>
              <Text style={styles.colUnit}>P. Unit.</Text>
              {isTypeA ? <Text style={styles.colVat}>IVA %</Text> : null}
              <Text style={styles.colSub}>{isTypeA ? 'Subtotal' : 'Importe'}</Text>
            </View>

            {lines.map((line, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colIdx}>{index + 1}</Text>
                <Text style={descStyle}>{line.description}</Text>
                <Text style={styles.colQty}>
                  {line.quantity.toLocaleString('es-AR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                  })}
                </Text>
                <Text style={styles.colUnit}>{formatAmount(line.unitPrice)}</Text>
                {isTypeA ? (
                  <Text style={styles.colVat}>{line.vatRate}%</Text>
                ) : null}
                <Text style={styles.colSub}>
                  {formatAmount(isTypeA ? line.subtotal : line.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* PERCEPCIONES */}
        {perceptions.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>PERCEPCIONES</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: '40%' }}>Concepto</Text>
                <Text style={{ width: '25%', textAlign: 'right' }}>Base</Text>
                <Text style={{ width: '15%', textAlign: 'right' }}>Alíc.</Text>
                <Text style={{ width: '20%', textAlign: 'right' }}>Importe</Text>
              </View>
              {perceptions.map((p, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: '40%' }}>{p.name}</Text>
                  <Text style={{ width: '25%', textAlign: 'right' }}>
                    {formatAmount(p.baseAmount)}
                  </Text>
                  <Text style={{ width: '15%', textAlign: 'right' }}>{p.rate}%</Text>
                  <Text style={{ width: '20%', textAlign: 'right' }}>
                    {formatAmount(p.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* TOTALES */}
        <View style={styles.totalsSection}>
          {totals.discountAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento:</Text>
              <Text style={styles.totalValue}>-{formatAmount(totals.discountAmount)}</Text>
            </View>
          ) : null}

          {isTypeA ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal (neto):</Text>
                <Text style={styles.totalValue}>{formatAmount(totals.subtotal)}</Text>
              </View>
              {vatRows.length > 0 ? (
                vatRows.map((v, idx) => (
                  <View key={idx} style={styles.totalRow}>
                    <Text style={styles.totalLabel}>IVA {v.rate}%:</Text>
                    <Text style={styles.totalValue}>{formatAmount(v.amount)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>IVA:</Text>
                  <Text style={styles.totalValue}>{formatAmount(totals.vatAmount)}</Text>
                </View>
              )}
            </>
          ) : null}

          {perceptions.length > 0 || totals.otherTaxes > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Percepciones / Otros imp.:</Text>
              <Text style={styles.totalValue}>{formatAmount(totals.otherTaxes)}</Text>
            </View>
          ) : null}

          {totals.otherCharges > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Otros conceptos:</Text>
              <Text style={styles.totalValue}>{formatAmount(totals.otherCharges)}</Text>
            </View>
          ) : null}
        </View>

        {/* OTROS CONCEPTOS (detalle) */}
        {otherCharges.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>OTROS CONCEPTOS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: '75%' }}>Descripción</Text>
                <Text style={{ width: '25%', textAlign: 'right' }}>Importe</Text>
              </View>
              {otherCharges.map((oc, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: '75%' }}>{oc.description}</Text>
                  <Text style={{ width: '25%', textAlign: 'right' }}>
                    {formatAmount(oc.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.grandTotal}>
          <Text>TOTAL:</Text>
          <Text>{formatAmount(totals.total)}</Text>
        </View>

        {/* CAE */}
        {invoice.cae ? (
          <View style={styles.caeSection}>
            <Text style={[styles.bold, { marginBottom: 4 }]}>
              Comprobante autorizado por AFIP
            </Text>
            <View style={styles.caeRow}>
              <Text style={styles.caeLabel}>CAE:</Text>
              <Text style={styles.caeValue}>{invoice.cae}</Text>
            </View>
            <View style={styles.caeRow}>
              <Text style={styles.caeLabel}>Vencimiento del CAE:</Text>
              <Text style={styles.caeValue}>
                {invoice.caeExpiryDate ? formatDate(invoice.caeExpiryDate) : '-'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* OBSERVACIONES */}
        {notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>OBSERVACIONES</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>
            Documento generado electrónicamente -{' '}
            {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
