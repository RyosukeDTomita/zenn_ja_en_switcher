import styles from './LocaleToggle.module.css';

const LOCALE_PARAM = 'locale';
const EN = 'en';

function switchLocale(toEnglish: boolean): void {
  const url = new URL(window.location.href);
  if (toEnglish) {
    url.searchParams.set(LOCALE_PARAM, EN);
  } else {
    url.searchParams.delete(LOCALE_PARAM);
  }
  window.location.assign(url.toString());
}

export function LocaleToggle() {
  const isEn =
    new URL(window.location.href).searchParams.get(LOCALE_PARAM) === EN;

  return (
    <div
      className={styles.container}
      role="group"
      aria-label="Zenn locale toggle"
    >
      <button
        type="button"
        className={styles.button}
        data-active={!isEn}
        aria-pressed={!isEn}
        onClick={() => {
          if (isEn) switchLocale(false);
        }}
      >
        <span aria-hidden="true">🇯🇵</span>
        <span>JA</span>
      </button>
      <button
        type="button"
        className={styles.button}
        data-active={isEn}
        aria-pressed={isEn}
        onClick={() => {
          if (!isEn) switchLocale(true);
        }}
      >
        <span aria-hidden="true">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
