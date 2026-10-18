/*
  Data access for the owner's Team and Activity screens.
  - Reads go straight to the `portal` schema (row-level security lets only
    the owner see everyone).
  - Permission changes go through portal.set_user_permissions (owner-only,
    logged in the activity log).
  - Creating logins, resetting passwords and (de)activating accounts need
    Supabase's secret key, so they go through the `admin-users` Edge Function.
*/
import type { Profile, Role } from '../auth';
import { errorMessage, portal, supabase } from '../lib/supabase';

export interface Member extends Profile {
  created_at: string;
  /** Ticked permission keys, grouped by module. */
  permissions: Record<string, string[]>;
}

export interface PermissionDef {
  module: string;
  permission_key: string;
  label: string;
  description: string;
  sort_order: number;
}

export type Preset = 'view' | 'entry' | 'manage';

export interface Catalog {
  /** Permission definitions per module, in display order. */
  byModule: Record<string, PermissionDef[]>;
  /** module → preset → permission keys */
  presets: Record<string, Record<Preset, string[]>>;
}

export interface ActivityEntry {
  id: number;
  occurred_at: string;
  user_id: string | null;
  user_name: string | null;
  module: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string;
  details: Record<string, unknown>;
}

function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw new Error(errorMessage(res.error));
  return res.data as T;
}

export async function fetchMembers(): Promise<Member[]> {
  const [profilesRes, permsRes] = await Promise.all([
    portal()
      .from('profiles')
      .select('user_id, full_name, username, role, active, created_at')
      .order('role', { ascending: false }) // owner first
      .order('full_name'),
    portal().from('user_permissions').select('user_id, module, permission_key'),
  ]);
  const profiles = check(profilesRes) as (Profile & { created_at: string })[];
  const perms = check(permsRes) as { user_id: string; module: string; permission_key: string }[];

  return profiles.map((p) => {
    const permissions: Record<string, string[]> = {};
    for (const row of perms) {
      if (row.user_id !== p.user_id) continue;
      (permissions[row.module] ??= []).push(row.permission_key);
    }
    return { ...p, role: p.role as Role, permissions };
  });
}

export async function fetchCatalog(): Promise<Catalog> {
  const [defsRes, presetsRes] = await Promise.all([
    portal()
      .from('permissions')
      .select('module, permission_key, label, description, sort_order')
      .order('sort_order')
      .order('label'),
    portal().from('permission_presets').select('module, preset, permission_key'),
  ]);
  const defs = check(defsRes) as PermissionDef[];
  const presets = check(presetsRes) as { module: string; preset: Preset; permission_key: string }[];

  const catalog: Catalog = { byModule: {}, presets: {} };
  for (const d of defs) (catalog.byModule[d.module] ??= []).push(d);
  for (const p of presets) {
    const forModule = (catalog.presets[p.module] ??= { view: [], entry: [], manage: [] });
    forModule[p.preset].push(p.permission_key);
  }
  return catalog;
}

export async function savePermissions(userId: string, module: string, keys: string[]): Promise<void> {
  check(
    await portal().rpc('set_user_permissions', {
      p_user_id: userId,
      p_module: module,
      p_permissions: keys,
    }),
  );
}

export async function updateFullName(userId: string, fullName: string): Promise<void> {
  check(await portal().from('profiles').update({ full_name: fullName.trim() }).eq('user_id', userId));
}

export async function fetchActivity(filters: {
  module?: string;
  userId?: string;
  sinceDays?: number;
  limit?: number;
}): Promise<ActivityEntry[]> {
  let q = portal()
    .from('activity_log')
    .select('id, occurred_at, user_id, user_name, module, action, entity_type, entity_id, summary, details')
    .order('occurred_at', { ascending: false })
    .limit(filters.limit ?? 200);
  if (filters.module) q = q.eq('module', filters.module);
  if (filters.userId) q = q.eq('user_id', filters.userId);
  if (filters.sinceDays) {
    q = q.gte('occurred_at', new Date(Date.now() - filters.sinceDays * 86_400_000).toISOString());
  }
  return check(await q) as ActivityEntry[];
}

/* ---------- admin-users Edge Function ---------- */

type AdminAction =
  | { action: 'create'; full_name: string; username: string; password: string }
  | { action: 'reset_password'; user_id: string; password: string }
  | { action: 'set_active'; user_id: string; active: boolean };

async function callAdmin<T = { ok: true }>(body: AdminAction): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    // The function returns { error: "readable message" } with a 4xx status.
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const payload = (await context.json()) as { error?: string };
        if (payload?.error) throw new Error(payload.error);
      } catch (inner) {
        if (inner instanceof Error && inner.message) throw inner;
      }
    }
    throw new Error(
      error.message?.includes('Failed to send')
        ? 'Cannot reach the user service. Check that the admin-users function is deployed.'
        : errorMessage(error),
    );
  }
  return data as T;
}

export function createEmployee(fullName: string, username: string, password: string) {
  return callAdmin<{ ok: true; user_id: string }>({
    action: 'create',
    full_name: fullName.trim(),
    username: username.trim().toLowerCase(),
    password,
  });
}

export function resetPassword(userId: string, password: string) {
  return callAdmin({ action: 'reset_password', user_id: userId, password });
}

export function setActive(userId: string, active: boolean) {
  return callAdmin({ action: 'set_active', user_id: userId, active });
}

/* ---------- validation shared by forms ---------- */

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;
export const MIN_PASSWORD_LENGTH = 8;

export function usernameProblem(username: string): string | null {
  const u = username.trim().toLowerCase();
  if (!u) return 'Enter a username.';
  if (!USERNAME_PATTERN.test(u)) {
    return 'Use 3–32 characters: lowercase letters, numbers, dot, dash or underscore. No spaces.';
  }
  return null;
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
