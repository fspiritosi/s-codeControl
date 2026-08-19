'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  createPaymentOrder,
  updatePaymentOrder,
  getPendingPurchaseInvoices,
  getPendingExpenses,
  getExpenseCategoriesForOrder,
  getSupplierPaymentMethodsForPaymentOrder,
  getAvailableCreditNotesForPaymentOrder,
} from '../actions.server';
import { PAYMENT_METHOD_LABELS } from '../../../shared/validators';
import {
  BASE_CURRENCY,
  convertAmount,
  currencySymbol,
  effectiveRate,
  SUPPORTED_CURRENCIES,
} from '@/shared/lib/currency-conversion';
import { CheckPaymentField } from './CheckPaymentField';
import { formatCbu } from './CopyableCbu';

interface Supplier {
  id: string;
  code: string;
  business_name: string;
  tax_id: string;
}

interface CashRegisterOpt {
  id: string;
  code: string;
  name: string;
  has_open_session: boolean;
}

interface BankAccountOpt {
  id: string;
  bank_name: string;
  account_number: string;
}

interface InvoiceOption {
  id: string;
  point_of_sale: string;
  full_number: string;
  issue_date: Date | string;
  due_date: Date | string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  already_paid: number;
  remaining: number;
  /** total, already_paid y remaining están en esta moneda (tsk-576). */
  currency: string;
  exchange_rate: number;
}

interface ExpenseOption {
  id: string;
  full_number: string;
  description: string;
  date: Date | string;
  due_date: Date | string | null;
  total: number;
  already_paid: number;
  remaining: number;
  category_id: string;
  category_name: string;
  supplier_id: string | null;
  supplier_name: string;
}

type PaymentTarget = 'invoice' | 'expense';

type PaymentMethod = keyof typeof PAYMENT_METHOD_LABELS;

interface ItemDraft {
  invoice_id: string | null;
  expense_id: string | null;
  invoice_label: string | null;
  /** Importe en la moneda del comprobante (tsk-576). */
  amount: string;
  /** Moneda del comprobante. Gastos y pagos a cuenta van siempre en ARS. */
  currency: string;
  /** Tipo de cambio del comprobante, usado para convertir a la moneda de la OP. */
  exchange_rate: number;
  // Importe base (saldo de la factura/gasto) antes de aplicar el descuento.
  base_amount: string;
  // % de descuento aplicado a esta línea (0-100). El amount ya es el neto.
  discount_pct: string;
  // Pago a cuenta: sin comprobante, genera saldo a favor imputable después.
  is_on_account: boolean;
}

interface PaymentDraft {
  payment_method: PaymentMethod;
  amount: string;
  cash_register_id: string | null;
  bank_account_id: string | null;
  supplier_payment_method_id: string | null;
  check_number: string;
  card_last4: string;
  reference: string;
  check_kind: 'OWN' | 'THIRD_PARTY' | null;
  check_id: string | null;
}

interface SupplierPaymentMethodOpt {
  id: string;
  type: 'CHECK' | 'ACCOUNT' | string;
  bank_name: string | null;
  account_holder: string | null;
  account_type: string | null;
  cbu: string | null;
  alias: string | null;
  currency: string | null;
  is_default: boolean;
  check_bank_name?: string | null;
  check_type?: 'COMMON' | 'DEFERRED' | 'ELECTRONIC' | null;
  check_max_days?: number | null;
  check_payee?: string | null;
  check_notes?: string | null;
}

const ACCOUNT_TYPE_SHORT: Record<string, string> = {
  CHECKING: 'CC',
  SAVINGS: 'CA',
};

const CHECK_TYPE_SHORT: Record<string, string> = {
  COMMON: 'Común',
  DEFERRED: 'Diferido',
  ELECTRONIC: 'Electrónico',
};

function describeSupplierMethod(m: SupplierPaymentMethodOpt): string {
  if (m.type === 'CHECK') {
    const parts = [
      m.check_bank_name,
      m.check_type ? CHECK_TYPE_SHORT[m.check_type] ?? m.check_type : null,
      m.check_type === 'DEFERRED' && m.check_max_days ? `hasta ${m.check_max_days} días` : null,
      m.check_payee ? `a ${m.check_payee}` : null,
    ].filter(Boolean);
    return parts.length ? `Cheque · ${parts.join(' · ')}` : 'Acepta cheques';
  }
  const accType = m.account_type ? ACCOUNT_TYPE_SHORT[m.account_type] ?? m.account_type : '';
  const parts = [m.bank_name ?? 'Cuenta bancaria', accType, m.currency].filter(Boolean);
  const tail = m.cbu
    ? `CBU ${formatCbu(m.cbu)}`
    : m.alias
      ? `Alias ${m.alias}`
      : '';
  return tail ? `${parts.join(' · ')} · ${tail}` : parts.join(' · ');
}

function pickDefaultMethodForPaymentMethod(
  methods: SupplierPaymentMethodOpt[],
  pm: PaymentMethod
): string | null {
  const filtered = filterMethodsByPaymentMethod(methods, pm);
  const def = filtered.find((m) => m.is_default);
  return def?.id ?? null;
}

function filterMethodsByPaymentMethod(
  methods: SupplierPaymentMethodOpt[],
  pm: PaymentMethod
): SupplierPaymentMethodOpt[] {
  if (pm === 'TRANSFER') return methods.filter((m) => m.type === 'ACCOUNT');
  if (pm === 'CHECK') return methods.filter((m) => m.type === 'CHECK');
  return [];
}

/** Nota de crédito del proveedor con crédito disponible (TKT-586). */
interface CreditNoteOption {
  id: string;
  full_number: string;
  issue_date: Date | string;
  currency: string;
  exchange_rate: number;
  total: number;
  available: number;
  original_invoice_full_number: string | null;
}

/** Crédito de NC cargado en la orden. `amount` va en la moneda de la NC. */
export interface CreditDraft {
  credit_note_id: string;
  label: string;
  amount: string;
  currency: string;
  exchange_rate: number;
}

