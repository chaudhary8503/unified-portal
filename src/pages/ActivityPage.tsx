import { useEffect, useMemo, useState } from 'react';
import { PERMISSION_MODULES } from '../modules';
import { fetchActivity, fetchCatalog, fetchMembers, type ActivityEntry, type Catalog, type Member } from '../team/api';
import '../styles/controls.css';
import './ActivityPage.css';

const MODULE_NAMES: Record<string, string> = {
  portal: 'Portal',
  ...Object.fromEntries(PERMISSION_MODULES.map((m) => [m.id, m.name])),
};

const PERIODS = [
  { days: 1, label: 'Last 24 hours' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 0, label: 'All time' },
];

const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** Owner-only: who did what, and when. Entries can't be edited or deleted. */
function ActivityPage() {
  const [module, setModule] = useState('');
  const [userId, setUserId] = useState('');
  const [days, setDays] = useState(7);
  // Rows are tagged with the filters they were loaded for, so changing a
  // filter shows "Loading…" without resetting state inside the effect.
  const [loaded, setLoaded] = useState<{ key: string; rows: ActivityEntry[] } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchMembers(), fetchCatalog()])
      .then(([m, c]) => {
        setMembers(m);
        setCatalog(c);
      })
      .catch(() => {
        /* names fall back to the log's own snapshot */
      });
  }, []);

  const filterKey = `${module}|${userId}|${days}`;
  const entries = loaded?.key === filterKey ? loaded.rows : null;

  useEffect(() => {
    let cancelled = false;
    fetchActivity({ module: module || undefined, userId: userId || undefined, sinceDays: days || undefined })
      .then((rows) => {
        if (!cancelled) {
          setLoaded({ key: `${module}|${userId}|${days}`, rows });
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load activity.');
      });
    return () => {
      cancelled = true;
    };
  }, [module, userId, days]);

  const nameById = useMemo(
    () => new Map(members.map((m) => [m.user_id, m.full_name || m.username || 'Unnamed'])),
    [members],
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="page-sub">Everything people have changed, newest first. Entries can’t be edited or deleted.</p>
        </div>
      </div>

      <div className="activity-filters">
        <label className="field">
          <span>Module</span>
          <select className="select" value={module} onChange={(e) => setModule(e.target.value)}>
            <option value="">All modules</option>
            {Object.entries(MODULE_NAMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Person</span>
          <select className="select" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Everyone</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name || m.username}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Period</span>
          <select className="select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIODS.map((p) => (
              <option key={p.days} value={p.days}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      <div className="card activity-list">
        {!entries && !error && <div className="empty-state">Loading…</div>}
        {entries?.length === 0 && <div className="empty-state">Nothing recorded for these filters.</div>}

        {entries?.map((e) => {
          const described = describe(e, nameById, catalog);
          const isOpen = open === e.id;
          return (
            <div key={e.id} className="activity-row">
              <button
                type="button"
                className="activity-main"
                aria-expanded={described.lines.length > 0 ? isOpen : undefined}
                onClick={() => described.lines.length > 0 && setOpen(isOpen ? null : e.id)}
              >
                <span className="activity-time mono">{TIME_FORMAT.format(new Date(e.occurred_at))}</span>
                <span className="activity-who">{e.user_name || (e.user_id ? nameById.get(e.user_id) : null) || 'System'}</span>
                <span className="activity-what">{described.title}</span>
                <span className="activity-module">
                  <span className="pill pill-muted">{MODULE_NAMES[e.module] ?? e.module}</span>
                </span>
                <span className="activity-toggle" aria-hidden="true">
                  {described.lines.length > 0 ? (isOpen ? '−' : '+') : ''}
                </span>
              </button>
              {isOpen && (
                <ul className="activity-details">
                  {described.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {entries && entries.length >= 200 && (
        <p className="activity-foot muted">Showing the latest 200 entries. Narrow the filters to see older ones.</p>
      )}
    </>
  );
}

/* ---------- turn raw log entries into readable sentences ---------- */

const FIELD_NAMES: Record<string, string> = {
  full_name: 'Name',
  active: 'Active',
  role: 'Role',
  username: 'Username',
};

function show(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** "sales.invoices" → "an invoice", "inventory.items" → "an item" */
function humanTable(entityType: string | null): string {
  const plural = (entityType?.split('.').pop() ?? 'record').replace(/_/g, ' ');
  const table = plural.endsWith('sses')
    ? plural.slice(0, -2)
    : plural.endsWith('ies')
      ? `${plural.slice(0, -3)}y`
      : plural.replace(/s$/, '');
  return `${/^[aeiou]/i.test(table) ? 'an' : 'a'} ${table}`;
}

function describe(
  e: ActivityEntry,
  nameById: Map<string, string>,
  catalog: Catalog | null,
): { title: string; lines: string[] } {
  const target = (e.entity_id && nameById.get(e.entity_id)) || 'someone';
  const d = e.details ?? {};

  if (e.action === 'permissions_changed') {
    const mod = String(d.module ?? '');
    const before = new Set((d.before as string[] | undefined) ?? []);
    const after = new Set((d.after as string[] | undefined) ?? []);
    const label = (k: string) => catalog?.byModule[mod]?.find((p) => p.permission_key === k)?.label ?? k;
    const added = [...after].filter((k) => !before.has(k)).map(label);
    const removed = [...before].filter((k) => !after.has(k)).map(label);
    const lines = [
      ...(added.length ? [`Allowed: ${added.join(', ')}`] : []),
      ...(removed.length ? [`Removed: ${removed.join(', ')}`] : []),
    ];
    return { title: `Changed ${MODULE_NAMES[mod] ?? mod} permissions for ${target}`, lines };
  }

  if (e.entity_type === 'portal.profiles' && e.action === 'update') {
    const changes = d as Record<string, { old: unknown; new: unknown }>;
    if ('active' in changes) {
      return { title: `${changes.active.new ? 'Activated' : 'Deactivated'} ${target}`, lines: [] };
    }
    const lines = Object.entries(changes).map(
      ([k, v]) => `${FIELD_NAMES[k] ?? k}: ${show(v?.old)} → ${show(v?.new)}`,
    );
    return { title: `Updated account of ${target}`, lines };
  }

  if (e.action === 'update') {
    const lines = Object.entries(d as Record<string, { old: unknown; new: unknown }>).map(
      ([k, v]) => `${k.replace(/_/g, ' ')}: ${show(v?.old)} → ${show(v?.new)}`,
    );
    return { title: `Changed ${humanTable(e.entity_type)}`, lines };
  }
  if (e.action === 'insert') return { title: `Added ${humanTable(e.entity_type)}`, lines: rowLines(d) };
  if (e.action === 'delete') return { title: `Deleted ${humanTable(e.entity_type)}`, lines: rowLines(d) };

  return { title: e.summary || e.action, lines: [] };
}

function rowLines(d: Record<string, unknown>): string[] {
  const row = (d.row ?? {}) as Record<string, unknown>;
  return Object.entries(row)
    .filter(([k]) => !['id', 'created_at', 'updated_at', 'created_by'].includes(k))
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${show(v)}`);
}

export default ActivityPage;
