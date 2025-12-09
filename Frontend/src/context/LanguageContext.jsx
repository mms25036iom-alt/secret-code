import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import pa from '../locales/pa.json';

const translations = {
    en,
    hi,
    pa
};

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('appLanguage') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
        // Update HTML lang attribute for accessibility
        document.documentElement.lang = language;
        console.log('Language changed to:', language);
    }, [language]);

    // Translation function with nested key support - memoized with language dependency
    const t = useCallback((key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                // Fallback to English if translation not found
                value = translations.en;
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object') {
                        value = value[fallbackKey];
                    } else {
                        console.warn(`Translation not found for key: ${key}`);
                        return key; // Return key if translation not found
                    }
                }
                break;
            }
        }

        // Replace parameters in translation (e.g., {{count}})
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] !== undefined ? params[param] : match;
            });
        }

        return value || key;
    }, [language]);

    const changeLanguage = useCallback((lang) => {
        if (translations[lang]) {
            console.log('Changing language from', language, 'to', lang);
            setLanguage(lang);
        } else {
            console.warn(`Language '${lang}' not supported. Available: ${Object.keys(translations).join(', ')}`);
        }
    }, [language]);

    const availableLanguages = useMemo(() => [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
        { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
    ], []);

    // Memoize the context value to prevent unnecessary re-renders
    // but ensure it updates when language changes
    const value = useMemo(() => ({
        language,
        changeLanguage,
        t,
        availableLanguages
    }), [language, changeLanguage, t, availableLanguages]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageContext;
