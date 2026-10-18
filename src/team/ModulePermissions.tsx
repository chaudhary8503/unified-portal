import { useMemo, useState } from 'react';
import { savePermissions, type PermissionDef, type Preset } from './api';

interface ModulePermissionsProps {
  userId: string;
  moduleId: string;
  moduleName: string;
  defs: PermissionDef[];
  presets: Record<Preset, string[]> | undefined;
  /** Boxes currently saved for this person in this module. */
  saved: string[];
  onSaved: () => void | Promise<void>;
}

const PRESET_BUTTONS: { id: Preset | 'none'; label: string }[] = [
  { id: 'none', label: 'No access' },
  { id: 'view', label: 'View' },
  { id: 'entry', label: 'Entry' },
  { id: 'manage', label: 'Manage' },
];

function sameSet(a: Set<string>, b: string[]): boolean {
  return a.size === b.length && b.every((k) => a.has(k));
}

/** One module's checkboxes for one person, with presets and save/discard. */
function ModulePermissions({ userId, moduleId, moduleName, defs, presets, saved, onSaved }: ModulePermissionsProps) {
  const [draft, setDraft] = useState<Set<string>>(() => new Set(saved));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = !sameSet(draft, saved);
  const hasDefs = defs.length > 0;

  const activePreset = useMemo(() => {
    if (draft.size === 0) return 'none';
    for (const p of ['view', 'entry', 'manage'] as Preset[]) {
      const keys = presets?.[p] ?? [];
      if (keys.length > 0 && sameSet(draft, keys)) return p;
    }
    return null; // custom selection
  }, [draft, presets]);

  function applyPreset(id: Preset | 'none') {
    setDraft(new Set(id === 'none' ? [] : (presets?.[id] ?? [])));
    setJustSaved(false);
  }

  function toggle(key: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setJustSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await savePermissions(userId, moduleId, [...draft]);
      await onSaved();
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card perm-card" aria-label={`${moduleName} permissions`}>
      <div className="perm-head">
        <div className="perm-title">
          {moduleName}
          {hasDefs && (
            <span className="perm-count">
              {draft.size}/{defs.length}
            </span>
          )}
          {hasDefs && activePreset === null && <span className="pill pill-muted">Custom</span>}
        </div>
        <div className="preset-group" role="group" aria-label="Quick presets">
          {PRESET_BUTTONS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={activePreset === b.id ? 'active' : ''}
              disabled={!hasDefs || busy || (b.id !== 'none' && !(presets?.[b.id]?.length))}
              onClick={() => applyPreset(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {hasDefs ? (
        <ul className="perm-list">
          {defs.map((d) => (
            <li key={d.permission_key} className="perm-item">
              <label>
                <input
                  type="checkbox"
                  checked={draft.has(d.permission_key)}
                  onChange={() => toggle(d.permission_key)}
                  disabled={busy}
                />
                <span>
                  <span className="perm-label">{d.label}</span>
                  {d.description && <span className="perm-desc">{d.description}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="perm-empty">
          Permissions for this module appear here once it is connected to the database.
        </p>
      )}

      {(dirty || error || justSaved) && (
        <div className="perm-foot">
          {error && <span className="notice notice-error">{error}</span>}
          {!error && justSaved && !dirty && <span className="notice notice-ok">Saved</span>}
          {!error && dirty && <span className="perm-unsaved">Unsaved changes</span>}
          {dirty && (
            <>
              <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setDraft(new Set(saved))}>
                Discard
              </button>
              <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => void save()}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default ModulePermissions;
