# COD-571 — Revisar precios en OC y Factura

## Resumen

Se incorpora la funcionalidad de "Revisar precios" en el detalle de Ordenes de Compra y Facturas de Compra, permitiendo al usuario detectar diferencias entre el precio cargado en cada linea (`unit_cost`) y el `cost_price` actual del producto, y aplicar selectivamente la actualizacion linea por linea.

## Estados editables

- **Orden de Compra** (`purchase_order_status`): `DRAFT` y `PENDING_APPROVAL`.
- **Factura de Compra** (`purchase_invoice_status`): solo `DRAFT`.

Ambos enums verificados en `prisma/schema.prisma`.

## Estructura de descuentos

Las tablas `purchase_order_lines` y `purchase_invoice_lines` **no tienen campos de descuento** (ni porcentual ni fijo). El calculo de totales por linea es:

```
subtotal   = quantity * unit_cost
vat_amount = subtotal * (vat_rate / 100)
total      = subtotal + vat_amount
```

Por lo tanto el recalculo se reduce a recomputar subtotal/IVA/total con el nuevo `unit_cost`. No fue necesario manejar la rama de descuentos descrita en el plan original.

## Archivos creados

- `src/modules/purchasing/shared/price-review/actions.server.ts`
  - `reviewPurchaseOrderPrices(orderId)`
  - `reviewPurchaseInvoicePrices(invoiceId)`
  - `applyPurchaseOrderPriceUpdates(orderId, lineIds[])`
  - `applyPurchaseInvoicePriceUpdates(invoiceId, lineIds[])`
  - Scope por `companyId` desde cookie `actualComp`.
  - Apply* validan estado, recalculan en `prisma.$transaction`, y revalidan paths.
- `src/modules/purchasing/shared/price-review/components/PriceReviewDialog.tsx`
  - Modal con checkbox por linea, header "marcar todos" (con estado indeterminate), botones cancelar / aplicar.
  - Mensaje "Valores actualizados" cuando no hay diferencias.
- `src/modules/purchasing/shared/price-review/components/PriceReviewButton.tsx`
  - Botón unificado que dispara el review, abre el dialog y aplica.

## Archivos modificados

- `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderDetail.tsx`
  - Agregado boton `PriceReviewButton` visible solo en `DRAFT` o `PENDING_APPROVAL`.
- `src/app/dashboard/purchasing/invoices/[id]/page.tsx`
  - Agregado boton `PriceReviewButton` visible solo en `DRAFT`.

## Decisiones tomadas

1. **Sin discount logic**: el schema no contempla descuentos en lineas, por lo tanto la rama porcentual/fija del plan no aplica.
2. **Tolerancia**: las diferencias se reportan solo si `|nuevo - actual| >= 0.01`.
3. **Lineas sin product_id**: se ignoran para review (no hay producto contra el cual comparar).
4. **`other_taxes` en facturas**: se preserva en el recalculo del total general (`total = subtotal_acc + vat_acc + other_taxes`).
5. **Componente shared**: en lugar de duplicar dialog para OC y factura, se hizo un componente unico parametrizado por `type: 'order' | 'invoice'`.

## Validaciones

- `npm run check-types`: OK
- `npm run build`: OK

## Riesgos

- El recalculo de totales del documento se hace sumando todas las lineas (no se confia en el subtotal previo). Si en el futuro se agregan campos como `discount_amount` o ajustes manuales en el header, hay que adaptarlo.
- `other_taxes` se mantiene; si en algun momento se permite editarlo desde otro flujo, no afecta este recalculo.
