import { PeopleIcon, GridIcon } from '../../components/dashboard/navIcons';
import { AccountIcon, DeskIcon, DivisionIcon, AcceptanceIcon } from '../../components/dashboard/trackIcons';

// "Confirm training start" was dropped — the real backend has no concept of
// a training "start" separate from completion (see bulkActions.jsx).
const COORDINATOR_NAV_ITEMS = [
  { to: '/app/coordinator', label: 'My Students', icon: <PeopleIcon />, end: true },
  { to: '/app/coordinator/divisions', label: 'Divisions', icon: <GridIcon /> },
  { to: '/app/coordinator/bulk/account', label: 'Request accounts', icon: <AccountIcon /> },
  { to: '/app/coordinator/bulk/desk', label: 'Request desks & devices', icon: <DeskIcon /> },
  { to: '/app/coordinator/bulk/division', label: 'Assign divisions', icon: <DivisionIcon /> },
  { to: '/app/coordinator/bulk/completed', label: 'Confirm training completion', icon: <AcceptanceIcon /> },
];

export default COORDINATOR_NAV_ITEMS;