export interface RetentionDraft {
  tax_type_id: string;
  base_amount: string;
  rate: string;
  amount: string;
  notes: string;
}

interface RetentionTypeOpt {
  id: string;
  code: string;
  name: string;
  default_rate: number;
  calculation_base: 'NET' | 'TOTAL' | 'VAT';
}

export interface PaymentOrderEditData {
  id: string;
  supplier_id: string | null;
  date: string;
  /** Moneda de la orden (tsk-576). Las órdenes viejas no la tienen: caen a ARS. */
  currency?: string | null;
  exchange_rate?: number | null;
  scheduled_payment_date: string | null;
  notes: string | null;
  full_number: string;
  items: Array<{
    invoice_id: string | null;
    expense_id: string | null;
    invoice_label: string | null;
    amount: string;
    currency?: string | null;
    exchange_rate?: number | null;
    discount_pct?: number;
    is_on_account?: boolean;
  }>;
  payments: Array<{
    payment_method: PaymentMethod;
    amount: string;
    cash_register_id: string | null;
    bank_account_id: string | null;
    supplier_payment_method_id: string | null;
    check_number: string;
    card_last4: string;
    reference: string;
    check_kind?: 'OWN' | 'THIRD_PARTY' | null;
    check_id?: string | null;
  }>;
  retentions?: RetentionDraft[];
  credits?: CreditDraft[];
}

interface Props {
  suppliers: Supplier[];
  cashRegisters: CashRegisterOpt[];
  bankAccounts: BankAccountOpt[];
  retentionTypes: RetentionTypeOpt[];
  initialData?: PaymentOrderEditData;
}

const today = () => new Date().toISOString().slice(0, 10);

// Neto a pagar = base × (1 − descuento%). Redondeado a 2 decimales.
function netFromDiscount(baseAmount: string, discountPct: string): string {
  const base = parseFloat(baseAmount) || 0;
  const disc = parseFloat(discountPct) || 0;
  const net = Math.round(base * (1 - disc / 100) * 100) / 100;
  return net.toFixed(2);
}

function emptyPayment(): PaymentDraft {
  return {
    payment_method: 'CASH',
    amount: '',
    cash_register_id: null,
    bank_account_id: null,
    supplier_payment_method_id: null,
    check_number: '',
    card_last4: '',
    reference: '',
    check_kind: null,
    check_id: null,
  };
}

