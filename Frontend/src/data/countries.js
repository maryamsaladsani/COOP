import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(en);

const countryNames = countries.getNames('en', { select: 'official' });

export const NATIONALITY_OPTIONS = [
    { code: 'SA', name: 'Saudi Arabia' },
    ...Object.entries(countryNames)
        .filter(([code]) => code !== 'SA')
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
];