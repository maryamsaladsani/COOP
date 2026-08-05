import StaticPageLayout from '../components/StaticPageLayout';

function PrivacyNoticePage() {
  return (
    <StaticPageLayout title="Privacy Notice">
      <p>
          COOP is a student capstone project developed by trainees, built to simulate an internal onboarding platform for Saudi Energy.
          It is not an official Saudi Energy system and is used for training and demonstration purposes only.
      </p>
      <p>
          Information entered here — including onboarding documents, contact details, and employment records — is used only within this project to simulate
          the onboarding process, and is visible only to the trainee, HR, and training coordinator roles involved in that onboarding.
      </p>
      <p> This platform and the data within it are private and intended for internal training use only.
          For questions about this project, contact the development team.
      </p>
    </StaticPageLayout>
  );
}

export default PrivacyNoticePage;
