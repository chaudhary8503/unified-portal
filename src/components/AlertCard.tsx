import type { PortalModule } from '../modules';
import ModuleIcon from './ModuleIcon';
import './AlertCard.css';

export interface AlertItem {
  text: string;
  /** Short context, e.g. "Yesterday", "12 days overdue". */
  when: string;
}

interface AlertCardProps {
  module: PortalModule;
  /** Empty = nothing flagged for this module. */
  items: AlertItem[];
}

/** Cards show at most this many issues; the rest collapse into "+N more". */
const MAX_VISIBLE = 3;

/*
  Fixed anatomy so cards line up regardless of content:
  header (module + count) → issue list (each item clamped to 3 lines, full
  text on hover) → footer pinned to the bottom. Grid rows stretch every card
  in a row to the same height.
*/
function AlertCard({ module, items }: AlertCardProps) {
  const flagged = items.length > 0;
  const visible = items.slice(0, MAX_VISIBLE);
  const hidden = items.length - visible.length;

  return (
    <article className={`alert-card ${flagged ? 'flagged' : 'clear'}`}>
      <div className="alert-head">
        <span className="alert-icon">
          <ModuleIcon module={module.id} size={16} />
        </span>
        <span className="alert-module">{module.name}</span>
        <span className="alert-count">{flagged ? items.length : 'OK'}</span>
      </div>

      {flagged ? (
        <ul className="alert-list">
          {visible.map((item) => (
            <li key={item.text}>
              <span className="alert-dot" aria-hidden="true" />
              <div className="alert-item">
                <p className="alert-text" title={item.text}>
                  {item.text}
                </p>
                <span className="alert-when">{item.when}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="alert-clear">No issues</p>
      )}

      <div className="alert-foot">
        <span className="alert-more">{hidden > 0 ? `+${hidden} more` : ''}</span>
        <a href={module.url} target="_blank" rel="noopener noreferrer">
          Open {module.name} ↗
        </a>
      </div>
    </article>
  );
}

export default AlertCard;
