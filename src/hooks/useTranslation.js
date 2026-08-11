import { useGameStore } from '../store/gameStore';
import { translations } from '../i18n/translations';

export function useTranslation() {
  const language = useGameStore(state => state.language);
  
  const t = (key, values = {}) => {
    const template = translations[language]?.[key] ?? translations[language]?.missingLabel ?? '—';
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };

  const toggleLanguage = useGameStore(state => state.toggleLanguage);

  return { t, language, toggleLanguage };
}
