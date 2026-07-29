// Departments HR can assign accepted trainees to. Selecting one in the
// "Assign to Coordinator" bulk action auto-fills Training Coordinator,
// Branch, Business line, Building number, and Floor number from this
// record (HR can still edit any of those after auto-fill). Mocked for now;
// shaped so a real departments API can be swapped in without touching the
// page — `trainingCoordinator` is the coordinator's username, matching
// COORDINATORS in mockData.js.

export const DEPARTMENTS = [
  {
    id: 'digital-technology',
    name: 'Digital & Technology',
    trainingCoordinator: 'faisal.coord',
    branch: 'Eastern',
    businessLine: 'Digital & Technology',
    buildingNumber: '14',
    floorNumber: '3',
  },
  {
    id: 'operations-engineering',
    name: 'Operations Engineering',
    trainingCoordinator: 'faisal.coord',
    branch: 'Eastern',
    businessLine: 'Operations',
    buildingNumber: '7',
    floorNumber: '1',
  },
  {
    id: 'human-capital',
    name: 'Human Capital',
    trainingCoordinator: 'faisal.coord',
    branch: 'Eastern',
    businessLine: 'Corporate Functions',
    buildingNumber: '2',
    floorNumber: '5',
  },
  {
    id: 'corporate-strategy',
    name: 'Corporate Strategy',
    trainingCoordinator: 'huda.coord',
    branch: 'Western',
    businessLine: 'Corporate Strategy',
    buildingNumber: '1',
    floorNumber: '6',
  },
  {
    id: 'finance',
    name: 'Finance',
    trainingCoordinator: 'huda.coord',
    branch: 'Central',
    businessLine: 'Finance',
    buildingNumber: '5',
    floorNumber: '2',
  },
  {
    id: 'grid-operations',
    name: 'Grid Operations',
    trainingCoordinator: 'huda.coord',
    branch: 'Southern',
    businessLine: 'Renewable Energy',
    buildingNumber: '9',
    floorNumber: '4',
  },
];
