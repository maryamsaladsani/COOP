import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME, ROLE_LABELS, getFirstName } from '../../utils/roles';
import { SignOutIcon } from './navIcons';
import './DashboardHeader.css';

// Shared across all three roles: logo linked to that role's dashboard home,
// a welcome greeting, and sign-out — the one header every dashboard has in common.
function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="dash-header">
      <div className="dash-header__inner">
        <Logo height={30} to={ROLE_HOME[user?.role] || '/'} />
        <div className="dash-header__session">
          <div className="dash-header__greeting">
            <span className="dash-header__welcome">Welcome back, {getFirstName(user?.name)}</span>
            <span className="dash-header__role">{ROLE_LABELS[user?.role]}</span>
          </div>
          <button type="button" className="dash-header__signout" onClick={handleSignOut}>
            <SignOutIcon />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
