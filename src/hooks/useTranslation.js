import { useGameStore } from '../store/gameStore';
import { translations } from '../i18n/translations';

export function useTranslation() {
  const language = useGameStore(state => state.language);
  
  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const toggleLanguage = useGameStore(state => state.toggleLanguage);

  return { t, language, toggleLanguage };
}
