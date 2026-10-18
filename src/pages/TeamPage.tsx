import { useCallback, useEffect, useState } from 'react';
import { PERMISSION_MODULES } from '../modules';
import AddEmployeeForm from '../team/AddEmployeeForm';
import MemberDetail from '../team/MemberDetail';
import { fetchCatalog, fetchMembers, type Catalog, type Member } from '../team/api';
import '../styles/controls.css';
import './TeamPage.css';

interface TeamPageProps {
  currentUserId: string;
}

type Mode = { kind: 'list' } | { kind: 'add' } | { kind: 'member'; userId: string };

/** Owner-only: who can sign in, which modules they open, what they may do there. */
function TeamPage({ currentUserId }: TeamPageProps) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });

  const reload = useCallback(
    () =>
      Promise.all([fetchMembers(), fetchCatalog()])
        .then(([m, c]) => {
          setMembers(m);
          setCatalog(c);
          setError(null);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Could not load the team.');
        }),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  if (error && !members) {
    return <div className="notice notice-error">{error}</div>;
  }
  if (!members || !catalog) {
    return <div className="empty-state">Loading team…</div>;
  }

  if (mode.kind === 'add') {
    return (
      <AddEmployeeForm
        onCancel={() => setMode({ kind: 'list' })}
        onCreated={async (userId) => {
          await reload();
          setMode({ kind: 'member', userId });
        }}
      />
    );
  }

  if (mode.kind === 'member') {
    const member = members.find((m) => m.user_id === mode.userId);
    if (member) {
      return (
        <MemberDetail
          member={member}
          catalog={catalog}
          isSelf={member.user_id === currentUserId}
          onBack={() => setMode({ kind: 'list' })}
          onChanged={reload}
        />
      );
    }
  }

  const employees = members.filter((m) => m.role === 'employee');
  const activeCount = employees.filter((m) => m.active).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-sub">
            Choose who can sign in, which modules they can open and what they can do in each.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setMode({ kind: 'add' })}>
          + Add employee
        </button>
      </div>

      {error && <div className="notice notice-error team-notice">{error}</div>}

      <div className="card team-list">
        <div className="team-list-head">
          <span>Person</span>
          <span>Status</span>
          <span>Module access</span>
          <span aria-hidden="true" />
        </div>

        {members.map((m) => (
          <button
            key={m.user_id}
            type="button"
            className={`team-row ${m.active ? '' : 'inactive'}`}
            onClick={() => setMode({ kind: 'member', userId: m.user_id })}
          >
            <span className="team-person">
              <span className="team-avatar" aria-hidden="true">
                {(m.full_name || m.username || '?')[0].toUpperCase()}
              </span>
              <span className="team-person-text">
                <span className="team-name">
                  {m.full_name || m.username || 'Unnamed'}
                  {m.user_id === currentUserId && <span className="muted"> (you)</span>}
                </span>
                <span className="team-username mono">{m.username ?? 'email login'}</span>
              </span>
            </span>

            <span className="team-status">
              {m.role === 'owner' ? (
                <span className="pill pill-brand">Owner</span>
              ) : m.active ? (
                <span className="pill pill-green">Active</span>
              ) : (
                <span className="pill pill-muted">Deactivated</span>
              )}
            </span>

            <span className="team-modules">
              {m.role === 'owner' ? (
                <span className="muted">Everything</span>
              ) : (
                <ModuleSummary member={m} catalog={catalog} />
              )}
            </span>

            <span className="team-open" aria-hidden="true">
              Manage →
            </span>
          </button>
        ))}

        {employees.length === 0 && (
          <div className="empty-state">
            No employees yet. Add one to give them a login.
          </div>
        )}
      </div>

      <p className="team-foot muted">
        {activeCount} active employee{activeCount === 1 ? '' : 's'}. Deactivated people cannot sign in, and
        their past activity stays in the log.
      </p>
    </>
  );
}

function ModuleSummary({ member, catalog }: { member: Member; catalog: Catalog }) {
  const chips = PERMISSION_MODULES.filter((pm) => (member.permissions[pm.id]?.length ?? 0) > 0);
  if (chips.length === 0) return <span className="muted">No access</span>;
  return (
    <span className="team-chips">
      {chips.map((pm) => {
        const ticked = member.permissions[pm.id].length;
        const total = catalog.byModule[pm.id]?.length ?? ticked;
        return (
          <span key={pm.id} className="team-chip" title={`${ticked} of ${total} permissions`}>
            {pm.name}
            <span className="team-chip-count">
              {ticked}/{total}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default TeamPage;
