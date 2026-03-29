export interface Warehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  province: string | null;
  is_active: boolean;
  created_at: string;
  _count?: { stocks: number; movements: number };
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  product?: { id: string; code: string; name: string; unit_of_measure: string };
  warehouse?: { id: string; code: string; name: string };
}

export interface StockMovement {
  id: string;
  company_id: string;
  warehouse_id: string;
  product_id: string;
  type: string;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  date: string;
  created_by: string | null;
  created_at: string;
  product?: { code: string; name: string; unit_of_measure: string };
  warehouse?: { code: string; name: string };
}

export const WAREHOUSE_TYPE_LABELS: Record<string, string> = {
  MAIN: 'Principal',
  BRANCH: 'Sucursal',
  TRANSIT: 'En tránsito',
  VIRTUAL: 'Virtual',
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  ADJUSTMENT: 'Ajuste',
  TRANSFER_OUT: 'Transferencia (salida)',
  TRANSFER_IN: 'Transferencia (entrada)',
  RETURN: 'Devolución',
  PRODUCTION: 'Producción',
  LOSS: 'Pérdida',
  WITHDRAWAL: 'Retiro',
};

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  PURCHASE: 'text-green-700 bg-green-50 border-green-200',
  SALE: 'text-blue-700 bg-blue-50 border-blue-200',
  ADJUSTMENT: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  TRANSFER_OUT: 'text-orange-700 bg-orange-50 border-orange-200',
  TRANSFER_IN: 'text-teal-700 bg-teal-50 border-teal-200',
  RETURN: 'text-purple-700 bg-purple-50 border-purple-200',
  PRODUCTION: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  LOSS: 'text-red-700 bg-red-50 border-red-200',
  WITHDRAWAL: 'text-amber-700 bg-amber-50 border-amber-200',
};
