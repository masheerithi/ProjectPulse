import { COLORS } from "../../constants/theme";

/**
 * active-only mode: <StatusBadge active={x} />  — plain read-only pill (unchanged behavior).
 * toggle mode: <StatusBadge active={x} onToggle={fn} busy={bool} /> — renders as a clickable
 * switch that calls onToggle() immediately, no edit panel needed. Per meeting note #1.
 */
export function StatusBadge({ active, onLabel = "Active", offLabel = "Inactive", onToggle, busy }) {
  if (!onToggle) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px",
        borderRadius: 999, fontSize: 12.5, fontWeight: 600,
        background: active ? COLORS.successSoft : COLORS.dangerSoft,
        color: active ? COLORS.success : COLORS.danger,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? COLORS.success : COLORS.danger }} />
        {active ? onLabel : offLabel}
      </span>
    );
  }

  return (
    <div
      onClick={() => !busy && onToggle(!active)}
      title="Click to toggle status"
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      <div style={{
        width: 34, height: 19, borderRadius: 999, background: active ? COLORS.success : "#D7DCE6",
        position: "relative", transition: "background 0.15s", flexShrink: 0,
      }}>
        <div style={{
          width: 15, height: 15, borderRadius: "50%", background: "#fff", position: "absolute", top: 2,
          left: active ? 17 : 2, transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: active ? COLORS.success : COLORS.danger }}>
        {active ? onLabel : offLabel}
      </span>
    </div>
  );
}