import { useEffect, useState } from 'react';
import AlertCard from '../components/AlertCard';
import ModuleTile from '../components/ModuleTile';
import type { ModuleId, PortalModule } from '../modules';
import { fetchModuleAlerts, type AlertsState } from '../overview/alerts';
import './OverviewPage.css';

/*
  "Needs attention today": each module's own alerts (its alerts_summary
  view, already filtered to what this person may see). This is deliberately
  NOT a stats dashboard: only what needs attention; an empty list means the
  module has nothing flagged. Modules not built yet show "Not connected yet".
*/

interface OverviewPageProps {
  /** Only the modules the signed-in user may open. */
  modules: PortalModule[];
}

function OverviewPage({ modules }: OverviewPageProps) {
  const alertModules = modules.filter((m) => m.hasAlerts && m.permissionModule);
  const [alerts, setAlerts] = useState<Partial<Record<ModuleId, AlertsState>>>({});

  const alertKey = alertModules.map((m) => m.id).join(',');
  useEffect(() => {
    let cancelled = false;
    for (const id of alertKey.split(',').filter(Boolean) as ModuleId[]) {
      fetchModuleAlerts(id)
        .catch((err: unknown): AlertsState => ({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed',
        }))
        .then((state) => {
          if (!cancelled) setAlerts((prev) => ({ ...prev, [id]: state }));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [alertKey]);

  if (modules.length === 0) {
    return (
      <div className="card overview-empty">
        <h1 className="page-title">No modules assigned yet</h1>
        <p className="page-sub">Ask the owner to give you access to the modules you work in.</p>
      </div>
    );
  }

  const states = alertModules.map((m) => alerts[m.id] ?? { status: 'loading' as const });
  const loading = states.some((st) => st.status === 'loading');
  const flaggedCount = states.reduce((sum, st) => sum + (st.status === 'ok' ? st.items.length : 0), 0);
  const urgentCount = states.reduce(
    (sum, st) => sum + (st.status === 'ok' ? st.items.filter((i) => i.severity === 'critical').length : 0),
    0,
  );

  return (
    <>
      <section className="overview-section">
        <div className="section-head">
          <h2 className="section-label">Needs attention today</h2>
          {loading ? (
            <span className="section-count idle">Checking…</span>
          ) : (
            <span className={`section-count ${flaggedCount === 0 ? 'clear' : urgentCount > 0 ? 'urgent' : ''}`}>
              {flaggedCount === 0
                ? 'All clear'
                : `${flaggedCount} issue${flaggedCount === 1 ? '' : 's'}${urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}`}
            </span>
          )}
        </div>
        {alertModules.length > 0 ? (
          <div className="overview-grid">
            {alertModules.map((m) => (
              <AlertCard key={m.id} module={m} state={alerts[m.id] ?? { status: 'loading' }} />
            ))}
          </div>
        ) : (
          <p className="overview-none">No alerts for the modules you use.</p>
        )}
      </section>

      <section className="overview-section">
        <div className="section-head">
          <h2 className="section-label">Open a module</h2>
        </div>
        <div className="overview-grid">
          {modules.map((m) => (
            <ModuleTile key={m.id} module={m} />
          ))}
        </div>
      </section>
    </>
  );
}

export default OverviewPage;
