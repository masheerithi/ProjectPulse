// Only real per-browser session state lives in localStorage now. Every
// data module (Department, Country, Project, Billing, Invoice, Timesheet,
// ProjectApproval, ProjectDocument, AuditLog, etc.) reads and writes real
// SQL through the flows in src/api/flows.js — nothing is seeded locally.
export const LS_CURRENT_USER = "pp_current_user";