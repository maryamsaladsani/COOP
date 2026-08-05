import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import InfoField from '../../components/dashboard/InfoField';
import EmptyState from '../../components/dashboard/EmptyState';
import FormBanner from '../../components/form/FormBanner';
import DocumentChipList from '../../components/dashboard/DocumentChip';
import TRAINEE_NAV_ITEMS from './TraineeNavItems';
import { useTraineeData, useTraineeDocuments } from '../../data/DataContext';
import { openDocumentInNewTab, downloadDocument } from '../../data/documentActions';
import './TraineeDashboard.css';


function TraineeDetailsPage() {
    const { record, loading, error } = useTraineeData();
    const { documents, loading: documentsLoading } = useTraineeDocuments();

    if (loading) {
        return (
            <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
                <EmptyState title="Loading your training details…" />
            </DashboardShell>
        );
    }

    if (error || !record) {
        return (
            <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
                <SectionCard title="No record found">
                    {error ? <FormBanner tone="error">{error}</FormBanner> : <p>We couldn't find your trainee record. Contact HR if this looks wrong.</p>}
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
                        <InfoField label="Branch" value={trainingDetails?.branch} />
                        <InfoField label="Business line" value={trainingDetails?.businessLine} />
                        <InfoField label="Department" value={tracks.departmentAssignment.department} />
                        <InfoField label="Division" value={tracks.divisionAssignment.division} />
                        <InfoField label="Training coordinator" value={tracks.departmentAssignment.coordinatorName} />
                        <InfoField label="Building number" value={trainingDetails?.buildingNumber} />
                        <InfoField label="Floor number" value={trainingDetails?.floorNumber} />
                    </div>
                </SectionCard>

                <SectionCard title="Your application documents" subtitle="Uploaded when you applied.">
                    {documentsLoading ? (
                        <p>Loading…</p>
                    ) : (
                        <DocumentChipList
                            documents={documents || []}
                            onView={(field) => openDocumentInNewTab(`/api/trainee/documents/${field}`)}
                            onDownload={(field) => downloadDocument(`/api/trainee/documents/${field}`)}
                        />
                    )}
                </SectionCard>

            </div>
        </DashboardShell>
    );
}

export default TraineeDetailsPage;
