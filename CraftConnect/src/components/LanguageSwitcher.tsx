import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className={styles.switcherContainer}>
      <button
        type="button"
        className={`${styles.langBtn} ${i18n.language === 'en' ? styles.langBtnActive : ''}`}
        onClick={() => handleLanguageChange('en')}
      >
        {i18n.language === 'en' && (
          <motion.div
            layoutId="langActiveBg"
            className={styles.activeBackground}
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span>English</span>
      </button>

      <button
        type="button"
        className={`${styles.langBtn} ${i18n.language === 'hi' ? styles.langBtnActive : ''}`}
        onClick={() => handleLanguageChange('hi')}
      >
        {i18n.language === 'hi' && (
          <motion.div
            layoutId="langActiveBg"
            className={styles.activeBackground}
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span>हिन्दी</span>
      </button>
    </div>
  );
}
