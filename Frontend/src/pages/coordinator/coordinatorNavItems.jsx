import { PeopleIcon, GridIcon, FlagIcon } from '../../components/dashboard/navIcons';
import { AccountIcon, DeskIcon, DivisionIcon, AcceptanceIcon } from '../../components/dashboard/trackIcons';

const COORDINATOR_NAV_ITEMS = [
  { to: '/app/coordinator', label: 'My Students', icon: <PeopleIcon />, end: true },
  { to: '/app/coordinator/divisions', label: 'Divisions', icon: <GridIcon /> },
  { to: '/app/coordinator/bulk/account', label: 'Request accounts', icon: <AccountIcon /> },
  { to: '/app/coordinator/bulk/desk', label: 'Request desks & devices', icon: <DeskIcon /> },
  { to: '/app/coordinator/bulk/division', label: 'Assign divisions', icon: <DivisionIcon /> },
  { to: '/app/coordinator/bulk/start', label: 'Confirm training start', icon: <FlagIcon /> },
  { to: '/app/coordinator/bulk/completed', label: 'Confirm training completion', icon: <AcceptanceIcon /> },
];

export default COORDINATOR_NAV_ITEMS;
