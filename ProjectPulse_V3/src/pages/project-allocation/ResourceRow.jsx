import {
  X,
  User,
} from "lucide-react";
import { COLORS, inputStyle, labelStyle } from "../../constants/theme";

export function ResourceRow({ res, onChange, onRemove, lookups }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, marginBottom: 10, position: "relative" }}>
      <button
        onClick={onRemove}
        style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted }}
        title="Remove resource"
      >
        <X size={14} />
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Resource (User)*</label>
          <select value={res.userId} onChange={(e) => onChange({ ...res, userId: e.target.value })} style={inputStyle}>
            <option value="">Select user</option>
            {lookups.users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Role*</label>
          <select value={res.roleId} onChange={(e) => onChange({ ...res, roleId: e.target.value })} style={inputStyle}>
            <option value="">Select role</option>
            {lookups.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div>
          <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Allocation %</label>
          <input type="number" min={0} max={100} value={res.allocationPct}
            onChange={(e) => onChange({ ...res, allocationPct: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Weekly Hours</label>
          <input type="number" min={0} max={168} value={res.weeklyHours}
            onChange={(e) => onChange({ ...res, weeklyHours: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div>
          <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Start Date</label>
          <input type="date" value={res.startDate} onChange={(e) => onChange({ ...res, startDate: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>End Date</label>
          <input type="date" value={res.endDate} onChange={(e) => onChange({ ...res, endDate: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.text }}>Billable</span>
        <div onClick={() => onChange({ ...res, billable: !res.billable })} style={{
          width: 36, height: 20, borderRadius: 999, background: res.billable ? COLORS.accent : "#D7DCE6", position: "relative", cursor: "pointer",
        }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: res.billable ? 18 : 2, transition: "left 0.15s" }} />
        </div>
      </div>
    </div>
  );
}
