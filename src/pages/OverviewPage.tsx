import AlertCard, { type AlertItem } from '../components/AlertCard';
import ModuleTile from '../components/ModuleTile';
import { MODULES, type ModuleId } from '../modules';
import './OverviewPage.css';

/*
  SAMPLE DATA — static placeholders for now.
  TODO: each module's list will later be pulled from that module's real
  exception/alert data (machine overruns and output drops from Production,
  overdue payments from Sales, stock below reorder level from Inventory,
  stale rates from Rate Calculator). This is deliberately NOT a stats
  dashboard: only surface what needs the owner's attention today; an empty
  list means the module has nothing flagged.
*/
const ALERTS: Record<ModuleId, AlertItem[]> = {
  production: [
    { text: 'Extruder Line 2 ran 2h 10m past its scheduled cycle on the night shift.', when: 'Yesterday' },
    { text: 'Wire Drawing output was 28% below the stage average this morning.', when: 'Today, 11:30' },
    { text: 'No operator entry logged on machine M-04 since 10:00.', when: 'Today' },
  ],
  sales: [
    { text: 'Crescent Traders payment of PKR 485,000 is overdue.', when: '12 days overdue' },
    { text: 'Order SO-1042 for Al-Noor Electric is due for dispatch tomorrow and not yet packed.', when: 'Due tomorrow' },
  ],
  inventory: [
    { text: '4-core 2.5 mm cable at Arambagh shop is below reorder level (18 coils left).', when: 'Today' },
    { text: 'Copper rod stock covers about 3 days of production at current usage.', when: 'Today' },
    { text: 'Stock count at Main Warehouse is short by 6 coils of 7/29 cable.', when: 'Since Monday' },
  ],
  'rate-calculator': [
    { text: "Today's copper rate has not been updated; quotes are using yesterday's price.", when: 'Today' },
    { text: 'PVC compound rate was last changed 9 days ago. Confirm with supplier.', when: '9 days old' },
  ],
};

function OverviewPage() {
  const flaggedCount = Object.values(ALERTS).reduce((sum, items) => sum + items.length, 0);

  return (
    <>
      <section className="overview-section">
        <div className="section-head">
          <h2 className="section-label">Needs attention today</h2>
          <span className={`section-count ${flaggedCount === 0 ? 'clear' : ''}`}>
            {flaggedCount === 0 ? 'All clear' : `${flaggedCount} issue${flaggedCount === 1 ? '' : 's'}`}
          </span>
        </div>
        <div className="overview-grid">
          {MODULES.map((m) => (
            <AlertCard key={m.id} module={m} items={ALERTS[m.id]} />
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div className="section-head">
          <h2 className="section-label">Open a module</h2>
        </div>
        <div className="overview-grid">
          {MODULES.map((m) => (
            <ModuleTile key={m.id} module={m} />
          ))}
        </div>
      </section>
    </>
  );
}

export default OverviewPage;
