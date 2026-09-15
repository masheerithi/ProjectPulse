import React, { useState, useEffect, useCallback } from "react";
import { callBillingTypeFlow, callClientFlow, callDepartmentFlow, callProjectCategoryFlow, callProjectFlow, callProjectResourceFlow, callProjectStatusFlow, callRoleFlow, callUserFlow } from "../../api/flows";

export function useProjectsWithResources() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = React.useCallback(() => {
    setLoading(true);
    setError("");
    return Promise.all([callProjectFlow("LIST"), callProjectResourceFlow("LIST")])
      .then(([projRes, resRes]) => {
        const merged = projRes.data.map((p) => ({
          ...p,
          resources: resRes.data.filter((r) => String(r.projectId) === String(p.guid)),
        }));
        setProjects(merged);
        setLoading(false);
        return merged;
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
        throw e;
      });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { projects, setProjects, loading, error, refresh };
}

export function useLookups() {
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [billingTypes, setBillingTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      callProjectCategoryFlow("LIST"),
      callClientFlow("LIST"),
      callBillingTypeFlow("LIST"),
      callUserFlow("LIST"),
      callRoleFlow("LIST"),
      callDepartmentFlow("LIST"),
      callProjectStatusFlow("LIST"),
    ])
      .then(([cat, cli, bill, usr, rol, dept, pstat]) => {
        if (cancelled) return;
        setCategories(cat.data);
        setClients(cli.data);
        setBillingTypes(bill.data);
        setUsers(usr.data.map((u) => ({ ...u, name: `${u.firstName} ${u.lastName}`.trim() })));
        setRoles(rol.data);
        setDepartments(dept.data);
        setProjectStatuses(pstat.data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { categories, clients, billingTypes, users, roles, departments, projectStatuses, loading, error };
}

export const findName = (list, id) => list.find((x) => x.id === Number(id))?.name || "—";

export const userLabel = (users, id) => {
  const u = users.find((x) => x.id === Number(id));
  return u ? `${u.firstName} ${u.lastName}` : "—";
};

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");