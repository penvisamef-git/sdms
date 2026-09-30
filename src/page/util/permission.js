import { ROLE, roleText } from "../dashboard/user/userRoles";
import { userService } from "../../api/api.service";

/**
 * What each screen needs. Put one of these on a route as `access` (see routes/route.script.js).
 * A route without `access` is treated as SUPER only (safe default).
 *
 *   ALL     any signed-in user (dashboard, my account)
 *   DOC_IN  incoming documents   → DOC_IN, DOC_BOTH, SUPER
 *   DOC_OUT outgoing documents   → DOC_OUT, DOC_BOTH, SUPER
 *   SUPER   master data, organization, users → SUPER only
 */
export const ACCESS = {
  ALL: "all",
  DOC_IN: "doc_in",
  DOC_OUT: "doc_out",
  SUPER: "super",
};

// the role of the signed-in user (login data). The API's super-admin flag always wins.
export function roleOf(user) {
  if (user?.is_super_admin) return ROLE.SUPER;
  return roleText(user?.role);
}

export function canAccess(user, access = ACCESS.SUPER) {
  const role = roleOf(user);
  if (role === ROLE.SUPER) return true;
  switch (access) {
    case ACCESS.ALL:
      return true;
    case ACCESS.DOC_IN:
      return role === ROLE.DOC_IN || role === ROLE.DOC_BOTH;
    case ACCESS.DOC_OUT:
      return role === ROLE.DOC_OUT || role === ROLE.DOC_BOTH;
    default:
      return false;
  }
}

// which document list a user may open: keep the wanted one ("in" | "out") when allowed, else the other, else null
export function docBoxFor(user, wanted) {
  const ok = { in: canAccess(user, ACCESS.DOC_IN), out: canAccess(user, ACCESS.DOC_OUT) };
  if (ok[wanted]) return wanted;
  const other = wanted === "out" ? "in" : "out";
  return ok[other] ? other : null;
}

// drop every route / menu the user may not open (a menu group with nothing left disappears)
export function filterRoutes(list, user) {
  return list.reduce((acc, row) => {
    const hasChildren = Array.isArray(row.child) && row.child.length > 0;
    if (!hasChildren) {
      if (canAccess(user, row.access)) acc.push(row);
      return acc;
    }
    const groups = row.child
      .map((group) => group.filter((c) => canAccess(user, c.access ?? row.access)))
      .filter((group) => group.length > 0);
    if (groups.length > 0) acc.push({ ...row, child: groups });
    return acc;
  }, []);
}

// Keep the stored login in sync with the server (e.g. an admin changed the user's role).
// Returns true when something changed.
export async function refreshLoginRole(auth) {
  try {
    const res = await userService.profile();
    const d = res?.data ?? res ?? {};
    const fresh = d.user || d.profile || d;
    const current = auth.getClientLogin();
    if (!current || !fresh || typeof fresh !== "object") return false;

    const next = { ...current };
    let changed = false;
    ["role", "is_super_admin"].forEach((key) => {
      if (fresh[key] !== undefined && JSON.stringify(fresh[key]) !== JSON.stringify(current[key])) {
        next[key] = fresh[key];
        changed = true;
      }
    });
    if (changed) auth.setClientLogin(next);
    return changed;
  } catch {
    return false;
  }
}
