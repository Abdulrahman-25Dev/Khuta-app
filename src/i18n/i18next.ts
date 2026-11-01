import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './ar.json';
import en from './en.json';
import { storage } from '../utils/storage';

const i18n = createInstance();

export type AppLanguage = 'ar' | 'en';

const isAppLanguage = (language: string | undefined): language is AppLanguage =>
  language === 'ar' || language === 'en';

const savedLanguage = storage.getString('app_language');
const deviceLanguage = getLocales()[0]?.languageCode;
const initialLanguage: AppLanguage = isAppLanguage(savedLanguage)
  ? savedLanguage
  : deviceLanguage === 'ar'
    ? 'ar'
    : 'en';

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export async function changeLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  storage.set('app_language', language);
  I18nManager.forceRTL(false);
}

export function formatNumber(
  value: number,
  language: AppLanguage = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'en'
): string {
  return new Intl.NumberFormat(language).format(value);
}

export { i18n };