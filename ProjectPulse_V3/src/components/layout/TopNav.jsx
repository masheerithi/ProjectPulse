import {
  LayoutDashboard,
  LogOut,
  Building2,
  FolderKanban,
  DollarSign,
  ScrollText,
} from "lucide-react";
import { Logo } from "../common/Logo";
import { NavItem } from "./NavItem";
import { ADMIN_MODULES, AUDIT_MODULES, FINANCE_MODULES, PROJECT_MODULES } from "../../constants/modules";
import { COLORS } from "../../constants/theme";

export function TopNav({ user, current, onNavigateHome, onOpenModule, onLogout }) {
  const inAdmin = ADMIN_MODULES.some((m) => m.key === current);
  const inProject = PROJECT_MODULES.some((m) => m.key === current);
  const inFinance = FINANCE_MODULES.some((m) => m.key === current);
  const inAudit = AUDIT_MODULES.some((m) => m.key === current);

  return (
    <div style={{
      height: 60, background: COLORS.navy, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 22px", flexShrink: 0, position: "relative", zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ cursor: "pointer" }} onClick={onNavigateHome}><Logo /></div>
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavItem label="Dashboard" icon={LayoutDashboard} active={current === "dashboard"} onClick={onNavigateHome} />
          <NavItem
            label="Admin"
            icon={Building2}
            active={inAdmin}
            onClick={() => onOpenModule(ADMIN_MODULES.find((m) => m.implemented)?.key || ADMIN_MODULES[0].key)}
          />
          <NavItem
            label="Project Management"
            icon={FolderKanban}
            active={inProject}
            onClick={() => onOpenModule(PROJECT_MODULES.find((m) => m.implemented)?.key || PROJECT_MODULES[0].key)}
          />
          <NavItem
            label="Finance"
            icon={DollarSign}
            active={inFinance}
            onClick={() => onOpenModule(FINANCE_MODULES.find((m) => m.implemented)?.key || FINANCE_MODULES[0].key)}
          />
          <NavItem
            label="Audits"
            icon={ScrollText}
            active={inAudit}
            onClick={() => onOpenModule(AUDIT_MODULES.find((m) => m.implemented)?.key || AUDIT_MODULES[0].key)}
          />
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: COLORS.navySoft, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
        }}>
          {user?.[0]?.toUpperCase() || "A"}
        </div>
        <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 600 }}>{user || "Administrator"}</div>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${COLORS.navyBorder}`,
          color: "#C6CCE6", borderRadius: 8, padding: "6px 11px", fontSize: 12.5, cursor: "pointer",
        }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}
