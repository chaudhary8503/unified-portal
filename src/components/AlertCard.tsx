import { moduleLink, type PortalModule } from '../modules';
import { whenLabel, type AlertsState, type Severity } from '../overview/alerts';
import ModuleIcon from './ModuleIcon';
import './AlertCard.css';

interface AlertCardProps {
  module: PortalModule;
  state: AlertsState;
}

/** Cards show at most this many issues; the rest collapse into "+N more". */
const MAX_VISIBLE = 3;

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Urgent',
  warning: 'Attention',
  info: 'Note',
};

/*
  Fixed anatomy so cards line up regardless of content:
  header (module + count) → issue list (each item clamped to 3 lines, full
  text on hover) → footer pinned to the bottom. Grid rows stretch every card
  in a row to the same height. Severity is always shown as a word as well as
  a colour.
*/
function AlertCard({ module, state }: AlertCardProps) {
  const items = state.status === 'ok' ? state.items : [];
  const flagged = items.length > 0;
  const hasCritical = items.some((i) => i.severity === 'critical');
  const visible = items.slice(0, MAX_VISIBLE);
  const hidden = items.length - visible.length;
  const openUrl = moduleLink(module);

  const tone =
    state.status === 'ok' ? (flagged ? (hasCritical ? 'critical' : 'flagged') : 'clear') : 'idle';

  return (
    <article className={`alert-card ${tone}`}>
      <div className="alert-head">
        <span className="alert-icon">
          <ModuleIcon module={module.id} size={16} />
        </span>
        <span className="alert-module">{module.name}</span>
        <span className="alert-count">
          {state.status === 'ok' ? (flagged ? items.length : 'OK') : state.status === 'loading' ? '…' : '–'}
        </span>
      </div>

      {state.status === 'loading' && <p className="alert-clear">Checking…</p>}
      {state.status === 'not_connected' && <p className="alert-clear">Not connected yet</p>}
      {state.status === 'error' && (
        <p className="alert-clear" title={state.message}>
          Couldn’t load alerts. Try again later.
        </p>
      )}
      {state.status === 'ok' && !flagged && <p className="alert-clear">No issues</p>}

      {flagged && (
        <ul className="alert-list">
          {visible.map((item, i) => {
            const href = moduleLink(module, item.link_path);
            const body = (
              <>
                <span className={`alert-dot ${item.severity}`} aria-hidden="true" />
                <div className="alert-item">
                  <p className="alert-text" title={item.detail ? `${item.title}\n${item.detail}` : item.title}>
                    {item.title}
                  </p>
                  <span className="alert-when">
                    <span className={`alert-sev ${item.severity}`}>{SEVERITY_LABEL[item.severity] ?? 'Note'}</span>
                    {' · '}
                    {whenLabel(item.occurred_at)}
                  </span>
                </div>
              </>
            );
            return (
              <li key={`${item.alert_type}-${item.entity_id ?? i}-${item.occurred_at}`}>
                {href ? (
                  <a className="alert-link" href={href} target="_blank" rel="noopener noreferrer">
                    {body}
                  </a>
                ) : (
                  <div className="alert-link">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="alert-foot">
        <span className="alert-more">{hidden > 0 ? `+${hidden} more` : ''}</span>
        {openUrl ? (
          <a href={openUrl} target="_blank" rel="noopener noreferrer">
            Open {module.name} ↗
          </a>
        ) : (
          <span className="alert-soon">Coming soon</span>
        )}
      </div>
    </article>
  );
}

export default AlertCard;
