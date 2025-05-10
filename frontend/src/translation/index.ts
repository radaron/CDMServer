import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import enUSTranslations from './en.json'
import huHUTranslations from './hu.json'

let i18nInitialized = false

export const translations = {
  en: { translation: enUSTranslations },
  hu: { translation: huHUTranslations },
}

export const initI18next = (language: string) => {
  if (!i18nInitialized) {
    i18nInitialized = true
    i18n.use(initReactI18next).init({
      resources: translations,
      lng: language,
      fallbackLng: 'en',

      interpolation: {
        escapeValue: false,
      },
    })
  }
}
