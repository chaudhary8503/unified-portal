/*
  Reads each module's alerts from its `<schema>.alerts_summary` view
  (shared contract: module, alert_type, severity, title, detail, entity_id,
  occurred_at, link_path). Each view already filters by the signed-in
  person's permissions, so whatever comes back is safe to show.

  A module that isn't built yet (schema missing, not exposed, or no view)
  is reported as "not connected" instead of an error, so the Overview fills
  in by itself as each module goes live.
*/
import { supabase } from '../lib/supabase';

export type Severity = 'info' | 'warning' | 'critical';

export interface ModuleAlert {
  alert_type: string;
  severity: Severity;
  title: string;
  detail: string | null;
  entity_id: string | null;
  occurred_at: string;
  link_path: string | null;
}

export type AlertsState =
  | { status: 'loading' }
  | { status: 'ok'; items: ModuleAlert[] }
  | { status: 'not_connected' }
  | { status: 'error'; message: string };

const NOT_CONNECTED_CODES = new Set([
  'PGRST106', // schema not exposed in the Data API
  'PGRST205', // table/view not found in schema cache
  '42P01', // relation does not exist
  '3F000', // schema does not exist
]);

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

export async function fetchModuleAlerts(schema: string): Promise<AlertsState> {
  const { data, error } = await supabase
    .schema(schema)
    .from('alerts_summary')
    .select('alert_type, severity, title, detail, entity_id, occurred_at, link_path')
    .order('occurred_at', { ascending: false })
    .limit(50);

  if (error) {
    const code = (error as { code?: string }).code ?? '';
    if (NOT_CONNECTED_CODES.has(code) || /schema must be one of|does not exist|could not find/i.test(error.message)) {
      return { status: 'not_connected' };
    }
    return { status: 'error', message: error.message };
  }

  const items = ((data ?? []) as ModuleAlert[])
    .filter((a) => a.title)
    .sort(
      (a, b) =>
        (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3) ||
        b.occurred_at.localeCompare(a.occurred_at),
    );
  return { status: 'ok', items };
}

const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** "Today, 11:30" · "Yesterday" · "3 days ago" · "12 Oct" */
export function whenLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return `Today, ${TIME.format(d)}`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return DATE.format(d);
}
