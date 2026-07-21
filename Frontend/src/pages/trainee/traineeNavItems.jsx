import {
    HomeIcon,
    DocumentIcon,
    SunriseIcon,
    CertificateIcon,
  } from '../../components/dashboard/navIcons';
  
  const TRAINEE_NAV_ITEMS = [
    {
      to: '/app/trainee',
      label: 'Dashboard',
      icon: <HomeIcon />,
      end: true,
    },
    {
      to: '/app/trainee/contract',
      label: 'Contract',
      icon: <DocumentIcon />,
    },
    {
      to: '/app/trainee/first-day',
      label: 'First day',
      icon: <SunriseIcon />,
    },
    {
      to: '/app/trainee/certificate',
      label: 'Certificate',
      icon: <CertificateIcon />,
    },
  ];
  
  export default TRAINEE_NAV_ITEMS;