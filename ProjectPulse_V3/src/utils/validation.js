export function findDuplicateCode(rows, code, currentGuid) {
  const c = (code || "").trim().toLowerCase();
  if (!c) return null;
  return rows.find((r) => (r.guid || "") !== (currentGuid || "") && (r.code || "").trim().toLowerCase() === c) || null;
}
