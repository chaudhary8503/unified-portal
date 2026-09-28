import StatusCard, { type StatusTone } from '../components/StatusCard';
import './OverviewPage.css';

/*
  PLACEHOLDER — static status cards, one per module.
  TODO: each card will later pull real exception/alert data from its module
  (e.g. low-output anomalies from Production, overdue invoices from Sales,
  low-stock items from Inventory). This is deliberately NOT a stats dashboard:
  a card should only surface what needs attention right now, and show
  "No issues" otherwise. Full metrics stay inside each module's own app.
*/
const MODULE_STATUSES: { module: string; message: string; tone: StatusTone }[] = [
  { module: 'Production', message: 'No issues', tone: 'green' },
  { module: 'Sales', message: 'No issues', tone: 'gray' },
  { module: 'Inventory', message: 'No issues', tone: 'gray' },
  { module: 'Rate Calculator', message: 'No issues', tone: 'green' },
];

function OverviewPage() {
  return (
    <>
      <h1 className="page-title">Overview</h1>
      <p className="page-sub">What needs attention across all modules.</p>
      <div className="status-grid">
        {MODULE_STATUSES.map((s) => (
          <StatusCard key={s.module} module={s.module} message={s.message} tone={s.tone} />
        ))}
      </div>
    </>
  );
}

export default OverviewPage;
