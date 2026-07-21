import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import SectionCard from '../components/dashboard/SectionCard';
import TextField from '../components/form/TextField';
import SelectField from '../components/form/SelectField';
import FileField from '../components/form/FileField';
import FormBanner from '../components/form/FormBanner';
import Button from '../components/Button';
import { usePublicApplication } from '../data/DataContext';
import { REFERRAL_SOURCES, BLOOD_TYPES } from '../data/mockData';
import {NATIONALITY_OPTIONS} from "../data/countries";
import {
  isRequired,
  isValidEmail,
  isValidIBAN,
  isValidSaudiNationalId,
  isValidGPA,
  isDocumentFile,
  isImageFile,
  runValidators,
} from '../utils/validation';
import './ApplicationPage.css';

const INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  phone: '',
  birthDate: '',
  personalEmail: '',
  universityEmail: '',
  universityName: '',
  college: '',
  major: '',
  gpaScale: '',
  gpa: '',
  startDate: '',
  endDate: '',
  duration: '',
  nationality: '',
  nationalId: '',
  bloodType: '',
  iban: '',
  referralSource: '',
  employeeReferralId: '',
  transcript: null,
  cv: null,
  universityLetter: null,
  personalImage: null,
  signature: null,
};

const RULES = {
  firstName: (v) => (isRequired(v) ? null : 'Enter your first name.'),
  lastName: (v) => (isRequired(v) ? null : 'Enter your last name.'),
  phone: (v) => (isRequired(v) ? null : 'Enter your phone number.'),
  birthDate: (v) => (isRequired(v) ? null : 'Enter your birth date.'),
  personalEmail: (v) => (isValidEmail(v) ? null : 'Enter a valid personal email.'),
  universityEmail: (v) => (isValidEmail(v) ? null : 'Enter a valid university training email.'),
  universityName: (v) => (isRequired(v) ? null : 'Enter your university name.'),
  college: (v) => (isRequired(v) ? null : 'Enter your college.'),
  major: (v) => (isRequired(v) ? null : 'Enter your major.'),
  gpaScale: (v) => (isRequired(v) ? null : 'Select whether your GPA is out of 4 or 5.'),
  gpa: (v, all) => {if (!isRequired(v)) return 'Enter your GPA.'; const gpa = Number(v);
    const max = Number(all.gpaScale);
    if (gpa < 0 || gpa > max) { return `Enter a GPA between 0 and ${max}.`; }
    return null; },
  //gpa: (v) => (isValidGPA(v) ? null : 'Enter a GPA between 0 and 5.'),
  startDate: (v) => (isRequired(v) ? null : 'Enter a start date.'),
  endDate: (v) => (isRequired(v) ? null : 'Enter an end date.'),
  duration: (v) => (isRequired(v) ? null : 'Enter the training duration.'),
  nationality: (v) => (isRequired(v) ? null : 'Enter your nationality.'),
  nationalId: (v) => (isValidSaudiNationalId(v) ? null : 'Enter a valid 10-digit national ID.'),
  bloodType: (v) => (isRequired(v) ? null : 'Select your blood type.'),
  iban: (v) => (isValidIBAN(v) ? null : 'Enter a valid Saudi IBAN (starts with SA).'),
  referralSource: (v) => (isRequired(v) ? null : 'Select how you heard about us.'),
  employeeReferralId: (v, all) => (all.referralSource === 'employee_referral' && !isRequired(v) ? 'Enter the referring employee ID.' : null),
  transcript: (v) => (isDocumentFile(v) ? null : 'Upload your transcript as PDF, DOC, or DOCX.'),
  cv: (v) => (isDocumentFile(v) ? null : 'Upload your CV as PDF, DOC, or DOCX.'),
  universityLetter: (v) => (isDocumentFile(v) ? null : 'Upload your university letter as PDF, DOC, or DOCX.'),
  personalImage: (v) => (isImageFile(v) ? null : 'Upload a personal photo.'),
  signature: (v) => (isImageFile(v) ? null : 'Upload an image of your signature.'),
};

