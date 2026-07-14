import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import './AppHome.css';

const ROLE_LABELS = {
  student: 'Trainee',
  hr: 'HR',
  coordinator: 'Training Coordinator',
};

function AppHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-home">
      <header className="app-home__topbar">
        <Logo height={24} />
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </header>
      <main className="app-home__main">
        <span className="app-home__badge">{ROLE_LABELS[user?.role] || 'Signed in'}</span>
        <h1 className="app-home__title">Welcome back, {user?.name}.</h1>
        <p className="app-home__body">
          You're signed in as {ROLE_LABELS[user?.role] || 'a COOP user'}. Your role-specific workspace
          connects here next.
        </p>
      </main>
    </div>
  );
}

export default AppHome;
