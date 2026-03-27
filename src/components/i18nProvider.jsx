'use client';

import { createContext, useContext, useEffect, useState } from "react";

const I18nContext = createContext({
  locale: 'en',
  messages: {},
  t: (k) => k,
  changeLocale: async () => {},
})

export default function I18nProvider({ children, initialLocale = 'en', initialMessages = {} }) {
  const [ locale, setLocale ] = useState(initialLocale);
  const [ messages, setMessages ] = useState(initialMessages);

  useEffect(() => {
    const stored = typeof(window) != 'undefined' && localStorage.getItem('language');

    if (stored && stored !== locale) {
      import (`@/i18n/${stored}`).then(mod => {
        const loaded = mod.default || mod;

        setLocale(stored);
        setMessages(loaded);

        document.cookie = `language=${stored}; path=/; max-age=${60*60*24*365}`;
      }).catch(err => {
        console.error('Error when loading locale:', err);
      })
    }
  }, []);

  const changeLocale = async (newLocale) => {
    localStorage.setItem('language', newLocale);
    document.cookie = `language=${newLocale}; path=/; max-age=${60*60*24*365}`;

    const mod = await import(`@/i18n/${newLocale}`);

    setLocale(newLocale);
    setMessages(mod.default || mod);
  };

  const t = (code, replaces = {}) => {
    let text = messages?.[code] ?? code;

    if (code.includes('.') && messages?.[code]) {
      // Get the nested text
      return t(code.split('.').slice(1), replaces);
    } else if (text && typeof(text) === 'object') {
      // Avoid incomplete code
      text = code;
    }

    if (replaces && text) {
      Object.keys(replaces).map(k => {
        text = text.replaceAll(`{${k}}`, replaces[k]);
      });
    }

    return text;
  };

  return <I18nContext.Provider value={{ locale, messages, t, changeLocale }}>
    { children }
  </I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext);
}
