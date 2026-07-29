import { PeopleIcon, WithdrawIcon } from '../../components/dashboard/navIcons';
import { CardIcon, DepartmentIcon, CertificateIcon } from '../../components/dashboard/trackIcons';

const HR_NAV_ITEMS = [
  { to: '/app/hr', label: 'Students Database', icon: <PeopleIcon />, end: true },
  { to: '/app/hr/bulk/card', label: 'Request Card', icon: <CardIcon /> },
  { to: '/app/hr/bulk/assign', label: 'Assign to DEPT', icon: <DepartmentIcon /> },
  { to: '/app/hr/bulk/certificate', label: 'Issue Certificate', icon: <CertificateIcon /> },
  { to: '/app/hr/bulk/withdraw', label: 'Withdraw Training', icon: <WithdrawIcon /> },
];

export default HR_NAV_ITEMS;
