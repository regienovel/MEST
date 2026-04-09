export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French / Français',
  yo: 'Yoruba',
  ha: 'Hausa',
  sw: 'Swahili',
  ar: 'Arabic / العربية',
  pt: 'Portuguese / Português',
  tw: 'Twi',
  wo: 'Wolof',
  ig: 'Igbo',
  am: 'Amharic / አማርኛ',
  zu: 'Zulu',
  es: 'Spanish / Español',
  de: 'German / Deutsch',
  zh: 'Chinese / 中文',
  ja: 'Japanese / 日本語',
  ko: 'Korean / 한국어',
  hi: 'Hindi / हिन्दी',
  ru: 'Russian / Русский',
};

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] || code;
}
