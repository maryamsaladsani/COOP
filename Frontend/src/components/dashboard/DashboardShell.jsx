import { NavLink } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import './DashboardShell.css';

// The app-shell every role dashboard sits inside: shared header on top, a
// section rail on the left (desktop) that collapses to a scrollable tab
// strip under 900px, and a content well for the page itself.
function DashboardShell({ navItems, children }) {
  return (
    <div className="dash">
      <DashboardHeader />
      <div className="dash__body">
        {navItems && navItems.length > 0 && (
          <nav className="dash__nav" aria-label="Dashboard sections">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `dash__nav-item${isActive ? ' dash__nav-item--active' : ''}`}
              >
                <span className="dash__nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
        <main className="dash__content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardShell;
