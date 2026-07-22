import {
    HomeIcon,
    DocumentIcon,
    SunriseIcon,
    CertificateIcon,
    DetailsIcon,
  } from '../../components/dashboard/navIcons';
  
  const TRAINEE_NAV_ITEMS = [
    {
      to: '/app/trainee',
      label: 'Dashboard',
      icon: <HomeIcon />,
      end: true,
    },
    {
      to: '/app/trainee/details',
      label: 'Details',
      icon: <DetailsIcon />,
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