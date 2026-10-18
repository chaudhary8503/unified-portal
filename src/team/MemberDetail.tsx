import { useState } from 'react';
import { PERMISSION_MODULES } from '../modules';
import { passwordProblem, resetPassword, setActive, updateFullName, type Catalog, type Member } from './api';
import ModulePermissions from './ModulePermissions';
import { generatePassword } from './password';

interface MemberDetailProps {
  member: Member;
  catalog: Catalog;
  isSelf: boolean;
  onBack: () => void;
  onChanged: () => void | Promise<void>;
}

function MemberDetail({ member, catalog, isSelf, onBack, onChanged }: MemberDetailProps) {
  const isOwnerRole = member.role === 'owner';
  const displayName = member.full_name || member.username || 'this person';

  return (
    <>
      <button type="button" className="btn btn-link detail-back" onClick={onBack}>
        ← Back to team
      </button>

      <div className="page-head">
        <div>
          <h1 className="page-title">{member.full_name || member.username || 'Unnamed'}</h1>
          <p className="page-sub">
            {isOwnerRole
              ? 'Owner: full access to every module, the Team screen and the activity log.'
              : 'Tick what this person may see and do. Changes apply the next time they load a page.'}
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <NameCard member={member} onChanged={onChanged} />
          {!isSelf && <StatusCard member={member} displayName={displayName} onChanged={onChanged} />}
          {member.username && <PasswordCard member={member} displayName={displayName} />}
        </div>

        <div>
          {isOwnerRole ? (
            <div className="card detail-card">
              <h2 className="section-title">Permissions</h2>
              <p className="detail-card-sub">
                Owners can do everything, so there is nothing to tick. Owner accounts are managed by your
                developer.
              </p>
            </div>
          ) : (
            PERMISSION_MODULES.map((pm) => (
              <ModulePermissions
                // Re-mount when the saved set changes so the draft resets cleanly.
                key={`${pm.id}:${(member.permissions[pm.id] ?? []).slice().sort().join(',')}`}
                userId={member.user_id}
                moduleId={pm.id}
                moduleName={pm.name}
                defs={catalog.byModule[pm.id] ?? []}
                presets={catalog.presets[pm.id]}
                saved={member.permissions[pm.id] ?? []}
                onSaved={onChanged}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- account cards ---------- */

function NameCard({ member, onChanged }: { member: Member; onChanged: () => void | Promise<void> }) {
  const [name, setName] = useState(member.full_name);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const changed = name.trim() !== member.full_name && name.trim() !== '';

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await updateFullName(member.user_id, name);
      await onChanged();
      setMsg({ ok: true, text: 'Name saved.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card detail-card">
      <h2 className="section-title">Account</h2>
      <div className="form-stack">
        <label className="field">
          <span>Full name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Username</span>
          <input className="input mono" value={member.username ?? 'Signs in with email'} readOnly />
        </label>
        {msg && <div className={`notice ${msg.ok ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}
        {changed && (
          <div className="form-actions">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save name'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  member,
  displayName,
  onChanged,
}: {
  member: Member;
  displayName: string;
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !member.active;
    const question = next
      ? `Allow ${displayName} to sign in again?`
      : `Deactivate ${displayName}? They will be signed out and unable to sign in. Their permissions and history are kept.`;
    if (!window.confirm(question)) return;
    setBusy(true);
    setError(null);
    try {
      await setActive(member.user_id, next);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card detail-card">
      <h2 className="section-title">Sign-in access</h2>
      <p className="detail-card-sub">
        {member.active
          ? 'This person can sign in.'
          : 'Deactivated: cannot sign in and has no access to any data.'}
      </p>
      <div className="status-line">
        {member.active ? (
          <span className="pill pill-green">Active</span>
        ) : (
          <span className="pill pill-muted">Deactivated</span>
        )}
        <button
          type="button"
          className={`btn btn-sm ${member.active ? 'btn-warn' : 'btn-primary'}`}
          disabled={busy}
          onClick={() => void toggle()}
        >
          {busy ? 'Working…' : member.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
      {error && (
        <div className="notice notice-error status-error">
          {error}
        </div>
      )}
    </div>
  );
}

function PasswordCard({ member, displayName }: { member: Member; displayName: string }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    const problem = passwordProblem(password);
    if (problem) {
      setMsg({ ok: false, text: problem });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await resetPassword(member.user_id, password);
      setMsg({ ok: true, text: `New password set. Give it to ${displayName}: ${password}` });
      setPassword('');
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not reset the password.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card detail-card">
      <h2 className="section-title">Reset password</h2>
      <p className="detail-card-sub">Use this when someone forgets their password.</p>
      <div className="form-stack">
        <div className="form-row">
          <label className="field">
            <span>New password</span>
            <input
              className="input mono"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setMsg(null);
              }}
              autoComplete="new-password"
              spellCheck={false}
            />
          </label>
          <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>
            Generate
          </button>
        </div>
        {msg && <div className={`notice ${msg.ok ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy || !password}
            onClick={() => void submit()}
          >
            {busy ? 'Setting…' : 'Set new password'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberDetail;
