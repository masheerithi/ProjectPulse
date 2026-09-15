import { ADMIN_MODULES, AUDIT_MODULES, FINANCE_MODULES, PROJECT_MODULES } from "../../constants/modules";
import { COLORS } from "../../constants/theme";

export function ModuleSidebar({ current, onSelect }) {
  const inProject = PROJECT_MODULES.some((m) => m.key === current);
  const inFinance = FINANCE_MODULES.some((m) => m.key === current);
  const inAudit = AUDIT_MODULES.some((m) => m.key === current);
  const groupModules = inFinance ? FINANCE_MODULES : inAudit ? AUDIT_MODULES : inProject ? PROJECT_MODULES : ADMIN_MODULES;
  const groupLabel = inFinance ? "Finance" : inAudit ? "Audits" : inProject ? "Project Management" : "Admin";
 return (
    <div style={{
      width: 236, background: COLORS.navy, flexShrink: 0, padding: "18px 10px",
      display: "flex", flexDirection: "column", gap: 2, overflowY: "auto",
    }}>
      <div style={{ padding: "6px 12px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "#7783AA", textTransform: "uppercase" }}>
        {groupLabel}
      </div>
      {groupModules.map((m) => {
        const Icon = m.icon;
        const active = current === m.key;
        return (
          <div
            key={m.key}
            onClick={() => onSelect(m.key)}
            style={{
              display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 9,
              cursor: "pointer", fontSize: 13.5, fontWeight: 500,
              background: active ? COLORS.accent : "transparent",
              color: active ? "#fff" : "#C6CCE6",
            }}
          >
            <span style={{
              width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "rgba(255,255,255,0.18)" : `${m.color}26`, color: active ? "#fff" : m.color, flexShrink: 0,
            }}>
              <Icon size={13} />
            </span>
            {m.label}
          </div>
        );
      })}
    </div>
  );
}
