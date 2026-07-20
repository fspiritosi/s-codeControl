/**
 * Template de PDF de Recibo de Cobro.
 * SERVER-ONLY: se usa dentro de renderToBuffer(). No importar en componentes client.
 */

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from '../styles';
import type { ReceiptPDFData } from '../types';
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

interface ReceiptTemplateProps {
  data: ReceiptPDFData;
}

export function ReceiptTemplate({ data }: ReceiptTemplateProps) {
  const { company, customer, receipt, invoices, payments, withholdings, totalAmount, notes } =
    data;

  const withholdingsTotal = withholdings.reduce((s, w) => s + w.amount, 0);

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
          <View style={styles.headerRight}>
            <Text style={styles.title}>RECIBO DE COBRO</Text>
            <Text style={styles.docNumber}>N{'°'} {receipt.fullNumber}</Text>
            <Text style={styles.docMeta}>Fecha: {formatDate(receipt.date)}</Text>
          </View>
        </View>

        {/* DATOS DEL CLIENTE */}
        <View>
          <Text style={styles.sectionTitle}>CLIENTE</Text>
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

        {/* FACTURAS APLICADAS */}
        <View>
          <Text style={styles.sectionTitle}>FACTURAS APLICADAS</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.rcInvNum}>Comprobante</Text>
              <Text style={styles.rcInvDate}>Tipo</Text>
              <Text style={styles.rcInvTotal}>Total factura</Text>
              <Text style={styles.rcInvApplied}>Aplicado</Text>
            </View>
            {invoices.map((inv, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.rcInvNum}>{inv.fullNumber}</Text>
                <Text style={styles.rcInvDate}>{inv.voucherLabel ?? '-'}</Text>
                <Text style={styles.rcInvTotal}>
                  {inv.invoiceTotal !== undefined ? formatAmount(inv.invoiceTotal) : '-'}
                </Text>
                <Text style={styles.rcInvApplied}>{formatAmount(inv.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* MEDIOS DE PAGO */}
        {payments.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>MEDIOS DE PAGO</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.rcPayMethod}>Método</Text>
                <Text style={styles.rcPayDetail}>Detalle</Text>
                <Text style={styles.rcPayAmount}>Monto</Text>
              </View>
              {payments.map((p, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.rcPayMethod}>{p.method}</Text>
                  <Text style={styles.rcPayDetail}>{p.detail ?? ''}</Text>
                  <Text style={styles.rcPayAmount}>{formatAmount(p.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* RETENCIONES */}
        {withholdings.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>RETENCIONES</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.rcWhType}>Impuesto</Text>
                <Text style={styles.rcWhRate}>Alíc.</Text>
                <Text style={styles.rcWhCert}>Certificado</Text>
                <Text style={styles.rcWhAmount}>Monto</Text>
              </View>
              {withholdings.map((w, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.rcWhType}>{w.type}</Text>
                  <Text style={styles.rcWhRate}>
                    {w.rate !== undefined ? `${w.rate}%` : '-'}
                  </Text>
                  <Text style={styles.rcWhCert}>{w.certificateNumber ?? '-'}</Text>
                  <Text style={styles.rcWhAmount}>{formatAmount(w.amount)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total retenciones:</Text>
                <Text style={styles.totalValue}>{formatAmount(withholdingsTotal)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* TOTAL */}
        <View style={styles.grandTotal}>
          <Text>TOTAL COBRADO:</Text>
          <Text>{formatAmount(totalAmount)}</Text>
        </View>

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
