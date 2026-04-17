import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'en';
    const isZh = currentLang.startsWith('zh');
    i18n.changeLanguage(isZh ? 'en' : 'zh');
  };

  const currentLang = i18n.language || 'en';
  const isZh = currentLang.startsWith('zh');

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors"
      aria-label="Toggle language"
    >
      <span className="material-symbols-outlined text-lg text-primary">translate</span>
      <span className="text-xs md:text-sm font-medium font-headline text-on-surface">
        {isZh ? 'EN' : '中文'}
      </span>
    </button>
  );
}
