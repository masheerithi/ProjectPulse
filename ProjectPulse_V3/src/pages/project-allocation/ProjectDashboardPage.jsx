import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  CalendarClock,
  Loader2,
  Users2,
  FolderKanban,
  Clock,
  LayoutGrid,
  List,
} from "lucide-react";
import { callProjectFlow, callProjectResourceFlow, checkReferences } from "../../api/flows";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { CHART_PALETTE, COLORS, cardStyle } from "../../constants/theme";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { ProjectPanel } from "./ProjectPanel";
import { findName, fmtDate, useLookups, useProjectsWithResources, userLabel } from "./hooks";
import { logAudit } from "../../utils/audit";

export function ProjectDashboardPage() {
  const lookups = useLookups();
  const { projects, loading, error: loadError, refresh } = useProjectsWithResources();
  const [search, setSearch] = useState("");
  const [view, setView] = useState("cards"); // 'cards' | 'table'
  const [panel, setPanel] = useState(null); // { mode: 'add'|'edit', data }
  const [detail, setDetail] = useState(null); // selected project for drawer
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = loadError ? [] : projects.filter((p) =>
    p.projectName.toLowerCase().includes(search.toLowerCase()) || p.projectCode.toLowerCase().includes(search.toLowerCase())
  );

  const totalResources = projects.reduce((sum, p) => sum + p.resources.length, 0);
  const activeCount = projects.filter((p) => p.active).length;
  const totalWeeklyHours = projects.reduce((sum, p) => sum + p.resources.reduce((s, r) => s + Number(r.weeklyHours || 0), 0), 0);

  const kpis = [
    { label: "Total Projects", value: String(projects.length), icon: FolderKanban, color: COLORS.accent },
    { label: "Active Projects", value: String(activeCount), icon: CheckCircle2, color: COLORS.success },
    { label: "Resources Allocated", value: String(totalResources), icon: Users2, color: "#8B5CF6" },
    { label: "Weekly Billable Hrs", value: String(totalWeeklyHours), icon: Clock, color: "#F59E0B" },
  ];

  const openAdd = () => setPanel({
    mode: "add",
    data: { guid: "", projectCode: "", projectName: "", categoryId: "", clientId: "", billingTypeId: "", startDate: "", endDate: "", active: true, resources: [] },
    originalResourceGuids: [],
  });
  const openEdit = async (p) => {
    const guard = await checkReferences("Project", p.guid);
    if (guard.blocked) {
      setToast(guard.message);
      return;
    }
    setPanel({
      mode: "edit",
      data: JSON.parse(JSON.stringify(p)),
      originalResourceGuids: p.resources.map((r) => r.guid).filter((g) => g !== "" && g !== undefined),
    });
  };

  const submitPanel = (form, originalResourceGuids = []) => {
    if (!form.projectCode?.trim() || !form.projectName?.trim() || !form.categoryId || !form.startDate || !form.endDate) {
      setErr("Project Code, Name, Category and Dates are required.");
      return;
    }
    setSaving(true);
    setErr("");
    const projectAction = form.guid ? "EDIT" : "CREATE";
    callProjectFlow(projectAction, form)
      .then((projRes) => {
        // Resolve the project's guid: already known on EDIT; on CREATE, find
        // the freshly inserted row by its unique projectCode in the refreshed list.
        let projectGuid = form.guid;
        if (!projectGuid) {
          const match = projRes.data.find((p) => p.projectCode === form.projectCode.trim());
          projectGuid = match ? match.guid : "";
        }

        // Sync resources: CREATE new rows (no guid), EDIT existing rows (has guid),
        // DELETE rows that were on the project originally but got removed in the panel.
        const currentGuids = form.resources.map((r) => r.guid).filter((g) => g !== "" && g !== undefined);
        const removedGuids = originalResourceGuids.filter((g) => !currentGuids.includes(g));

        const resourceOps = [
          ...form.resources.map((r) => callProjectResourceFlow(r.guid ? "EDIT" : "CREATE", { ...r, projectId: projectGuid })),
          ...removedGuids.map((guid) =>
            callProjectResourceFlow("DELETE", { guid }).catch((e) => {
              console.warn("Resource delete failed (continuing save):", e.message);
            })
          ),
        ];
        return Promise.all(resourceOps);
      })
      .then(() => refresh())
      .then(() => {
        setSaving(false);
        setPanel(null);
        logAudit("Project", form.guid ? "Update" : "Create", form.projectName || form.projectCode || "record");
        setToast(form.guid ? "Project updated." : "Project added.");
      })
      .catch((e) => {
        setSaving(false);
        setErr(e.message);
      });
  };

  const confirmDeleteRow = async () => {
    if (!confirmDelete) return;
    const guard = await checkReferences("Project", confirmDelete.guid);
    if (guard.blocked) {
      setToast(guard.message);
      setConfirmDelete(null);
      return;
    }
    // Resources carry the FK to Project, so they must be removed first.
    // If a resource is already gone (stale guid, deleted out-of-band, etc.)
    // don't let that block deleting the Project itself.
    const deleteResources = confirmDelete.resources.map((r) =>
      callProjectResourceFlow("DELETE", { guid: r.guid }).catch((e) => {
        console.warn("Resource delete failed (continuing to delete project):", e.message);
      })
    );
    Promise.all(deleteResources)
      .then(() => callProjectFlow("DELETE", { guid: confirmDelete.guid }))
      .then(() => refresh())
      .then(() => {
        logAudit("Project", "Delete", confirmDelete.projectName || confirmDelete.projectCode || "record");
        setToast("Project deleted.");
        setConfirmDelete(null);
      })
      .catch((e) => setToast(`Delete failed: ${e.message}`));
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
      <div style={{ flex: 1, padding: 26, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.text }}>Project Dashboard</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13.5 }}>Overview of all projects and their resource allocation</div>
          </div>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 7, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={15} /> Add Project
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "9px 12px", width: 300, background: COLORS.card }}>
            <Search size={14} color={COLORS.textMuted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by project code or name" style={{ border: "none", outline: "none", fontSize: 13, width: "100%", fontFamily: "Inter, sans-serif" }} />
          </div>
          <div style={{ display: "flex", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setView("cards")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", background: view === "cards" ? COLORS.accent : "#fff", color: view === "cards" ? "#fff" : COLORS.text, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <LayoutGrid size={13} /> Cards
            </button>
            <button onClick={() => setView("table")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", background: view === "table" ? COLORS.accent : "#fff", color: view === "table" ? "#fff" : COLORS.text, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <List size={13} /> Table
            </button>
          </div>
        </div>

        {view === "table" ? (
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  {["Project Code", "Project Name", "Category", "Client", "Billing Type", "Duration", "Resources", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: h === "Actions" ? "center" : "left", padding: "10px 16px", fontSize: 12, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: COLORS.textMuted }}>
                    <Loader2 size={18} className="spin" style={{ verticalAlign: "middle", marginRight: 8 }} /> Loading projects…
                  </td></tr>
                ) : loadError ? (
                  <tr><td colSpan={9}><EmptyState onRetry={refresh} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: COLORS.textMuted }}>No data available.</td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.border}`, background: i % 2 ? "#FAFBFD" : "#fff", cursor: "pointer" }} onClick={() => setDetail(p)}>
                    <td style={{ padding: "11px 16px", fontSize: 13.5, color: COLORS.text, fontWeight: 600 }}>{p.projectCode}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13.5, color: COLORS.text }}>{p.projectName}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: COLORS.text }}>{findName(lookups.categories, p.categoryId)}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: COLORS.text }}>{findName(lookups.clients, p.clientId)}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: COLORS.text }}>{findName(lookups.billingTypes, p.billingTypeId)}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: COLORS.textMuted }}>{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: COLORS.text }}>{p.resources.length}</td>
                    <td style={{ padding: "11px 16px" }}><StatusBadge active={p.active} /></td>
                    <td style={{ padding: "11px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.accentSoft, color: COLORS.accent, border: "none", borderRadius: 7, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => setConfirmDelete(p)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.dangerSoft, color: COLORS.danger, border: "none", borderRadius: 7, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {loading ? (
            <div style={{ ...cardStyle, gridColumn: "1/-1", textAlign: "center", color: COLORS.textMuted, padding: 40 }}>
              <Loader2 size={18} className="spin" style={{ verticalAlign: "middle", marginRight: 8 }} /> Loading projects…
            </div>
          ) : loadError ? (
            <div style={{ ...cardStyle, gridColumn: "1/-1" }}><EmptyState onRetry={refresh} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ ...cardStyle, gridColumn: "1/-1", textAlign: "center", color: COLORS.textMuted, padding: 40 }}>No data available.</div>
          ) : filtered.map((p) => (
            <div key={p.id} style={{ ...cardStyle, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }} onClick={() => setDetail(p)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.text }}>{p.projectName}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{p.projectCode}</div>
                </div>
                <StatusBadge active={p.active} />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.accent, background: COLORS.accentSoft, padding: "3px 9px", borderRadius: 999 }}>
                  {findName(lookups.categories, p.categoryId)}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textMuted, background: COLORS.bg, padding: "3px 9px", borderRadius: 999 }}>
                  {findName(lookups.clients, p.clientId)}
                </span>
              </div>

              <div style={{ fontSize: 12, color: COLORS.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                <CalendarClock size={12} /> {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: -6 }}>
                  {p.resources.slice(0, 4).map((r, i) => (
                    <span key={r.id} title={userLabel(lookups.users, r.userId)} style={{
                      width: 26, height: 26, borderRadius: "50%", background: CHART_PALETTE[i % CHART_PALETTE.length],
                      color: "#fff", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #fff", marginLeft: i === 0 ? 0 : -8,
                    }}>
                      {userLabel(lookups.users, r.userId).split(" ").map((w) => w[0]).join("")}
                    </span>
                  ))}
                  {p.resources.length === 0 && <span style={{ fontSize: 11.5, color: COLORS.textMuted }}>No resources</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(p)} style={{ background: COLORS.accentSoft, color: COLORS.accent, border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Pencil size={12} /></button>
                  <button onClick={() => setConfirmDelete(p)} style={{ background: COLORS.dangerSoft, color: COLORS.danger, border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {panel && (
        <ProjectPanel mode={panel.mode} data={panel.data} saving={saving} error={err} onCancel={() => {
          if (panel.mode === "add") {
            openAdd();
          } else {
            setPanel(null);
          }
          setErr("");
        }} onClose={() => setPanel(null)} onSubmit={(form) => submitPanel(form, panel.originalResourceGuids)} lookups={lookups} />
      )}

      {detail && !panel && (
        <ProjectDetailPanel project={detail} onClose={() => setDetail(null)} onEdit={() => { openEdit(detail); setDetail(null); }} lookups={lookups} />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete this project?"
          message={`"${confirmDelete.projectName}" (${confirmDelete.projectCode}) and its ${confirmDelete.resources.length} resource allocation(s) will be removed. This can't be undone.`}
          confirmLabel="Delete" busy={false}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteRow}
        />
      )}

      {toast && (
        <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: COLORS.text, color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}
          onAnimationEnd={() => {}}>
          <CheckCircle2 size={15} color={COLORS.success} /> {toast}
        </div>
      )}
    </div>
  );
}