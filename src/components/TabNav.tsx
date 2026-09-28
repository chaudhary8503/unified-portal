import './TabNav.css';

export type View = 'overview' | 'rate-calculator' | 'production' | 'sales' | 'inventory';

interface TabNavProps {
  active: View;
  onChange: (view: View) => void;
}

const TABS: { view: View; label: string }[] = [
  { view: 'overview', label: 'Overview' },
  { view: 'rate-calculator', label: 'Rate Calculator' },
  { view: 'production', label: 'Production Monitor' },
  { view: 'sales', label: 'Sales Dashboard' },
  { view: 'inventory', label: 'Inventory' },
];

function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tabs">
      {TABS.map((tab) => (
        <button
          key={tab.view}
          type="button"
          className={tab.view === active ? 'active' : ''}
          onClick={() => onChange(tab.view)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default TabNav;
