import { BRAND, fmtPrice } from "../../constants";
import { fontHeadline, fontBody } from "../../utils/fonts";
import { StatusBadge } from "./StatusBadge";
import { RobotIcon } from "../../components/ui/Icons";

interface OrderItem { name: string; qty: number; price: number; }

interface OrderCardProps {
  customerName: string;
  tableNumber: string;
  status: "pending" | "preparing" | "confirmed";
  total: number;
  source: string;
  items: OrderItem[];
  isNew?: boolean;
  opacity?: number;
  translateY?: number;
  scale?: number;
}

export function OrderCard({ customerName, tableNumber, status, total, source, items, isNew, opacity = 1, translateY = 0, scale = 1 }: OrderCardProps) {
  return (
    <div
      style={{
        background: BRAND.surfaceContainerLowest,
        borderRadius: 24,
        padding: "20px 22px",
        border: isNew ? `1.5px solid ${BRAND.primaryContainer}30` : `1px solid ${BRAND.surfaceContainer}`,
        boxShadow: isNew ? `0 0 0 4px ${BRAND.primaryContainer}08` : "0 1px 4px rgba(0,0,0,0.04)",
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Table pill */}
            <div style={{ padding: "3px 10px", borderRadius: 10, background: `${BRAND.primaryContainer}15`, border: `1px solid ${BRAND.primaryContainer}25` }}>
              <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 10, color: BRAND.primaryContainer }}>Table {tableNumber}</span>
            </div>
            {/* Source badge */}
            {source === "ai_waiter" && (
              <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 10, background: "#ede9fe", border: "1px solid #8b5cf620" }}>
                <RobotIcon size={10} color="#7c3aed" />
                <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 9, color: "#7c3aed" }}>AI Waiter</span>
              </div>
            )}
            {isNew && (
              <div style={{ padding: "2px 8px", borderRadius: 8, background: BRAND.primaryContainer }}>
                <span style={{ fontFamily: fontBody, fontWeight: 800, fontSize: 9, color: "white", letterSpacing: "0.06em" }}>NEW</span>
              </div>
            )}
          </div>
          <span style={{ fontFamily: fontHeadline, fontWeight: 700, fontSize: 16, color: BRAND.onSurface }}>{customerName}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: fontBody, fontSize: 12, color: BRAND.secondary }}>
              <span style={{ fontWeight: 700, color: BRAND.primaryContainer }}>{item.qty}x</span> {item.name}
            </span>
            <span style={{ fontFamily: fontBody, fontSize: 12, color: BRAND.secondary, fontWeight: 600 }}>{fmtPrice(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ borderTop: `1px solid ${BRAND.outlineVariant}30`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: fontBody, fontSize: 11, color: BRAND.secondary, fontWeight: 600 }}>Total Amount</span>
        <span style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 18, color: BRAND.primaryContainer }}>{fmtPrice(total)}</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        {status === "pending" && (
          <>
            <div style={{ flex: 1, padding: "9px 0", borderRadius: 14, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: BRAND.error }}>Decline</span>
            </div>
            <div style={{ flex: 2, padding: "9px 0", borderRadius: 14, background: BRAND.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: "white" }}>Accept Order</span>
            </div>
          </>
        )}
        {status === "preparing" && (
          <>
            <div style={{ flex: 1, padding: "9px 0", borderRadius: 14, border: `1px solid ${BRAND.outlineVariant}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: fontBody, fontWeight: 600, fontSize: 12, color: BRAND.secondary }}>Cancel</span>
            </div>
            <div style={{ flex: 2, padding: "9px 0", borderRadius: 14, background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: "white" }}>Mark Ready</span>
            </div>
          </>
        )}
        {status === "confirmed" && (
          <div style={{ flex: 1, padding: "9px 0", borderRadius: 14, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: "#065f46" }}>Served âœ“</span>
          </div>
        )}
      </div>
    </div>
  );
}

