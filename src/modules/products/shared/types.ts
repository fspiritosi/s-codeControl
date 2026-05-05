export interface Product {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  unit_of_measure: string;
  cost_price: number;
  sale_price: number;
  vat_rate: number;
  purchase_sale_type: string;
  profit_margin_percent: number | null;
  track_stock: boolean;
  min_stock: number | null;
  max_stock: number | null;
  barcode: string | null;
  brand: string | null;
  status: string;
  created_at: string;
}

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
  RAW_MATERIAL: 'Materia Prima',
  CONSUMABLE: 'Consumible',
};

export const PRODUCT_PURCHASE_SALE_TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Solo compra',
  PURCHASE_SALE: 'Compra y venta',
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DISCONTINUED: 'Descontinuado',
};

export const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'UN', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'G', label: 'Gramo' },
  { value: 'L', label: 'Litro' },
  { value: 'ML', label: 'Mililitro' },
  { value: 'M', label: 'Metro' },
  { value: 'CM', label: 'Centímetro' },
  { value: 'M2', label: 'Metro²' },
  { value: 'M3', label: 'Metro³' },
  { value: 'PAR', label: 'Par' },
  { value: 'DOCENA', label: 'Docena' },
  { value: 'CAJA', label: 'Caja' },
  { value: 'PAQUETE', label: 'Paquete' },
  { value: 'SET', label: 'Set' },
  { value: 'HORA', label: 'Hora' },
  { value: 'DIA', label: 'Día' },
];

export const VAT_RATE_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '10.5', label: '10.5%' },
  { value: '21', label: '21%' },
  { value: '27', label: '27%' },
];
