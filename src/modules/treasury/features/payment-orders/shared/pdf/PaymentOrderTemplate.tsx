import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { styles } from './styles';
import type { PaymentOrderPDFData } from './types';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  TRANSFER: 'Transferencia',
  DEBIT_CARD: 'Tarjeta de débito',
  CREDIT_CARD: 'Tarjeta de crédito',
  ACCOUNT: 'Cuenta corriente',
};

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  return format(new Date(d), 'dd/MM/yyyy', { locale: es });
}

function fmtAmount(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Inlined desde @/modules/suppliers para evitar cross-module imports.
function formatCbu(cbu: string | null | undefined): string {
  if (!cbu) return '—';
  const clean = cbu.trim();
  if (clean.length === 0) return '—';
  if (clean.length !== 22) return clean;
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
}

const ACCOUNT_TYPE_LABELS: Record<'CHECKING' | 'SAVINGS', string> = {
  CHECKING: 'Cuenta corriente',
  SAVINGS: 'Caja de ahorro',
};

export function PaymentOrderTemplate({ data }: { data: PaymentOrderPDFData }) {
  const {
    company,
    paymentOrder,
    supplier,
    supplierPaymentMethods,
    invoices,
    payments,
    totalAmount,
    amountInWords,
    pdfSettings,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logo ? <Image style={styles.logo} src={company.logo} /> : null}
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              {company.cuit ? <Text style={styles.companyInfo}>CUIT: {company.cuit}</Text> : null}
              {company.address ? <Text style={styles.companyInfo}>{company.address}</Text> : null}
              {company.phone ? <Text style={styles.companyInfo}>Tel: {company.phone}</Text> : null}
              {company.email ? <Text style={styles.companyInfo}>{company.email}</Text> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>ORDEN DE PAGO</Text>
            <Text style={styles.orderNumber}>N° {paymentOrder.fullNumber}</Text>
            <Text style={styles.orderDate}>Fecha: {fmtDate(paymentOrder.date)}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Proveedor</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Razón Social:</Text>
            <Text style={styles.infoValue}>{supplier.businessName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CUIT:</Text>
            <Text style={styles.infoValue}>{supplier.taxId || '-'}</Text>
          </View>
          {supplier.address ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Domicilio:</Text>
              <Text style={styles.infoValue}>{supplier.address}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Moneda:</Text>
            <Text style={styles.infoValue}>ARS</Text>
          </View>
        </View>

        {supplierPaymentMethods && supplierPaymentMethods.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Cuentas del proveedor</Text>
            {supplierPaymentMethods.map((m, i) => {
              if (m.type === 'CHECK') {
                return (
                  <View key={i} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Cheque:</Text>
                    <Text style={styles.infoValue}>
                      Acepta cheques
                      {m.isDefault ? ' (Predeterminado)' : ''}
                    </Text>
                  </View>
                );
              }
              const accountTypeLabel = m.accountType
                ? ACCOUNT_TYPE_LABELS[m.accountType]
                : '';
              const headerParts = [
                m.bankName ?? 'Cuenta bancaria',
                accountTypeLabel,
                m.currency,
              ].filter(Boolean);
              return (
                <View
                  key={i}
                  style={{
                    marginBottom: 6,
                    paddingBottom: 4,
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#cbd5e1',
                  }}
                >
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
                    {headerParts.join(' - ')}
                    {m.isDefault ? ' (Predeterminado)' : ''}
                  </Text>
                  {m.cbu ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>CBU:</Text>
                      <Text style={styles.infoValue}>{formatCbu(m.cbu)}</Text>
                    </View>
                  ) : null}
                  {m.alias ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Alias:</Text>
                      <Text style={styles.infoValue}>{m.alias}</Text>
                    </View>
                  ) : null}
                  {m.accountHolder ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Titular:</Text>
                      <Text style={styles.infoValue}>
                        {m.accountHolder}
                        {m.accountHolderTaxId
                          ? ` (CUIT/CUIL: ${m.accountHolderTaxId})`
                          : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {invoices.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Detalles de Valores a Cancelar</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.invDate}>Fecha doc.</Text>
                <Text style={styles.invDue}>Vencimiento</Text>
                <Text style={styles.invVoucher}>Comprobante</Text>
                <Text style={styles.invCurrency}>Moneda</Text>
                <Text style={styles.invTotal}>Total documento</Text>
                <Text style={styles.invApplied}>Importe aplicado</Text>
              </View>
              {invoices.map((inv, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.invDate}>{fmtDate(inv.issueDate)}</Text>
                  <Text style={styles.invDue}>{fmtDate(inv.dueDate)}</Text>
                  <Text style={styles.invVoucher}>{inv.fullNumber}</Text>
                  <Text style={styles.invCurrency}>ARS</Text>
                  <Text style={styles.invTotal}>{fmtAmount(inv.total)}</Text>
                  <Text style={styles.invApplied}>{fmtAmount(inv.appliedAmount)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {payments.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Detalle de los medios de pago</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.payMethod}>Método</Text>
                <Text style={styles.payDetail}>Detalle</Text>
                <Text style={styles.payRef}>Referencia</Text>
                <Text style={styles.payAmount}>Importe</Text>
              </View>
              {payments.map((p, i) => {
                const detail = p.bankName
                  ? `${p.bankName}${p.accountNumber ? ` - ${p.accountNumber}` : ''}`
                  : p.cashRegisterCode
                    ? `Caja ${p.cashRegisterCode}${p.cashRegisterName ? ` - ${p.cashRegisterName}` : ''}`
                    : p.checkNumber
                      ? `Cheque #${p.checkNumber}`
                      : p.cardLast4
                        ? `Tarjeta •••• ${p.cardLast4}`
                        : '-';
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.payMethod}>
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </Text>
                    <Text style={styles.payDetail}>{detail}</Text>
                    <Text style={styles.payRef}>{p.reference || '-'}</Text>
                    <Text style={styles.payAmount}>{fmtAmount(p.amount)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.grandTotal}>
          <Text>TOTAL ORDEN DE PAGO</Text>
          <Text>{fmtAmount(totalAmount)}</Text>
        </View>

        <View style={styles.amountWords}>
          <Text>Son: {amountInWords}</Text>
        </View>

        {paymentOrder.notes ? (
          <View>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={{ fontSize: 9 }}>{paymentOrder.notes}</Text>
          </View>
        ) : null}

        <View style={styles.signatureSection}>
          <Text style={styles.signatureNote}>
            Recibí el importe de la presente liquidación.
          </Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text>Firma Proveedor</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text>Aclaración / Documento</Text>
            </View>
          </View>
        </View>

        {pdfSettings?.signatureUrl ? (
          <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
            <Image
              src={pdfSettings.signatureUrl}
              style={{ width: 140, height: 60, objectFit: 'contain' }}
            />
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>Firma autorizada</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          {pdfSettings?.footerText ? (
            <Text style={{ marginBottom: 2 }}>{pdfSettings.footerText}</Text>
          ) : null}
          <Text>
            Documento generado electrónicamente -{' '}
            {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
