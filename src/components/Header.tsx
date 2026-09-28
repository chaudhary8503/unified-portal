import TabNav, { type View } from './TabNav';
import './Header.css';

interface HeaderProps {
  active: View;
  onChange: (view: View) => void;
}

function Header({ active, onChange }: HeaderProps) {
  return (
    <header>
      <div className="brand">
        <img className="brand-mark" src="/powerant-logo.jpg" alt="Powerant" />
        <div>
          <div className="brand-name">Powerant Portal</div>
          <div className="brand-sub">All business modules in one place</div>
        </div>
      </div>
      <TabNav active={active} onChange={onChange} />
    </header>
  );
}

export default Header;
