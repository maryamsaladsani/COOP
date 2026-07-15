import StaticPageLayout from '../components/StaticPageLayout';

function PrivacyNoticePage() {
  return (
    <StaticPageLayout title="Privacy Notice">
      <p>
        COOP is an internal Saudi Energy platform. Information entered here, including onboarding
        documents, contact details, and employment records, is used only to process trainee onboarding
        and is visible to the trainee, HR, and training coordinators involved in that onboarding.
      </p>
      <p>
        Data is stored on Saudi Energy internal systems and is not shared outside the company. For
        questions about how your information is handled, contact your HR representative.
      </p>
    </StaticPageLayout>
  );
}

export default PrivacyNoticePage;
