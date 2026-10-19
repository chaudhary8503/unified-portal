import './Header.css';

const TODAY = new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export type View = 'overview' | 'finance' | 'team' | 'activity' | 'businesses';

const OWNER_NAV: { id: View; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'finance', label: 'Finance' },
  { id: 'team', label: 'Team' },
  { id: 'activity', label: 'Activity' },
  { id: 'businesses', label: 'Businesses' },
];

interface HeaderProps {
  name: string;
  isOwner: boolean;
  view: View;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}

function Header({ name, isOwner, view, onNavigate, onSignOut }: HeaderProps) {
  return (
    <header>
      <div className="brand">
        <img className="brand-mark" src="/powerant-logo.jpg" alt="Powerant" />
        <div>
          <div className="brand-name">Powerant Portal</div>
          <div className="brand-sub">All business modules in one place</div>
        </div>
      </div>

      {isOwner && (
        <nav className="header-nav" aria-label="Portal sections">
          {OWNER_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`header-nav-item ${view === item.id ? 'active' : ''}`}
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <div className="header-right">
        <div className="header-date">{TODAY}</div>
        <div className="header-user">
          <span className="header-avatar" aria-hidden="true">
            {name[0]?.toUpperCase()}
          </span>
          <span className="header-name">{name}</span>
          <button type="button" className="header-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
