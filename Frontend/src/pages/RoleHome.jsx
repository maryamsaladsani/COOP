import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/roles';

// Landing spot right after sign-in: sends the user to their own dashboard.
function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user?.role] || '/signin'} replace />;
}

export default RoleHome;
