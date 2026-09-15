import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Receipt,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  callInvoiceFlow,
  callInvoiceStatusFlow,
  callBillingFlow,
  callClientFlow,
  callProjectFlow,
  callCurrencyFlow,
  callBillingPeriodFlow,
} from "../../api/flows";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { EmptyState } from "../../components/common/EmptyState";
import { COLORS, cardStyle, inputStyle } from "../../constants/theme";
import { LinkInvoicePanel } from "./LinkInvoicePanel";
import { logAudit } from "../../utils/audit";

const EMPTY_FORM = {
  guid: "", invoiceNumber: "", clientId: "", projectId: "", billingId: "",
  invoiceDate: "", amount: "", currencyId: "", billingPeriodId: "",
  totalBillableHours: "", dueDate: "", invoiceStatusId: "",
  paymentDate: "", paymentReference: "", financeRemarks: "", active: true,
};

export function LinkInvoicePage() {
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [billingPeriods, setBillingPeriods] = useState([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [panel, setPanel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setListError("");
    callInvoiceFlow("LIST").then((res) => {
      setRows(res.data);
      setLoading(false);
    }).catch((e) => {
      setListError(e.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { callClientFlow("LIST").then((res) => setClients(res.data)); }, []);
  useEffect(() => { callProjectFlow("LIST").then((res) => setProjects(res.data)); }, []);
  useEffect(() => { callCurrencyFlow("LIST").then((res) => setCurrencies(res.data)).catch(() => {}); }, []);
  useEffect(() => { callBillingPeriodFlow("LIST").then((res) => setBillingPeriods(res.data)).catch(() => {}); }, []);
  useEffect(() => { callInvoiceStatusFlow("LIST").then((res) => setInvoiceStatuses(res.data)).catch(() => {}); }, []);
  useEffect(() => { callBillingFlow("LIST").then((res) => setBillingRecords(res.data)).catch(() => {}); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);

  const clientName = (id) => clients.find((c) => String(c.id) === String(id))?.name || "—";
  const projectLabel = (id) => {
    if (!id) return "—";
    const p = projects.find((x) => String(x.id) === String(id));
    return p ? `${p.projectCode} — ${p.projectName}` : "—";
  };
  const currencyCode = (id) => currencies.find((c) => String(c.id) === String(id))?.code || "INR";
  const periodName = (id) => billingPeriods.find((p) => String(p.id) === String(id))?.periodName || "—";
  const invoiceStatusName = (id) => invoiceStatuses.find((s) => String(s.guid) === String(id))?.name || "—";
  const billingLabel = (id) => {
    if (!id) return "—";
    const b = billingRecords.find((x) => String(x.id) === String(id));
    if (!b) return "—";
    return b.milestoneName || `Billing #${b.id}`;
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (r.invoiceNumber || "").toLowerCase().includes(q) || clientName(r.clientId).toLowerCase().includes(q);
    const matchesStatus = !statusFilter || invoiceStatusName(r.invoiceStatusId) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = rows.filter((r) => r.dueDate && r.dueDate < today && !r.paymentDate).length;
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const dueSoonCount = rows.filter((r) => r.dueDate && r.dueDate >= today && r.dueDate <= in7Days && !r.paymentDate).length;
  const unlinkedCount = rows.filter((r) => !r.billingId).length;

  const kpis = [
    { label: "Total Invoices", value: String(rows.length), icon: Receipt, color: COLORS.accent },
    { label: "Overdue", value: String(overdueCount), icon: AlertCircle, color: COLORS.danger },
    { label: "Due Within 7 Days", value: String(dueSoonCount), icon: CheckCircle2, color: COLORS.success },
    { label: "Not Linked to Billing", value: String(unlinkedCount), icon: Receipt, color: "#F59E0B" },
  ];

  const submitPanel = (form) => {
    if (!form.invoiceNumber?.trim() || !form.clientId || !form.amount) {
      setErr("Invoice Number, Client and Amount are required.");
      return;
    }
    setSaving(true); setErr("");
    const action = form.guid ? "EDIT" : "CREATE";
    callInvoiceFlow(action, form)
      .then((res) => {
        setRows(res.data);
        setSaving(false);
        setPanel(null);
        logAudit("Link Invoice", form.guid ? "Update" : "Create", form.invoiceNumber);
        setToast(form.guid ? "Invoice updated." : "Invoice added.");
      })
      .catch((e) => {
        setSaving(false);
        setErr(e.message);
      });
  };

  const confirmDeleteRow = () => {
    if (!confirmDelete) return;
    setDeleting(true);
    callInvoiceFlow("DELETE", confirmDelete)
      .then((res) => {
        setRows(res.data);
        setDeleting(false);
        setConfirmDelete(null);
        logAudit("Link Invoice", "Delete", confirmDelete.invoiceNumber);
        setToast("Invoice deleted.");
      })
      .catch((e) => {
        setDeleting(false);
        setToast(`Delete failed: ${e.message}`);
      });
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
      <div style={{ flex: 1, padding: 26, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.text }}>Link Invoice</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13.5 }}>Link invoices to projects, clients and billing records</div>
          </div>
          <button
            onClick={() => setPanel({ mode: "add", data: { ...EMPTY_FORM } })}
            style={{ display: "flex", alignItems: "center", gap: 7, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
          >
            <Plus size={15} /> Add Invoice
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.textMuted, fontSize: 12.5, fontWeight: 600 }}>{k.label}</span>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: `${k.color}1F`, color: k.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={15} /></span>
                </div>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.text, marginTop: 10 }}>{k.value}</div>
              </div>
            );
          })}
        </div>

        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>Invoices <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>({filtered.length})</span></div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 11px", width: 240 }}>
                <Search size={14} color={COLORS.textMuted} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice # or client" style={{ border: "none", outline: "none", fontSize: 13, width: "100%", fontFamily: "Inter, sans-serif" }} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 150, padding: "7px 11px" }}>
                <option value="">All Statuses</option>
                {invoiceStatuses.map((s) => <option key={s.guid} value={s.name}>{s.name}</option>)}
              </select>
              <button onClick={refresh} style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLORS.border}`, background: "#fff", borderRadius: 8, padding: "0 12px", fontSize: 12.5, cursor: "pointer", color: COLORS.text }}>
                <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["Invoice #", "Client", "Project", "Billing Record", "Invoice Date", "Amount", "Billing Period", "Due Date", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Actions" ? "center" : "left", padding: "10px 16px", fontSize: 12, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: COLORS.textMuted }}>
                  <Loader2 size={18} className="spin" style={{ verticalAlign: "middle", marginRight: 8 }} /> Loading invoices…
                </td></tr>
              ) : listError ? (
                <tr><td colSpan={10}><EmptyState icon={Receipt} message={`Couldn't load invoices: ${listError}`} onRetry={refresh} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10}><EmptyState icon={Receipt} message="No invoices available." /></td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.guid} style={{ borderTop: `1px solid ${COLORS.border}`, background: i % 2 ? "#FAFBFD" : "#fff" }}>
                  <td style={{ padding: "11px 16px", fontSize: 13.5, color: COLORS.text, fontWeight: 600 }}>{r.invoiceNumber}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13.5, color: COLORS.text }}>{clientName(r.clientId)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13.5, color: COLORS.text }}>{projectLabel(r.projectId)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: COLORS.textMuted }}>{billingLabel(r.billingId)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: COLORS.textMuted }}>{r.invoiceDate || "—"}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13.5, color: COLORS.text }}>{r.amount ? `${currencyCode(r.currencyId)} ${Number(r.amount).toLocaleString()}` : "—"}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: COLORS.textMuted }}>{periodName(r.billingPeriodId)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13.5, color: COLORS.text }}>{r.dueDate || "—"}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: COLORS.accentSoft, color: COLORS.accent }}>{invoiceStatusName(r.invoiceStatusId)}</span>
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      <button onClick={() => setPanel({ mode: "edit", data: { ...EMPTY_FORM, ...r } })} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.accentSoft, color: COLORS.accent, border: "none", borderRadius: 7, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => setConfirmDelete(r)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.dangerSoft, color: COLORS.danger, border: "none", borderRadius: 7, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {panel && (
        <LinkInvoicePanel
          mode={panel.mode}
          data={panel.data}
          clients={clients}
          projects={projects}
          currencies={currencies}
          billingPeriods={billingPeriods}
          invoiceStatuses={invoiceStatuses}
          billingRecords={billingRecords}
          saving={saving}
          error={err}
          onCancel={() => {
            if (panel?.mode === "add") {
              setPanel({ mode: "add", data: { ...EMPTY_FORM } });
            } else {
              setPanel(null);
            }
            setErr("");
          }}
          onClose={() => setPanel(null)}
          onSubmit={submitPanel}
        />
      )}

      {confirmDelete && (
        <ConfirmModal title="Delete this invoice?" message={`"${confirmDelete.invoiceNumber}" will be permanently removed. This can't be undone.`} confirmLabel="Delete" busy={deleting} onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteRow} />
      )}

      {toast && (
        <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: COLORS.text, color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}>
          <CheckCircle2 size={15} color={COLORS.success} /> {toast}
        </div>
      )}
    </div>
  );
}