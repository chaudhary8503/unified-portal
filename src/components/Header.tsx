import { OWNER_NAME } from '../auth';
import './Header.css';

const TODAY = new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface HeaderProps {
  onSignOut: () => void;
}

function Header({ onSignOut }: HeaderProps) {
  return (
    <header>
      <div className="brand">
        <img className="brand-mark" src="/powerant-logo.jpg" alt="Powerant" />
        <div>
          <div className="brand-name">Powerant Portal</div>
          <div className="brand-sub">All business modules in one place</div>
        </div>
      </div>
      <div className="header-right">
        <div className="header-date">{TODAY}</div>
        <div className="header-user">
          <span className="header-avatar" aria-hidden="true">
            {OWNER_NAME[0]}
          </span>
          <span className="header-name">{OWNER_NAME}</span>
          <button type="button" className="header-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
