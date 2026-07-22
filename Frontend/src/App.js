import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './data/DataContext';
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PrivacyNoticePage from './pages/PrivacyNoticePage';
import HelpSupportPage from './pages/HelpSupportPage';
import ApplicationPage from './pages/ApplicationPage';
import RoleHome from './pages/RoleHome';
import TraineeCertificatePage from './pages/trainee/TraineeCertificatePage';
import TraineeDashboardPage from './pages/trainee/TraineeDashboardPage';
import TraineeContractPage from './pages/trainee/TraineeContractPage';
import TraineeFirstDayPage from './pages/trainee/TraineeFirstDayPage';
import HRDashboardPage from './pages/hr/HRDashboardPage';
import HRStudentProfilePage from './pages/hr/HRStudentProfilePage';
import CoordinatorDashboardPage from './pages/coordinator/CoordinatorDashboardPage';
import CoordinatorStudentProfilePage from './pages/coordinator/CoordinatorStudentProfilePage';
import CoordinatorDivisionsPage from './pages/coordinator/CoordinatorDivisionsPage';
import CoordinatorBulkActionPage from './pages/coordinator/CoordinatorBulkActionPage';
import TraineeDetailsPage from './pages/trainee/TraineeDetailsPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy-notice" element={<PrivacyNoticePage />} />
              <Route path="/help" element={<HelpSupportPage />} />
              <Route path="/apply" element={<ApplicationPage />} />

              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <RoleHome />
                  </RequireAuth>
                }
              />

              <Route
                path="/app/trainee"
                element={
                  <RequireRole role="student">
                    <TraineeDashboardPage />
                  </RequireRole>
                }
              />
              <Route
                path="/app/trainee/details"
                element={
                    <RequireRole role="student">
                        <TraineeDetailsPage />
                    </RequireRole>
                }
              />
              <Route
                path="/app/trainee/contract"
                element={
                  <RequireRole role="student">
                    <TraineeContractPage />
                  </RequireRole>
                }
              />
              <Route
                path="/app/trainee/first-day"
                element={
                  <RequireRole role="student">
                    <TraineeFirstDayPage />
                  </RequireRole>
                }
              />
              
              <Route
                path="/app/trainee/certificate"
                element={
                  <RequireRole role="student">
                    <TraineeCertificatePage />
                  </RequireRole>
                }
              />

              <Route
                path="/app/hr"
                element={
                  <RequireRole role="hr">
                    <HRDashboardPage />
                  </RequireRole>
                }
              />
              <Route
                path="/app/hr/students/:id"
                element={
                  <RequireRole role="hr">
                    <HRStudentProfilePage />
                  </RequireRole>
                }
              />

              <Route
                path="/app/coordinator"
                element={
                  <RequireRole role="coordinator">
                    <CoordinatorDashboardPage />
                  </RequireRole>
                }
              />
              <Route
                path="/app/coordinator/students/:id"
                element={
                  <RequireRole role="coordinator">
                    <CoordinatorStudentProfilePage />
                  </RequireRole>
                }
              />
              <Route
                path="/app/coordinator/divisions"
                element={
                  <RequireRole role="coordinator">
                    <CoordinatorDivisionsPage />
                  </RequireRole>
                }
              />
              <Route
                path="/app/coordinator/bulk/:actionType"
                element={
                  <RequireRole role="coordinator">
                    <CoordinatorBulkActionPage />
                  </RequireRole>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
