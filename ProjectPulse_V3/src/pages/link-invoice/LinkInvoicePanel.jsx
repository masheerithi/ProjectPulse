import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { COLORS, inputStyle, labelStyle } from "../../constants/theme";

export function LinkInvoicePanel({ mode, data, clients, projects, currencies, billingPeriods, invoiceStatuses, billingRecords, saving, error, onCancel, onClose, onSubmit }) {
  const [form, setForm] = useState(data);
  useEffect(() => setForm(data), [data]);

  const billingLabel = (b) => {
    if (b.milestoneName) return b.milestoneName;
    return `Billing #${b.id}${b.amount ? ` — ${b.amount}` : ""}`;
  };

  return (
    <div style={{ width: 360, background: COLORS.card, borderLeft: `1px solid ${COLORS.border}`, flexShrink: 0, display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(15,20,40,0.06)" }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{mode === "add" ? "Add Invoice" : "Edit Invoice"}</div>
          <div style={{ fontSize: 12, color: COLORS.accent, marginTop: 2 }}>Fill all required fields below</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted }}><X size={18} /></button>
      </div>
      <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
        <label style={labelStyle}>Invoice Number*</label>
        <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="e.g. INV-1003" style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 16 }}>Client*</label>
        <select value={form.clientId || ""} onChange={(e) => setForm({ ...form, clientId: e.target.value })} style={inputStyle}>
          <option value="">Select client</option>
          {(clients || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={{ ...labelStyle, marginTop: 16 }}>Project</label>
        <select value={form.projectId || ""} onChange={(e) => setForm({ ...form, projectId: e.target.value })} style={inputStyle}>
          <option value="">— No project —</option>
          {(projects || []).map((p) => <option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
        </select>

        <label style={{ ...labelStyle, marginTop: 16 }}>Linked Billing Record</label>
        <select value={form.billingId || ""} onChange={(e) => setForm({ ...form, billingId: e.target.value })} style={inputStyle}>
          <option value="">None — link directly to project/client</option>
          {(billingRecords || []).map((b) => <option key={b.id} value={b.id}>{billingLabel(b)}</option>)}
        </select>

        <label style={{ ...labelStyle, marginTop: 16 }}>Invoice Date</label>
        <input type="date" value={form.invoiceDate || ""} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} style={inputStyle} />

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Amount*</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 450000" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Currency</label>
            <select value={form.currencyId || ""} onChange={(e) => setForm({ ...form, currencyId: e.target.value })} style={inputStyle}>
              <option value="">—</option>
              {(currencies || []).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
        </div>

        <label style={{ ...labelStyle, marginTop: 16 }}>Billing Period</label>
        <select value={form.billingPeriodId || ""} onChange={(e) => setForm({ ...form, billingPeriodId: e.target.value })} style={inputStyle}>
          <option value="">— None —</option>
          {(billingPeriods || []).map((p) => <option key={p.id} value={p.id}>{p.periodName}</option>)}
        </select>

        <label style={{ ...labelStyle, marginTop: 16 }}>Total Billable Hours</label>
        <input type="number" min="0" step="0.5" value={form.totalBillableHours || ""} onChange={(e) => setForm({ ...form, totalBillableHours: e.target.value })} placeholder="e.g. 160" style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 16 }}>Due Date</label>
        <input type="date" value={form.dueDate || ""} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 16 }}>Invoice Status</label>
        <select value={form.invoiceStatusId || ""} onChange={(e) => setForm({ ...form, invoiceStatusId: e.target.value })} style={inputStyle}>
          <option value="">Select status…</option>
          {(invoiceStatuses || []).map((s) => <option key={s.guid} value={s.guid}>{s.name}</option>)}
        </select>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Payment Date</label>
            <input type="date" value={form.paymentDate || ""} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Payment Reference</label>
            <input value={form.paymentReference || ""} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} placeholder="e.g. UTR / cheque #" style={inputStyle} />
          </div>
        </div>

        <label style={{ ...labelStyle, marginTop: 16 }}>Finance Remarks</label>
        <textarea value={form.financeRemarks || ""} onChange={(e) => setForm({ ...form, financeRemarks: e.target.value })} placeholder="Notes for Finance…" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: "12px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>Active</span>
          <div onClick={() => setForm({ ...form, active: !form.active })} style={{ width: 40, height: 22, borderRadius: 999, background: form.active ? COLORS.accent : "#D7DCE6", position: "relative", cursor: "pointer" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.active ? 20 : 2, transition: "left 0.15s" }} />
          </div>
        </div>

        {error && <div style={{ display: "flex", gap: 8, alignItems: "center", color: COLORS.danger, fontSize: 12.5, marginTop: 16 }}><AlertCircle size={14} /> {error}</div>}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: COLORS.text }}>Cancel</button>
        <button onClick={() => onSubmit(form)} disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.75 : 1, display: "flex", alignItems: "center", gap: 7 }}>
          {saving && <Loader2 size={13} className="spin" />}
          {saving ? "Saving…" : "Submit"}
        </button>
      </div>
    </div>
  );
}