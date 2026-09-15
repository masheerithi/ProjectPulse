import { useState, useEffect } from "react";
import { ModuleStub } from "../common/ModuleStub";
import { ModuleSidebar } from "./ModuleSidebar";
import { TopNav } from "./TopNav";
import { MODULES } from "../../constants/modules";
import { LS_CURRENT_USER } from "../../constants/storage-keys";
import { invalidateFlowCache, warmFlowCache } from "../../api/flows";
import { COLORS } from "../../constants/theme";
import { LoginScreen } from "../../pages/LoginScreen";
import { ApprovalStatusPage } from "../../pages/approval-status/ApprovalStatusPage";
import { AuditLogPage } from "../../pages/audit-log/AuditLogPage";
import { BillingPage } from "../../pages/billing/BillingPage";
import { BillingTypePage } from "../../pages/billing-type/BillingTypePage";
import { ClientPage } from "../../pages/client/ClientPage";
import { CountryPage } from "../../pages/country/CountryPage";
import { DashboardHome } from "../../pages/dashboard/DashboardHome";
import { DealStatusPage } from "../../pages/deal-status/DealStatusPage";
import { DepartmentsPage } from "../../pages/department/DepartmentsPage";
import { LocationPage } from "../../pages/location/LocationPage";
import { DesignationPage } from "../../pages/designation/DesignationPage";
import { CurrencyPage } from "../../pages/currency/CurrencyPage";
import { InvoiceStatusPage } from "../../pages/invoice-status/InvoiceStatusPage";
import { LinkInvoicePage } from "../../pages/link-invoice/LinkInvoicePage";
import { PipelineProjectPage } from "../../pages/pipeline-project/PipelineProjectPage";
import { ProjectDashboardPage } from "../../pages/project-allocation/ProjectDashboardPage";
import { ResourceAllocationPage } from "../../pages/project-allocation/ResourceAllocationPage";
import { ProjectApprovalPage } from "../../pages/project-approval/ProjectApprovalPage";
import { ProjectCategoryPage } from "../../pages/project-category/ProjectCategoryPage";
import { ProjectDocumentPage } from "../../pages/project-document/ProjectDocumentPage";
import { ProjectResourcesTxnPage } from "../../pages/project-resources-txn/ProjectResourcesTxnPage";
import { ProjectStatusPage } from "../../pages/project-status/ProjectStatusPage";
import { RolesPage } from "../../pages/roles/RolesPage";
import { TimesheetApprovalPage } from "../../pages/timesheet-approval/TimesheetApprovalPage";
import { UserRolesPage } from "../../pages/user-roles/UserRolesPage";
import { UsersPage } from "../../pages/users/UsersPage";
import { lsGet, lsSet } from "../../utils/storage";

export function ProjectPulseApp() {
  const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

  // React state ALWAYS contains username string only
  const [user, setUser] = useState(() => {
    const session = lsGet(LS_CURRENT_USER, null);

    if (!session) return null;

    // Old format migration:
    // localStorage may previously have contained just "ProjectPulse"
    if (typeof session === "string") {
      const migrated = {
        username: session,
        loginTime: Date.now(),
      };

      lsSet(LS_CURRENT_USER, migrated);

      return session; // IMPORTANT: return STRING
    }

    // New session format
    if (
      typeof session === "object" &&
      session.username &&
      session.loginTime
    ) {
      const elapsed = Date.now() - session.loginTime;

      if (elapsed < SESSION_DURATION) {
        return session.username; // IMPORTANT: return STRING
      }
    }

    // Expired / invalid session
    localStorage.removeItem(LS_CURRENT_USER);
    return null;
  });

  const [page, setPage] = useState("dashboard");

  // Prefetch every commonly-used master-data list in the background as
  // soon as there's a logged-in user (fresh login or a restored session
  // on refresh), so screens are already warm by the time they're opened
  // instead of paying the flow round-trip when the user clicks in.
  useEffect(() => {
    if (user) warmFlowCache();
  }, [user]);

  // Automatically logout when the 1-hour session expires
  useEffect(() => {
    if (!user) return;

    const session = lsGet(LS_CURRENT_USER, null);

    if (
      !session ||
      typeof session !== "object" ||
      !session.loginTime
    ) {
      return;
    }

    const elapsed = Date.now() - session.loginTime;
    const remaining = SESSION_DURATION - elapsed;

    if (remaining <= 0) {
      localStorage.removeItem(LS_CURRENT_USER);
      setUser(null);
      setPage("dashboard");
      return;
    }

    const timer = setTimeout(() => {
      localStorage.removeItem(LS_CURRENT_USER);
      setUser(null);
      setPage("dashboard");
    }, remaining);

    return () => clearTimeout(timer);
  }, [user]);

  const handleLogin = (username) => {
    const session = {
      username: username,
      loginTime: Date.now(),
    };

    // localStorage gets OBJECT
    lsSet(LS_CURRENT_USER, session);

    // React gets STRING
    setUser(username);

    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem(LS_CURRENT_USER);
    invalidateFlowCache(); // don't let the next login start with a stale cache
    setUser(null);
    setPage("dashboard");
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const inModuleShell = MODULES.some((m) => m.key === page);

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: COLORS.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <TopNav
        user={user}
        current={page}
        onNavigateHome={() => setPage("dashboard")}
        onOpenModule={(key) => setPage(key)}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {inModuleShell && (
          <ModuleSidebar current={page} onSelect={setPage} />
        )}

        {page === "dashboard" && (
          <DashboardHome onOpenModule={setPage} />
        )}

        {page === "department" && <DepartmentsPage />}
        {page === "location" && <LocationPage />}
        {page === "designation" && <DesignationPage />}
        {page === "currency" && <CurrencyPage />}
        {page === "country" && <CountryPage />}
        {page === "user" && <UsersPage />}
        {page === "project-category" && <ProjectCategoryPage />}
        {page === "roles" && <RolesPage />}
        {page === "billing-type" && <BillingTypePage />}
        {page === "project-deal-status" && <DealStatusPage />}
        {page === "client" && <ClientPage />}
        {page === "approval-status" && <ApprovalStatusPage />}
        {page === "project-status" && <ProjectStatusPage />}
        {page === "invoice-status" && <InvoiceStatusPage />}
        {page === "user-roles" && <UserRolesPage />}

        {page === "project-dashboard" && (
          <ProjectDashboardPage />
        )}

        {page === "resource-allocation" && (
          <ResourceAllocationPage />
        )}

        {page === "timesheet-approval" && (
          <TimesheetApprovalPage />
        )}

        {page === "project-approval" && (
          <ProjectApprovalPage />
        )}

        {page === "audit-log" && <AuditLogPage />}
{page === "billing" && <BillingPage />}
{page === "link-invoice" && <LinkInvoicePage />}
{page === "pipeline-project" && <PipelineProjectPage />}
{page === "project-resources-txn" && <ProjectResourcesTxnPage />}
{page === "project-document" && <ProjectDocumentPage />}
{inModuleShell &&
  ![
    "department", "country", "user", "project-category", "roles", "billing-type",
    "location", "designation", "currency",
    "project-deal-status", "client", "approval-status", "project-status",
    "invoice-status", "user-roles", "project-dashboard", "resource-allocation",
    "timesheet-approval", "project-approval", "audit-log", "billing",
    "link-invoice", "pipeline-project", "project-resources-txn", "project-document",
  ].includes(page) && <ModuleStub moduleKey={page} />}
      </div>

      <style>{`
        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}