export function NewPaymentOrderForm({
  suppliers,
  cashRegisters,
  bankAccounts,
  retentionTypes,
  initialData,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialData;

  const [pendingDraft, setPendingDraft] = useState<{
    supplierId: string;
    items: Array<{ invoiceId: string; amount: number }>;
  } | null>(() => {
    if (typeof window === 'undefined' || initialData) return null;
    try {
      const raw = window.sessionStorage.getItem('pending-balances-draft');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        supplierId?: string;
        items?: Array<{ invoiceId?: string; amount?: number }>;
      };
      if (!parsed.supplierId || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        return null;
      }
      const items = parsed.items
        .filter((it) => typeof it.invoiceId === 'string' && typeof it.amount === 'number')
        .map((it) => ({ invoiceId: it.invoiceId as string, amount: it.amount as number }));
      if (items.length === 0) return null;
      return { supplierId: parsed.supplierId, items };
    } catch {
      return null;
    }
  });
  const [draftApplied, setDraftApplied] = useState(false);

  const [supplierId, setSupplierId] = useState<string>(
    initialData?.supplier_id ?? pendingDraft?.supplierId ?? ''
  );
  const [date, setDate] = useState(initialData?.date ?? today());
  // La orden se arma en pesos por defecto aunque la factura del proveedor esté
  // en dólares; el usuario puede cambiarla (tsk-576).
  const [orderCurrency, setOrderCurrency] = useState<string>(
    initialData?.currency ?? BASE_CURRENCY
  );
  // Tipo de cambio de la orden. Solo hace falta cuando la orden está en moneda
  // extranjera y hay comprobantes en pesos: una factura en pesos trae rate 1 y
  // no alcanza para convertirla (tsk-576).
  const [orderExchangeRate, setOrderExchangeRate] = useState<number>(
    initialData?.exchange_rate ?? 1
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    initialData?.scheduled_payment_date ?? ''
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget>('invoice');
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceOption[] | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseOption[] | null>(null);
  const [posFilter, setPosFilter] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseDueDateFilter, setExpenseDueDateFilter] = useState('');
  const [expenseCategories, setExpenseCategories] = useState<{ id: string; name: string }[]>([]);
  const [supplierPaymentMethods, setSupplierPaymentMethods] = useState<
    SupplierPaymentMethodOpt[]
  >([]);
  const isLoadingInvoices = !!supplierId && pendingInvoices === null;
  const isLoadingExpenses = pendingExpenses === null;

  const pointsOfSale = useMemo(() => {
    if (!pendingInvoices) return [];
    return Array.from(new Set(pendingInvoices.map((i) => i.point_of_sale))).sort();
  }, [pendingInvoices]);

  const filteredInvoices = useMemo(() => {
    if (!pendingInvoices) return null;
    if (!posFilter) return pendingInvoices;
    return pendingInvoices.filter((i) => i.point_of_sale === posFilter);
  }, [pendingInvoices, posFilter]);

  const filteredExpenses = useMemo(() => {
    if (!pendingExpenses) return null;
    let result = pendingExpenses;
    if (expenseCategoryFilter) {
      result = result.filter((e) => e.category_id === expenseCategoryFilter);
    }
    if (expenseDueDateFilter) {
      const filterDate = new Date(expenseDueDateFilter);
      result = result.filter((e) => e.due_date && new Date(e.due_date) <= filterDate);
    }
    return result;
  }, [pendingExpenses, expenseCategoryFilter, expenseDueDateFilter]);

  const [globalDiscount, setGlobalDiscount] = useState('0');
  const [items, setItems] = useState<ItemDraft[]>(
    initialData?.items?.map((i) => {
      const disc = i.discount_pct ?? 0;
      const amt = parseFloat(i.amount) || 0;
      // Reconstruye el importe base a partir del neto guardado y el % de descuento.
      const base = disc > 0 && disc < 100 ? amt / (1 - disc / 100) : amt;
      return {
        invoice_id: i.invoice_id,
        expense_id: i.expense_id,
        invoice_label: i.invoice_label,
        amount: i.amount,
        base_amount: (Math.round(base * 100) / 100).toFixed(2),
        discount_pct: disc ? String(disc) : '0',
        currency: i.currency ?? BASE_CURRENCY,
        exchange_rate: i.exchange_rate ?? 1,
        is_on_account: i.is_on_account ?? false,
      };
    }) ?? []
  );
  const [payments, setPayments] = useState<PaymentDraft[]>(
    initialData?.payments?.map((p) => ({
      ...p,
      check_kind: p.check_kind ?? null,
      check_id: p.check_id ?? null,
    })) ?? [emptyPayment()]
  );
  const [retentions, setRetentions] = useState<RetentionDraft[]>(initialData?.retentions ?? []);
  const [credits, setCredits] = useState<CreditDraft[]>(initialData?.credits ?? []);
  const [creditNotes, setCreditNotes] = useState<CreditNoteOption[]>([]);

  useEffect(() => {
    if (!supplierId) {
      setSupplierPaymentMethods([]);
      setCreditNotes([]);
      setCredits([]);
      setPosFilter('');
      setPendingExpenses(null);
      setExpenseCategoryFilter('');
      setExpenseDueDateFilter('');
      return;
    }
    setPosFilter('');
    setExpenseCategoryFilter('');
    setExpenseDueDateFilter('');
    let cancelled = false;
    Promise.all([
      getPendingPurchaseInvoices(supplierId),
      getPendingExpenses(supplierId),
      getExpenseCategoriesForOrder(),
      getSupplierPaymentMethodsForPaymentOrder(supplierId),
      // Al editar, la propia orden no cuenta como crédito ya tomado.
      getAvailableCreditNotesForPaymentOrder(supplierId, initialData?.id),
    ])
      .then(([invoices, expenses, categories, methods, notes]) => {
        if (cancelled) return;
        setPendingInvoices(invoices);
        setPendingExpenses(expenses);
        setExpenseCategories(categories);
        setCreditNotes(notes as CreditNoteOption[]);
        const opts = methods as SupplierPaymentMethodOpt[];
        setSupplierPaymentMethods(opts);
        // Auto-asignar default por línea según método (sin pisar selección existente)
        setPayments((prev) =>
          prev.map((p) => ({
            ...p,
            supplier_payment_method_id:
              p.supplier_payment_method_id ??
              pickDefaultMethodForPaymentMethod(opts, p.payment_method),
          }))
        );
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [supplierId, initialData?.id]);

  // Cargar gastos y categorías cuando no hay proveedor seleccionado
  useEffect(() => {
    if (supplierId) return;
    let cancelled = false;
    Promise.all([getPendingExpenses(), getExpenseCategoriesForOrder()])
      .then(([expenses, categories]) => {
        if (cancelled) return;
        setPendingExpenses(expenses);
        setExpenseCategories(categories);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  useEffect(() => {
    if (isEdit) return;
    if (!pendingDraft || draftApplied) return;
    if (!pendingInvoices) return;
    if (supplierId !== pendingDraft.supplierId) return;

    const draftItems: ItemDraft[] = [];
    let totalAmount = 0;
    let appliedCount = 0;

    for (const draftIt of pendingDraft.items) {
      const inv = pendingInvoices.find((i) => i.id === draftIt.invoiceId);
      if (!inv) continue;
      const amount = Math.min(draftIt.amount, inv.remaining);
      if (amount <= 0) continue;
      draftItems.push({
        invoice_id: inv.id,
        expense_id: null,
        invoice_label: inv.full_number,
        amount: amount.toFixed(2),
        base_amount: amount.toFixed(2),
        discount_pct: '0',
        currency: inv.currency ?? 'ARS',
        exchange_rate: inv.exchange_rate || 1,
        is_on_account: false,
      });
      totalAmount += amount;
      appliedCount += 1;
    }

    if (draftItems.length > 0) {
      setItems(draftItems);
      const totalStr = (Math.round(totalAmount * 100) / 100).toFixed(2);
      setPayments((prev) => {
        if (prev.length === 0) return [{ ...emptyPayment(), amount: totalStr }];
        return prev.map((p, i) => (i === 0 ? { ...p, amount: totalStr } : { ...p, amount: '' }));
      });
      toast.success(`Cargados ${appliedCount} items desde Saldos Pendientes.`);
    }

    try {
      window.sessionStorage.removeItem('pending-balances-draft');
    } catch {
      // ignore
    }
    setPendingDraft(null);
    setDraftApplied(true);
  }, [pendingInvoices, pendingDraft, draftApplied, supplierId, isEdit]);

  const handleSupplierChange = (newId: string) => {
    if (newId !== supplierId) {
      setPendingInvoices(null);
      setPendingExpenses(null);
      setSupplierPaymentMethods([]);
      setPayments((prev) =>
        prev.map((p) => ({ ...p, supplier_payment_method_id: null }))
      );
    }
    setSupplierId(newId);
  };

  // Los totales van en la moneda de la orden: sumar los importes crudos
  // mezclaría dólares con pesos (tsk-576).
  const toOrderCurrency = useCallback(
    (amount: number, item: Pick<ItemDraft, 'currency' | 'exchange_rate'>) =>
      convertAmount({
        amount,
        from: item.currency,
        to: orderCurrency,
        rate: effectiveRate(item, {
          currency: orderCurrency,
          exchange_rate: orderExchangeRate,
        }),
      }),
    [orderCurrency, orderExchangeRate]
  );

  const itemsTotal = useMemo(
    () => items.reduce((acc, i) => acc + toOrderCurrency(parseFloat(i.amount) || 0, i), 0),
    [items, toOrderCurrency]
  );
  const grossItemsTotal = useMemo(
    () => items.reduce((acc, i) => acc + toOrderCurrency(parseFloat(i.base_amount) || 0, i), 0),
    [items, toOrderCurrency]
  );
  const discountTotal = Math.round((grossItemsTotal - itemsTotal) * 100) / 100;
  const paymentsTotal = useMemo(
    () => payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    [payments]
  );
  const retentionsTotal = useMemo(
    () => retentions.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0),
    [retentions]
  );
  /** Ítems cuyo comprobante está en una moneda distinta a la de la orden. */
  const hasForeignItems = useMemo(
    () => items.some((i) => i.currency !== orderCurrency),
    [items, orderCurrency]
  );

  /**
   * Créditos de NC convertidos a la moneda de la orden. No tocan el total de
   * ítems (que es lo facturado y la base de las retenciones): bajan el neto a
   * transferir (TKT-586).
   */
  const creditsTotal = useMemo(
    () =>
      credits.reduce(
        (acc, c) =>
          acc +
          toOrderCurrency(parseFloat(c.amount) || 0, {
            currency: c.currency,
            exchange_rate: c.exchange_rate,
          }),
        0
      ),
    [credits, toOrderCurrency]
  );

  const orderSymbol = currencySymbol(orderCurrency);
  const netToPay = Math.round((itemsTotal - retentionsTotal - creditsTotal) * 100) / 100;
  const diff = Math.round((netToPay - paymentsTotal) * 100) / 100;

  /** Crédito de cada NC que esta orden todavía puede tomar. */
  const availableFor = useCallback(
    (creditNoteId: string, currentIndex: number) => {
      const note = creditNotes.find((n) => n.id === creditNoteId);
      if (!note) return 0;
      const takenElsewhere = credits.reduce(
        (acc, c, i) =>
          i !== currentIndex && c.credit_note_id === creditNoteId
            ? acc + (parseFloat(c.amount) || 0)
            : acc,
        0
      );
      return Math.max(0, Math.round((note.available - takenElsewhere) * 100) / 100);
    },
    [creditNotes, credits]
  );

  const addCredit = () =>
    setCredits((prev) => [
      ...prev,
      { credit_note_id: '', label: '', amount: '', currency: orderCurrency, exchange_rate: 1 },
    ]);
  const removeCredit = (index: number) =>
    setCredits((prev) => prev.filter((_, i) => i !== index));
  const updateCredit = (index: number, patch: Partial<CreditDraft>) =>
    setCredits((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  /**
   * Al elegir la NC se propone el menor entre su crédito disponible y lo que
   * todavía queda por pagar: es lo que el usuario quiere en el 99% de los casos
   * y evita que cargue de más y no cuadre.
   */
  const handleCreditNoteChange = (index: number, creditNoteId: string) => {
    const note = creditNotes.find((n) => n.id === creditNoteId);
    if (!note) {
      updateCredit(index, { credit_note_id: creditNoteId, label: '' });
      return;
    }
    const pendingInOrderCurrency = Math.max(
      0,
      Math.round((itemsTotal - retentionsTotal - creditsTotal) * 100) / 100
    );
    const rate = effectiveRate(
      { currency: note.currency, exchange_rate: note.exchange_rate },
      { currency: orderCurrency, exchange_rate: orderExchangeRate }
    );
    // El tope se compara en la moneda de la NC, que es donde se guarda el importe.
    const pendingInNoteCurrency = convertAmount({
      amount: pendingInOrderCurrency,
      from: orderCurrency,
      to: note.currency,
      rate,
    });
    const suggested = Math.min(availableFor(creditNoteId, index), pendingInNoteCurrency);
    updateCredit(index, {
      credit_note_id: creditNoteId,
      label: note.full_number,
      currency: note.currency,
      exchange_rate: note.exchange_rate,
      amount: suggested > 0 ? suggested.toFixed(2) : '',
    });
  };

  const addRetention = () =>
    setRetentions((prev) => [
      ...prev,
      { tax_type_id: '', base_amount: '', rate: '', amount: '', notes: '' },
    ]);
  const removeRetention = (index: number) =>
    setRetentions((prev) => prev.filter((_, i) => i !== index));
  const updateRetention = (index: number, patch: Partial<RetentionDraft>) =>
    setRetentions((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const handleRetentionTypeChange = (index: number, taxTypeId: string) => {
    const t = retentionTypes.find((r) => r.id === taxTypeId);
    if (!t) {
      updateRetention(index, { tax_type_id: taxTypeId });
      return;
    }

    // Calcular base según calculation_base del tipo de retención
    // usando los datos de las facturas vinculadas a los items de la OP
    const linkedInvoiceIds = new Set(items.map((i) => i.invoice_id).filter(Boolean));
    const linkedInvoices = (pendingInvoices ?? []).filter((inv) => linkedInvoiceIds.has(inv.id));

    let base: number;
    if (t.calculation_base === 'NET') {
      base = linkedInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    } else if (t.calculation_base === 'VAT') {
      base = linkedInvoices.reduce((sum, inv) => sum + inv.vat_amount, 0);
    } else {
      base = itemsTotal;
    }

    base = Math.round(base * 100) / 100;
    const amount = Math.round(base * (t.default_rate / 100) * 100) / 100;
    updateRetention(index, {
      tax_type_id: taxTypeId,
      base_amount: base.toFixed(2),
      rate: String(t.default_rate),
      amount: amount.toFixed(2),
    });
  };

  const recalcRetention = (index: number) => {
    setRetentions((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const base = parseFloat(r.base_amount) || 0;
        const rate = parseFloat(r.rate) || 0;
        const amount = Math.round(base * (rate / 100) * 100) / 100;
        return { ...r, amount: amount.toFixed(2) };
      })
    );
  };

  const addInvoiceItem = (invoice: InvoiceOption) => {
    if (items.some((i) => i.invoice_id === invoice.id)) {
      toast.info('Esa factura ya está agregada');
      return;
    }
    const base = invoice.remaining.toFixed(2);
    setItems((prev) => [
      ...prev,
      {
        invoice_id: invoice.id,
        expense_id: null,
        invoice_label: invoice.full_number,
        base_amount: base,
        discount_pct: globalDiscount,
        amount: netFromDiscount(base, globalDiscount),
        // El tipo de cambio sale de la factura, no de la cotización del día:
        // así el importe convertido coincide con lo que se facturó (tsk-576).
        currency: invoice.currency ?? 'ARS',
        exchange_rate: invoice.exchange_rate || 1,
        is_on_account: false,
      },
    ]);
  };

  const addExpenseItem = (expense: ExpenseOption) => {
    if (items.some((i) => i.expense_id === expense.id)) {
      toast.info('Ese gasto ya está agregado');
      return;
    }
    const base = expense.remaining.toFixed(2);
    setItems((prev) => [
      ...prev,
      {
        invoice_id: null,
        expense_id: expense.id,
        invoice_label: expense.full_number,
        base_amount: base,
        discount_pct: globalDiscount,
        amount: netFromDiscount(base, globalDiscount),
        // Los gastos no tienen moneda propia: van siempre en la base.
        currency: BASE_CURRENCY,
        exchange_rate: 1,
        is_on_account: false,
      },
    ]);
  };

  // Pago a cuenta: plata que se le paga al proveedor sin imputar a un
  // comprobante. Queda como saldo a favor, imputable a una factura después.
  const addOnAccountItem = () => {
    if (!supplierId) {
      toast.info('Seleccioná el proveedor antes de cargar un pago a cuenta');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        invoice_id: null,
        expense_id: null,
        invoice_label: null,
        amount: '',
        base_amount: '',
        discount_pct: '0',
        // Un pago a cuenta no viene de un comprobante: se carga directo en la
        // moneda de la orden, sin conversión.
        currency: orderCurrency,
        exchange_rate: 1,
        is_on_account: true,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Editar el monto a mano desvincula la línea del %: pasa a ser un importe manual.
  const updateItemAmount = (index: number, amount: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, amount, base_amount: amount, discount_pct: '0' } : item
      )
    );
  };

  // Cambiar el % de una línea recalcula su neto desde el importe base.
  const updateItemDiscount = (index: number, discount: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, discount_pct: discount, amount: netFromDiscount(item.base_amount, discount) }
          : item
      )
    );
  };

  // Descuento global: setea el % en todas las líneas y recalcula cada neto.
  const applyGlobalDiscount = (discount: string) => {
    setGlobalDiscount(discount);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        discount_pct: discount,
        amount: netFromDiscount(item.base_amount, discount),
      }))
    );
  };

  const selectedRemainingTotal = useMemo(() => {
    const invoiceMap = new Map((pendingInvoices ?? []).map((inv) => [inv.id, inv.remaining]));
    const expenseMap = new Map((pendingExpenses ?? []).map((exp) => [exp.id, exp.remaining]));
    return items.reduce((acc, it) => {
      if (it.invoice_id) {
        const remaining = invoiceMap.get(it.invoice_id);
        return remaining && remaining > 0 ? acc + remaining : acc;
      }
      if (it.expense_id) {
        const remaining = expenseMap.get(it.expense_id);
        return remaining && remaining > 0 ? acc + remaining : acc;
      }
      return acc;
    }, 0);
  }, [items, pendingInvoices, pendingExpenses]);

  const canLoadPendingBalance = selectedRemainingTotal > 0;

  const handleLoadPendingBalance = () => {
    // Lo que hay que transferir es el saldo de los comprobantes menos el crédito
    // de las NC que ya se aplicó en la orden (TKT-586).
    const total = Math.max(0, Math.round((selectedRemainingTotal - creditsTotal) * 100) / 100);
    if (total <= 0) return;
    const totalStr = total.toFixed(2);
    setPayments((prev) => {
      if (prev.length === 0) {
        return [{ ...emptyPayment(), amount: totalStr }];
      }
      return prev.map((p, i) => (i === 0 ? { ...p, amount: totalStr } : { ...p, amount: '' }));
    });
    toast.success(`Cargado $${totalStr} como monto a pagar.`);
  };

  const addPayment = () => setPayments((prev) => [...prev, emptyPayment()]);
  const removePayment = (index: number) =>
    setPayments((prev) => prev.filter((_, i) => i !== index));
  const updatePayment = (index: number, patch: Partial<PaymentDraft>) =>
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? ({ ...p, ...patch } as PaymentDraft) : p))
    );

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Agregá al menos un ítem');
      return;
    }
    // Con el crédito de las NC cubriendo todo el neto no queda plata por
    // transferir: la orden se guarda sin pagos (TKT-586).
    if (payments.length === 0 && netToPay > 0.01) {
      toast.error('Agregá al menos un pago');
      return;
    }
    if (Math.abs(diff) >= 0.01) {
      toast.error(
        'El neto a pagar (ítems − retenciones − créditos) no coincide con el total de pagos'
      );
      return;
    }
    if (retentions.some((r) => !r.tax_type_id)) {
      toast.error('Hay una retención sin tipo seleccionado');
      return;
    }
    if (credits.some((c) => !c.credit_note_id)) {
      toast.error('Hay un crédito sin nota de crédito seleccionada');
      return;
    }
    if (credits.some((c) => !(parseFloat(c.amount) > 0))) {
      toast.error('Hay un crédito sin importe');
      return;
    }
    const overapplied = credits.findIndex(
      (c, i) => (parseFloat(c.amount) || 0) > availableFor(c.credit_note_id, i) + 0.001
    );
    if (overapplied >= 0) {
      toast.error(
        `La nota ${credits[overapplied].label} no tiene tanto crédito disponible`
      );
      return;
    }

    startTransition(async () => {
      const payload = {
        supplier_id: supplierId || null,
        date,
        currency: orderCurrency as (typeof SUPPORTED_CURRENCIES)[number],
        // Tipo de cambio de referencia de la orden: el que se aplica a cada
        // comprobante viaja en el ítem, porque cada factura trae el suyo.
        exchange_rate: orderExchangeRate,
        scheduled_payment_date: scheduledDate || null,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          invoice_id: i.invoice_id,
          expense_id: i.expense_id,
          amount: i.amount.trim(),
          currency: i.currency as (typeof SUPPORTED_CURRENCIES)[number],
          exchange_rate: i.exchange_rate,
          discount_pct: parseFloat(i.discount_pct) || 0,
          is_on_account: i.is_on_account,
        })),
        payments: payments.map((p) => ({
          payment_method: p.payment_method,
          amount: p.amount.trim(),
          cash_register_id: p.cash_register_id,
          bank_account_id: p.bank_account_id,
          supplier_payment_method_id: p.supplier_payment_method_id,
          check_number: p.check_number.trim() || null,
          card_last4: p.card_last4.trim() || null,
          reference: p.reference.trim() || null,
          check_kind: p.payment_method === 'CHECK' ? p.check_kind : null,
          check_id: p.payment_method === 'CHECK' ? p.check_id : null,
        })),
        retentions: retentions.map((r) => ({
          tax_type_id: r.tax_type_id,
          base_amount: parseFloat(r.base_amount) || 0,
          rate: parseFloat(r.rate) || 0,
          amount: parseFloat(r.amount) || 0,
          notes: r.notes.trim() || null,
        })),
        credits: credits.map((c) => ({
          credit_note_id: c.credit_note_id,
          amount: c.amount.trim(),
          currency: c.currency as (typeof SUPPORTED_CURRENCIES)[number],
          exchange_rate: c.exchange_rate,
        })),
      };

      const result = isEdit && initialData
        ? await updatePaymentOrder(initialData.id, payload)
        : await createPaymentOrder(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Orden de pago actualizada' : 'Orden de pago creada');
      const targetId = isEdit ? initialData!.id : result.data?.id ?? '';
      router.push(`/dashboard/treasury/payment-orders/${targetId}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/treasury?tab=payment-orders">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? `Editar orden ${initialData?.full_number ?? ''}` : 'Nueva orden de pago'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <SearchableSelect
              options={suppliers.map((s) => ({ value: s.id, label: `${s.code} — ${s.business_name}` }))}
              value={supplierId}
              onValueChange={handleSupplierChange}
              placeholder="Seleccionar proveedor"
              searchPlaceholder="Buscar proveedor..."
              emptyMessage="No se encontró el proveedor."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de pago programada (opcional)</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          {/* Moneda de la orden (tsk-576). Arranca en pesos aunque la factura
              del proveedor esté en dólares. */}
          <div className="space-y-1.5">
            <Label>Moneda de la orden</Label>
            <Select value={orderCurrency} onValueChange={setOrderCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === 'ARS' ? 'Pesos (ARS)' : 'Dólares (USD)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasForeignItems && orderCurrency === BASE_CURRENCY && (
              <p className="text-xs text-muted-foreground">
                Hay comprobantes en otra moneda. Se convierten con el tipo de cambio de cada factura.
              </p>
            )}
          </div>

          {/* Una factura en pesos trae tipo de cambio 1 y no alcanza para
              convertirla si la orden está en dólares: ahí lo pone la orden. */}
          {orderCurrency !== BASE_CURRENCY && (
            <div className="space-y-1.5">
              <Label>Tipo de cambio (1 {orderCurrency} = ? {BASE_CURRENCY})</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={orderExchangeRate || ''}
                onChange={(e) => setOrderExchangeRate(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Se aplica a los comprobantes en {BASE_CURRENCY}.
              </p>
            </div>
          )}
          <div className="md:col-span-3 space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentos a pagar</CardTitle>
              <CardDescription>Seleccioná si vas a pagar una factura o un gasto.</CardDescription>
            </div>
            <Select value={paymentTarget} onValueChange={(v) => setPaymentTarget(v as PaymentTarget)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Facturas</SelectItem>
                <SelectItem value="expense">Gastos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {paymentTarget === 'invoice' ? (
            <>
              {!supplierId ? (
                <p className="text-sm text-muted-foreground">Seleccioná un proveedor para ver facturas pendientes.</p>
              ) : isLoadingInvoices ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : !pendingInvoices || pendingInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin facturas pendientes.</p>
              ) : (<>
                {pointsOfSale.length > 1 && (
                  <div className="mb-4 flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Punto de venta</Label>
                    <Select value={posFilter || '_all'} onValueChange={(v) => setPosFilter(v === '_all' ? '' : v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todos</SelectItem>
                        {pointsOfSale.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos.padStart(5, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factura</TableHead>
                        <TableHead>Emisión</TableHead>
                        <TableHead>Vto</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Ya pagado</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredInvoices ?? []).map((inv) => {
                        const added = items.some((i) => i.invoice_id === inv.id);
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono">{inv.full_number}</TableCell>
                            <TableCell className="text-sm">
                              {formatDateUTC(inv.issue_date)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateUTC(inv.due_date)}
                            </TableCell>
                            {/* Los importes están en la moneda de la factura, no
                                en la de la orden: se muestra el símbolo que
                                corresponde para no confundirlos (tsk-576). */}
                            <TableCell className="text-right font-mono text-sm">
                              {currencySymbol(inv.currency)}
                              {inv.total.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground">
                              {currencySymbol(inv.currency)}
                              {inv.already_paid.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {currencySymbol(inv.currency)}
                              {inv.remaining.toFixed(2)}
                              {inv.currency !== orderCurrency && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                  ({inv.currency})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={added ? 'secondary' : 'default'}
                                onClick={() => addInvoiceItem(inv)}
                                disabled={added}
                              >
                                {added ? 'Agregada' : 'Agregar'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>)}
            </>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {expenseCategories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Categoría</Label>
                    <Select value={expenseCategoryFilter || '_all'} onValueChange={(v) => setExpenseCategoryFilter(v === '_all' ? '' : v)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todas</SelectItem>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Vence antes de</Label>
                  <Input
                    type="date"
                    className="w-[160px]"
                    value={expenseDueDateFilter}
                    onChange={(e) => setExpenseDueDateFilter(e.target.value)}
                  />
                </div>
              </div>
              {isLoadingExpenses ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : !filteredExpenses || filteredExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin gastos pendientes.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Vto</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((exp) => {
                        const added = items.some((i) => i.expense_id === exp.id);
                        return (
                          <TableRow key={exp.id}>
                            <TableCell className="font-mono">{exp.full_number}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{exp.description}</TableCell>
                            <TableCell className="text-sm">{exp.category_name}</TableCell>
                            <TableCell className="text-sm">{exp.supplier_name || '-'}</TableCell>
                            <TableCell className="text-sm">
                              {formatDateUTC(exp.due_date)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">${exp.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">${exp.remaining.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={added ? 'secondary' : 'default'}
                                onClick={() => addExpenseItem(exp)}
                                disabled={added}
                              >
                                {added ? 'Agregado' : 'Agregar'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{paymentTarget === 'expense' ? 'Gastos' : 'Facturas'} ({items.length})</CardTitle>
            <CardDescription>
              Importes a pagar — total: {orderSymbol}
              {itemsTotal.toFixed(2)} {orderCurrency}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Descuento global %</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={globalDiscount}
              onChange={(e) => applyGlobalDiscount(e.target.value)}
              className="w-20 h-8 text-right font-mono"
              disabled={items.length === 0}
            />
            <Button size="sm" variant="outline" onClick={addOnAccountItem}>
              <Plus className="size-4 mr-1" />
              Pago a cuenta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Agregá facturas o gastos del listado de arriba, o un ítem libre.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right w-[110px]">Desc. %</TableHead>
                    <TableHead className="text-right w-[170px]">Monto</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">
                        {item.invoice_label ? (
                          <span>{item.invoice_label}{item.expense_id ? <Badge variant="secondary" className="ml-2 text-xs">Gasto</Badge> : null}</span>
                        ) : item.is_on_account ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="default" className="w-fit">Pago a cuenta</Badge>
                            <span className="font-sans text-xs text-muted-foreground">
                              Queda como saldo a favor
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline">Sin documento</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discount_pct}
                          onChange={(e) => updateItemDiscount(idx, e.target.value)}
                          className="text-right font-mono"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateItemAmount(idx, e.target.value)}
                          className="text-right font-mono"
                        />
                        {(parseFloat(item.discount_pct) || 0) > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            sobre ${(parseFloat(item.base_amount) || 0).toFixed(2)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Créditos de notas de crédito (TKT-586). Van entre los comprobantes y los
          pagos porque es el orden en que se lee el neto: se debe esto, se
          descuenta este crédito, se transfiere la diferencia. */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notas de crédito aplicadas ({credits.length})</CardTitle>
            <CardDescription>
              {supplierId
                ? creditNotes.length > 0
                  ? `Crédito aplicado: ${orderSymbol}${creditsTotal.toFixed(2)} ${orderCurrency}`
                  : 'El proveedor no tiene notas de crédito con saldo disponible.'
                : 'Seleccioná un proveedor para ver sus notas de crédito.'}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addCredit}
            disabled={!supplierId || creditNotes.length === 0}
          >
            <Plus className="size-4 mr-1" />
            Aplicar nota de crédito
          </Button>
        </CardHeader>
        {credits.length > 0 && (
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nota de crédito</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead className="text-right">A aplicar</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((credit, idx) => {
                    const note = creditNotes.find((n) => n.id === credit.credit_note_id);
                    const available = availableFor(credit.credit_note_id, idx);
                    const amount = parseFloat(credit.amount) || 0;
                    const symbol = currencySymbol(credit.currency);
                    return (
                      <TableRow key={`credit-${idx}`}>
                        <TableCell className="min-w-[240px]">
                          <Select
                            value={credit.credit_note_id}
                            onValueChange={(value) => handleCreditNoteChange(idx, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Elegí una nota de crédito" />
                            </SelectTrigger>
                            <SelectContent>
                              {creditNotes.map((n) => (
                                <SelectItem key={n.id} value={n.id}>
                                  {n.full_number} · {formatDateUTC(n.issue_date)}
                                  {n.original_invoice_full_number
                                    ? ` · corrige ${n.original_invoice_full_number}`
                                    : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {note && note.currency !== orderCurrency && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              En {note.currency}, se convierte a {orderCurrency}.
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {note ? `${symbol}${note.total.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {note ? `${symbol}${available.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={credit.amount}
                            onChange={(e) => updateCredit(idx, { amount: e.target.value })}
                            className="text-right font-mono"
                          />
                          {amount > available + 0.001 && (
                            <p className="text-[11px] text-destructive mt-1">
                              Supera el crédito disponible
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => removeCredit(idx)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pagos ({payments.length})</CardTitle>
            <CardDescription>
              Métodos de pago — total: {orderSymbol}
              {paymentsTotal.toFixed(2)} {orderCurrency}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canLoadPendingBalance && (
              <Button size="sm" variant="outline" onClick={handleLoadPendingBalance}>
                Cargar saldo pendiente (${selectedRemainingTotal.toFixed(2)})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={addPayment}>
              <Plus className="size-4 mr-1" />
              Agregar pago
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.map((p, idx) => (
            <div key={idx} className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pago #{idx + 1}</span>
                {payments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => removePayment(idx)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Método</Label>
                  <Select
                    value={p.payment_method}
                    onValueChange={(v) => {
                      const newMethod = v as PaymentMethod;
                      updatePayment(idx, {
                        payment_method: newMethod,
                        cash_register_id: null,
                        bank_account_id: null,
                        supplier_payment_method_id: pickDefaultMethodForPaymentMethod(
                          supplierPaymentMethods,
                          newMethod
                        ),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={p.amount}
                    onChange={(e) => updatePayment(idx, { amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Referencia (opcional)</Label>
                  <Input
                    value={p.reference}
                    onChange={(e) => updatePayment(idx, { reference: e.target.value })}
                  />
                </div>

                {p.payment_method === 'CASH' && (
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Caja</Label>
                    <Select
                      value={p.cash_register_id ?? ''}
                      onValueChange={(v) => updatePayment(idx, { cash_register_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar caja" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashRegisters.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={c.id}
                            disabled={!c.has_open_session}
                          >
                            {c.code} — {c.name}
                            {!c.has_open_session && ' (sin sesión abierta)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cashRegisters.every((c) => !c.has_open_session) && (
                      <p className="text-xs text-amber-600">
                        Ninguna caja tiene sesión abierta. Abrí una desde Tesorería → Cajas
                        antes de confirmar el pago en efectivo.
                      </p>
                    )}
                  </div>
                )}

                {['TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'DEBIN_CREDIN'].includes(p.payment_method) && (
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Cuenta bancaria</Label>
                    <Select
                      value={p.bank_account_id ?? ''}
                      onValueChange={(v) => updatePayment(idx, { bank_account_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.bank_name} — {a.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {p.payment_method === 'CHECK' && (
                  <CheckPaymentField
                    checkKind={p.check_kind}
                    checkId={p.check_id}
                    currentOrderId={initialData?.id}
                    onChange={(patch) => updatePayment(idx, patch)}
                  />
                )}

                {(p.payment_method === 'DEBIT_CARD' || p.payment_method === 'CREDIT_CARD') && (
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Últimos 4 dígitos (opcional)</Label>
                    <Input
                      value={p.card_last4}
                      maxLength={4}
                      onChange={(e) => updatePayment(idx, { card_last4: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                )}

                {(() => {
                  if (supplierPaymentMethods.length === 0) return null;
                  if (
                    p.payment_method !== 'TRANSFER' &&
                    p.payment_method !== 'CHECK'
                  )
                    return null;
                  const filtered = filterMethodsByPaymentMethod(
                    supplierPaymentMethods,
                    p.payment_method
                  );
                  if (filtered.length === 0) return null;
                  return (
                    <div className="md:col-span-3 space-y-1.5">
                      <Label>Destino del proveedor (opcional)</Label>
                      <Select
                        value={p.supplier_payment_method_id ?? '__none__'}
                        onValueChange={(v) =>
                          updatePayment(idx, {
                            supplier_payment_method_id: v === '__none__' ? null : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sin destino —</SelectItem>
                          {filtered.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {describeSupplierMethod(m)}
                              {m.is_default ? ' (Predeterminado)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Retenciones</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addRetention}
              disabled={retentionTypes.length === 0 || itemsTotal <= 0}
            >
              <Plus className="size-4 mr-1" /> Agregar retención
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {retentionTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay tipos de retención configurados. Andá a Configuración → Impuestos para
              crear los que necesites.
            </p>
          ) : retentions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Si corresponde aplicar retenciones (Ganancias, IIBB, IVA, SUSS, etc.), agregalas.
              Reducen el neto a pagar al proveedor.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Tipo</TableHead>
                  <TableHead className="w-[140px]">Base</TableHead>
                  <TableHead className="w-[100px]">Alícuota %</TableHead>
                  <TableHead className="w-[140px] text-right">Monto</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retentions.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Select
                        value={r.tax_type_id}
                        onValueChange={(v) => handleRetentionTypeChange(idx, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {retentionTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        step="0.01"
                        value={r.base_amount}
                        onChange={(e) => updateRetention(idx, { base_amount: e.target.value })}
                        onBlur={() => recalcRetention(idx)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        step="0.0001"
                        value={r.rate}
                        onChange={(e) => updateRetention(idx, { rate: e.target.value })}
                        onBlur={() => recalcRetention(idx)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm text-right font-mono"
                        type="number"
                        step="0.01"
                        value={r.amount}
                        onChange={(e) => updateRetention(idx, { amount: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        value={r.notes}
                        onChange={(e) => updateRetention(idx, { notes: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => removeRetention(idx)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {discountTotal > 0 && (
                <div>
                  <span className="text-muted-foreground">Subtotal (sin desc.):</span>{' '}
                  <span className="font-mono font-semibold">${grossItemsTotal.toFixed(2)}</span>
                </div>
              )}
              {discountTotal > 0 && (
                <div>
                  <span className="text-muted-foreground">Descuento:</span>{' '}
                  <span className="font-mono font-semibold text-amber-600">
                    −{orderSymbol}
                    {discountTotal.toFixed(2)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Total {paymentTarget === 'expense' ? 'gastos' : 'facturas'}:</span>{' '}
                <span className="font-mono font-semibold">
                  {orderSymbol}
                  {itemsTotal.toFixed(2)}
                </span>
              </div>
              {retentionsTotal > 0 && (
                <div>
                  <span className="text-muted-foreground">Retenciones:</span>{' '}
                  <span className="font-mono font-semibold text-amber-600">
                    −{orderSymbol}
                    {retentionsTotal.toFixed(2)}
                  </span>
                </div>
              )}
              {creditsTotal > 0 && (
                <div>
                  <span className="text-muted-foreground">Notas de crédito:</span>{' '}
                  <span className="font-mono font-semibold text-emerald-600">
                    −{orderSymbol}
                    {creditsTotal.toFixed(2)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Neto a pagar:</span>{' '}
                <span className="font-mono font-semibold">
                  {orderSymbol}
                  {netToPay.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total pagos:</span>{' '}
                <span className="font-mono font-semibold">
                  {orderSymbol}
                  {paymentsTotal.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Diferencia:</span>{' '}
                <span
                  className={`font-mono font-semibold ${
                    Math.abs(diff) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${diff.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isPending || Math.abs(diff) >= 0.01}>
            {isPending
              ? isEdit
                ? 'Guardando...'
                : 'Creando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Crear orden'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
