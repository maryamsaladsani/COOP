import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import InfoField from '../../components/dashboard/InfoField';
import TRAINEE_NAV_ITEMS from './TraineeNavItems';
import { useTraineeData } from '../../data/DataContext';
import './TraineeDashboard.css';


function TraineeDetailsPage() {
    const { record } = useTraineeData();

    if (!record) {
        return (
            <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
                <SectionCard title="No record found">
                    <p>We couldn't find your trainee record. Contact HR if this looks wrong.</p>
                </SectionCard>
            </DashboardShell>
        );
    }

    const { tracks, trainingDetails } = record;

    return (
        <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
            <div className="trainee-dash">
                <div className="trainee-dash__intro">
                    <h1>Your Training Details</h1>
                    <p></p>
                </div>

                <SectionCard title="Training details" subtitle="Fields populate as HR and your coordinator complete each step">
                    <div className="info-grid">
                        <InfoField label="Branch" value={trainingDetails.branch} />
                        <InfoField label="Business line" value={trainingDetails.businessLine} />
                        <InfoField label="Department" value={tracks.departmentAssignment.department} />
                        <InfoField label="Division" value={tracks.divisionAssignment.division} />
                        <InfoField label="Supervisor" value={tracks.divisionAssignment.managerName} />
                        <InfoField label="Alternative supervisor" value={tracks.divisionAssignment.altSupervisorName} />
                        <InfoField label="Training coordinator" value={tracks.departmentAssignment.coordinatorName} />
                        <InfoField label="Building number" value={trainingDetails.buildingNumber} />
                        <InfoField label="Floor number" value={trainingDetails.floorNumber} />
                    </div>
                </SectionCard>


            </div>
        </DashboardShell>
    );
}

export default TraineeDetailsPage;
