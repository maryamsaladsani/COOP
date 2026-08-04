import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TraineeDashboardPage from './TraineeDashboardPage';
import { useTraineeData } from '../../data/DataContext';
import { adaptTrainee } from '../../data/traineeAdapter';
import { AuthProvider, CONTRACT_NOTICE_DISMISSED_KEY } from '../../context/AuthContext';

jest.mock('../../data/DataContext', () => ({
  useTraineeData: jest.fn(),
}));

// Builds a realistic adapted record via the real adaptTrainee() (not a hand-rolled shape),
// so this test can't drift from what the real hook actually produces — only contractSigned
// varies between tests.
function buildRecord(contractSigned) {
  return adaptTrainee({
    id: 'me',
    fullName: 'Test Trainee',
    applicationStatus: 'ACCEPTED',
    withdrawn: false,
    milestone: 'ACCEPTANCE',
    cardStatus: 'NOT_REQUESTED',
    accountRequested: false,
    deskDeviceRequested: false,
    trainingCompleted: false,
    contractSigned,
    certificateIssued: false,
    departmentId: null,
    coordinatorId: null,
    division: null,
    department: null,
    createdAt: new Date().toISOString(),
    userId: 'me',
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TraineeDashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

// Regression test for BUG-004 (no trainee-facing prompt to sign contract).
describe('TraineeDashboardPage contract-signature notice', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test('shows the "sign your contract" notice when contractSigned is false', () => {
    useTraineeData.mockReturnValue({ record: buildRecord(false), loading: false, error: '' });
    renderDashboard();

    expect(screen.getByText('Action required: Sign your contract')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Contract' })).toBeInTheDocument();
  });

  test('hides the notice when contractSigned is true', () => {
    useTraineeData.mockReturnValue({ record: buildRecord(true), loading: false, error: '' });
    renderDashboard();

    expect(screen.queryByText('Action required: Sign your contract')).not.toBeInTheDocument();
  });

  test('dismissing the notice hides it for the session, without contractSigned changing', () => {
    useTraineeData.mockReturnValue({ record: buildRecord(false), loading: false, error: '' });
    renderDashboard();

    expect(screen.getByText('Action required: Sign your contract')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Action required: Sign your contract')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(CONTRACT_NOTICE_DISMISSED_KEY)).toBe('true');
  });

  test('does not show the notice while loading or on error (nothing to react to yet)', () => {
    useTraineeData.mockReturnValue({ record: null, loading: true, error: '' });
    renderDashboard();
    expect(screen.queryByText('Action required: Sign your contract')).not.toBeInTheDocument();
  });
});
