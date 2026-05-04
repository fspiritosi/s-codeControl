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
                let destinationLine: string | null = null;
                if (p.destination) {
                  if (p.destination.kind === 'CHECK') {
                    destinationLine = '→ Cheque al proveedor';
                  } else {
                    const accountTypeLabel = p.destination.accountType
                      ? ACCOUNT_TYPE_LABELS[p.destination.accountType]
                      : '';
                    const parts = [
                      p.destination.bankName ?? 'Cuenta bancaria',
                      accountTypeLabel,
                      p.destination.currency,
                    ].filter(Boolean);
                    const cbu = p.destination.cbu ? formatCbu(p.destination.cbu) : null;
                    const tail = cbu
                      ? ` · CBU ${cbu}`
                      : p.destination.alias
                        ? ` · Alias ${p.destination.alias}`
                        : '';
                    destinationLine = `→ ${parts.join(' · ')}${tail}`;
                  }
                  if (p.destination.isDefault) {
                    destinationLine += ' (Predeterminado)';
                  }
                }
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.payMethod}>
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </Text>
                    <View style={styles.payDetail}>
                      <Text>{detail}</Text>
                      {destinationLine ? (
                        <Text style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>
                          {destinationLine}
                        </Text>
                      ) : null}
                    </View>
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