function ApplicationPage() {
  const { submitApplication } = usePublicApplication();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFileChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.files?.[0] || null }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = runValidators(values, RULES);
    setErrors(fieldErrors);
    setSubmitError('');
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await submitApplication({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        birthDate: values.birthDate,
        personalEmail: values.personalEmail,
        universityEmail: values.universityEmail,
        universityName: values.universityName,
        college: values.college,
        major: values.major,
        gpa: Number(values.gpa),
        startDate: values.startDate,
        endDate: values.endDate,
        duration: values.duration,
        nationality: values.nationality,
        nationalId: values.nationalId,
        bloodType: values.bloodType,
        iban: values.iban.trim().toUpperCase(),
        referralSource: values.referralSource,
        employeeReferralId: values.referralSource === 'employee_referral' ? values.employeeReferralId : null,
        transcriptFileName: values.transcript.name,
        cvFileName: values.cv.name,
        universityLetterFileName: values.universityLetter.name,
        personalImageFileName: values.personalImage.name,
        signatureFileName: values.signature.name,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="application-page">
      <PublicHeader />
      <main className="application-page__main">
        <div className="application-page__intro">
          <h1>Apply for the COOP program</h1>
          <p>
            Submit your training application below. There's no account to create here — if HR accepts your application, we'll
            email you COOP login credentials automatically.
          </p>
        </div>

        {submitted ? (
          <SectionCard title="Application submitted">
            <FormBanner tone="success">
              Thanks — your application is in HR's queue. You'll hear back by email once it's reviewed.
            </FormBanner>
            <p className="application-page__back">
              <Link to="/">Back to home</Link>
            </p>
          </SectionCard>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {submitError && <FormBanner tone="error">{submitError}</FormBanner>}

            <SectionCard title="Personal information">
              <div className="application-grid">
                <TextField label="First name" name="firstName" autoComplete="given-name" required value={values.firstName} onChange={handleChange('firstName')} error={errors.firstName} />
                <TextField label="Last name" name="lastName" autoComplete="family-name" required value={values.lastName} onChange={handleChange('lastName')} error={errors.lastName} />
                <TextField label="Phone" name="phone" autoComplete="tel" required placeholder="+966 5X XXX XXXX" value={values.phone} onChange={handleChange('phone')} error={errors.phone} />
                <TextField label="Birth date" name="birthDate" type="date" required value={values.birthDate} onChange={handleChange('birthDate')} error={errors.birthDate} />
                <TextField label="Personal email" name="personalEmail" type="email" autoComplete="email" required value={values.personalEmail} onChange={handleChange('personalEmail')} error={errors.personalEmail} />
                <TextField label="Nationality" name="nationality" required value={values.nationality} onChange={handleChange('nationality')} error={errors.nationality} />
                <SelectField
                    label="Nationality"
                    name="nationality"
                    required
                    placeholder="Saudi Arabia"
                    options={NATIONALITY_OPTIONS.map((c) => ({ value: c.name, label: c.name }))}                    value={values.nationality}
                    onChange={handleChange('nationality')}
                    error={errors.nationality}
                />
                <TextField label="National ID" name="nationalId" required value={values.nationalId} onChange={handleChange('nationalId')} error={errors.nationalId} />
                <SelectField
                  label="Blood type"
                  name="bloodType"
                  required
                  placeholder="Select blood type"
                  options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))}
                  value={values.bloodType}
                  onChange={handleChange('bloodType')}
                  error={errors.bloodType}
                />
                <TextField label="IBAN" name="iban" required placeholder="SA..." value={values.iban} onChange={handleChange('iban')} error={errors.iban} />
              </div>
            </SectionCard>

            <SectionCard title="University & training">
              <div className="application-grid">
                <TextField
                  label="University training email"
                  name="universityEmail"
                  type="email"
                  required
                  value={values.universityEmail}
                  onChange={handleChange('universityEmail')}
                  error={errors.universityEmail}
                />
                <TextField label="University name" name="universityName" required value={values.universityName} onChange={handleChange('universityName')} error={errors.universityName} />
                <TextField label="College" name="college" required value={values.college} onChange={handleChange('college')} error={errors.college} />
                <TextField label="Major" name="major" required value={values.major} onChange={handleChange('major')} error={errors.major} />
                <SelectField label="GPA scale" name="gpaScale"
  placeholder="Select"     
               options={[
                    { value: '4', label: 'Out of 4' },
                    { value: '5', label: 'Out of 5' },
                  ]} 
                  required
                  value={values.gpaScale}
                  onChange={handleChange('gpaScale')} error={errors.gpaScale}
                />

                <TextField
                  label="GPA"
                  name="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max={values.gpaScale || undefined}
                  placeholder={
                    values.gpaScale
                      ? `Enter GPA out of ${values.gpaScale}`
                      : 'Select GPA scale first'
                  }
                  disabled={!values.gpaScale}
                  required
                  value={values.gpa}
                  onChange={handleChange('gpa')}
                  error={errors.gpa}
                />
                <TextField label="Duration" name="duration" required placeholder="e.g. 6 months" value={values.duration} onChange={handleChange('duration')} error={errors.duration} />
                <TextField label="Start date" name="startDate" type="date" required value={values.startDate} onChange={handleChange('startDate')} error={errors.startDate} />
                <TextField label="End date" name="endDate" type="date" required value={values.endDate} onChange={handleChange('endDate')} error={errors.endDate} min={values.startDate} />
              </div>
            </SectionCard>

            <SectionCard title="How did you hear about us?">
              <div className="application-grid">
                <SelectField
                  label="Referral source"
                  name="referralSource"
                  required
                  placeholder="Select an option"
                  options={REFERRAL_SOURCES}
                  value={values.referralSource}
                  onChange={handleChange('referralSource')}
                  error={errors.referralSource}
                />
                {values.referralSource === 'employee_referral' && (
                  <TextField
                    label="Referring employee ID"
                    name="employeeReferralId"
                    required
                    value={values.employeeReferralId}
                    onChange={handleChange('employeeReferralId')}
                    error={errors.employeeReferralId}
                  />
                )}
              </div>
            </SectionCard>

            <SectionCard title="Documents & signature" subtitle="Transcript, CV, and university letter must be PDF or DOC/DOCX. Photo and signature must be an image.">
              <div className="application-grid">
                <FileField
                  label="University transcript"
                  name="transcript"
                  required
                  accept=".pdf,.doc,.docx"
                  fileName={values.transcript?.name}
                  onChange={handleFileChange('transcript')}
                  error={errors.transcript}
                />
                <FileField label="CV" name="cv" required accept=".pdf,.doc,.docx" fileName={values.cv?.name} onChange={handleFileChange('cv')} error={errors.cv} />
                <FileField
                  label="University letter"
                  name="universityLetter"
                  required
                  accept=".pdf,.doc,.docx"
                  fileName={values.universityLetter?.name}
                  onChange={handleFileChange('universityLetter')}
                  error={errors.universityLetter}
                />
                <FileField
                  label="Personal image"
                  name="personalImage"
                  required
                  accept="image/*"
                  fileName={values.personalImage?.name}
                  onChange={handleFileChange('personalImage')}
                  error={errors.personalImage}
                />
                <FileField
                  label="Trainee signature"
                  name="signature"
                  required
                  accept="image/*"
                  fileName={values.signature?.name}
                  onChange={handleFileChange('signature')}
                  error={errors.signature}
                />
              </div>
            </SectionCard>

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Submit application
            </Button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default ApplicationPage;
