import './StatusCard.css';

export type StatusTone = 'green' | 'gray';

interface StatusCardProps {
  module: string;
  message: string;
  /** green = module live with nothing flagged; gray = no data source yet. */
  tone: StatusTone;
}

function StatusCard({ module, message, tone }: StatusCardProps) {
  return (
    <div className="status-card">
      <div className="status-module">{module}</div>
      <div className="status-row">
        <span className={`status-dot ${tone}`} aria-hidden="true" />
        <span className="status-message">{message}</span>
      </div>
    </div>
  );
}

export default StatusCard;
