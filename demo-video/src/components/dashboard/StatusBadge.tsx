import { BRAND } from "../../constants";
import { fontBody } from "../../utils/fonts";

type Status = "pending" | "preparing" | "confirmed";

const STATUS_STYLE: Record<Status, { dot: string; bg: string; text: string; label: string }> = {
  pending:   { dot: BRAND.amber500,   bg: "#fef3c720", text: "#92400e", label: "Pending"   },
  preparing: { dot: "#3b82f6",        bg: "#dbeafe20", text: "#1e40af", label: "Preparing" },
  confirmed: { dot: BRAND.tertiaryContainer, bg: "#d1fae520", text: "#065f46", label: "Ready âœ“" },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: s.bg, border: `1px solid ${s.dot}30` }}>
      <div style={{ width: 6, height: 6, borderRadius: 3, background: s.dot }} />
      <span style={{ fontFamily: fontBody, fontSize: 10, fontWeight: 700, color: s.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {s.label}
      </span>
    </div>
  );
}

