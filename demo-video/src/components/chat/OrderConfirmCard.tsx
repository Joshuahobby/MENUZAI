import { BRAND, fmtPrice } from "../../constants";
import { fontHeadline, fontBody } from "../../utils/fonts";
import { CheckCircleIcon, TableRestaurantIcon } from "../../components/ui/Icons";

interface OrderItem { name: string; qty: number; price: number; }

interface OrderConfirmCardProps {
  items: OrderItem[];
  tableNumber: string;
  confirmed?: boolean;
  opacity?: number;
  translateY?: number;
}

export function OrderConfirmCard({ items, tableNumber, confirmed = false, opacity = 1, translateY = 0 }: OrderConfirmCardProps) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div
      style={{
        background: BRAND.surface,
        border: `1.5px solid ${BRAND.primaryContainer}40`,
        borderRadius: 16,
        padding: "14px 16px",
        opacity,
        transform: `translateY(${translateY}px)`,
        boxShadow: `0 4px 20px ${BRAND.primaryContainer}15`,
      }}
    >
      <div style={{ fontFamily: fontBody, fontWeight: 800, fontSize: 10, color: BRAND.primaryContainer, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
        Confirm Your Order
      </div>

      {/* Items */}
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: fontBody, fontSize: 12, color: BRAND.onSurface }}>
            {item.name} <span style={{ fontWeight: 700, color: BRAND.primaryContainer }}>Ã—{item.qty}</span>
          </span>
          <span style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: BRAND.onSurface }}>{fmtPrice(item.price * item.qty)}</span>
        </div>
      ))}

      {/* Table */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 10 }}>
        <TableRestaurantIcon size={12} color={BRAND.secondary} />
        <span style={{ fontFamily: fontBody, fontSize: 11, color: BRAND.secondary }}>Table {tableNumber}</span>
      </div>

      {/* Total */}
      <div style={{ borderTop: `1px solid ${BRAND.outlineVariant}40`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: fontBody, fontWeight: 600, fontSize: 12, color: BRAND.secondary }}>Total</span>
        <span style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 16, color: BRAND.primaryContainer }}>{fmtPrice(total)}</span>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: confirmed ? BRAND.tertiaryContainer : BRAND.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {confirmed && <CheckCircleIcon size={14} color="white" />}
          <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 13, color: "white" }}>
            {confirmed ? "Order Confirmed!" : "Place Order"}
          </span>
        </div>
        {!confirmed && (
          <div style={{ padding: "10px 16px", borderRadius: 12, border: `1px solid ${BRAND.outlineVariant}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: fontBody, fontWeight: 600, fontSize: 13, color: BRAND.secondary }}>Change</span>
          </div>
        )}
      </div>
    </div>
  );
}

