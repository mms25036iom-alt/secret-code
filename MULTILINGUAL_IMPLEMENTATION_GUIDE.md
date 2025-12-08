# Multilingual Support Implementation Guide

## Overview
Cureon now supports **English, Hindi, and Punjabi** with a scalable i18n system that can easily be extended to more languages.

## Architecture

### 1. Translation Files (`Frontend/src/locales/`)
- `en.json` - English translations
- `hi.json` - Hindi translations (हिंदी)
- `pa.json` - Punjabi translations (ਪੰਜਾਬੀ)

### 2. Language Context (`Frontend/src/context/LanguageContext.jsx`)
- Manages current language state
- Provides translation function `t()`
- Persists language preference in localStorage
- Updates HTML lang attribute for accessibility

### 3. Language Selector Component
- Dropdown with flag icons
- Shows native language names
- Persists selection across sessions

## How to Use

### Step 1: Wrap Your App with LanguageProvider

In your `main.jsx` or `App.jsx`:

```jsx
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      {/* Your app components */}
    </LanguageProvider>
  );
}
```

### Step 2: Use Translations in Components

```jsx
import { useLanguage } from '../context/LanguageContext';

function MyComponent() {
  const { t, language } = useLanguage();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('appointment.bookAppointment')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### Step 3: Translations with Parameters

```jsx
const { t } = useLanguage();

// Translation: "Minimum {{count}} characters required"
<p>{t('validation.minLength', { count: 10 })}</p>
// Output: "Minimum 10 characters required"
```

## Translation Key Structure

```json
{
  "common": {
    "appName": "Cureon",
    "welcome": "Welcome",
    "loading": "Loading..."
  },
  "appointment": {
    "title": "Appointments",
    "bookAppointment": "Book Appointment",
    "status": {
      "pending": "Pending",
      "confirmed": "Confirmed"
    }
  }
}
```

Access nested keys with dot notation:
- `t('common.appName')` → "Cureon"
- `t('appointment.status.pending')` → "Pending"

## Example Component Conversion

### Before (Hardcoded English):
```jsx
function AppointmentBooking() {
  return (
    <div>
      <h2>Book Appointment</h2>
      <label>Select Doctor</label>
      <label>Select Date</label>
      <button>Submit</button>
    </div>
  );
}
```

### After (Multilingual):
```jsx
import { useLanguage } from '../context/LanguageContext';

function AppointmentBooking() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h2>{t('appointment.bookAppointment')}</h2>
      <label>{t('appointment.selectDoctor')}</label>
      <label>{t('appointment.selectDate')}</label>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

## Adding New Languages

### Step 1: Create Translation File
Create `Frontend/src/locales/[language-code].json`:

```json
{
  "common": {
    "appName": "Cureon",
    "welcome": "Bienvenue"
  }
}
```

### Step 2: Import in LanguageContext
```jsx
import fr from '../locales/fr.json';

const translations = {
  en,
  hi,
  pa,
  fr  // Add new language
};
```

### Step 3: Add to Available Languages
```jsx
availableLanguages: [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'fr', name: 'French', nativeName: 'Français' }  // Add here
]
```

### Step 4: Add Flag in LanguageSelector
```jsx
const languageFlags = {
  en: '🇬🇧',
  hi: '🇮🇳',
  pa: '🇮🇳',
  fr: '🇫🇷'  // Add flag
};
```

## Translation Categories

### 1. Common (`common.*`)
- App name, buttons, actions
- Loading states, errors
- Generic UI elements

### 2. Authentication (`auth.*`)
- Login, signup, logout
- Password fields
- Success/error messages

### 3. Navigation (`navbar.*`)
- Menu items
- Page titles

### 4. Appointments (`appointment.*`)
- Booking flow
- Status labels
- Actions

### 5. Prescriptions (`prescription.*`)
- Medical terms
- Medication fields

### 6. Validation (`validation.*`)
- Form validation messages
- Error messages

### 7. Messages (`messages.*`)
- Empty states
- Confirmation dialogs
- Generic messages

## Best Practices

### 1. Use Descriptive Keys
✅ Good: `appointment.bookAppointment`
❌ Bad: `btn1`, `text2`

### 2. Group Related Translations
```json
{
  "appointment": {
    "title": "Appointments",
    "actions": {
      "book": "Book",
      "cancel": "Cancel",
      "reschedule": "Reschedule"
    }
  }
}
```

### 3. Keep Translations Consistent
Use the same term across all languages:
- "Doctor" → "डॉक्टर" (Hindi) → "ਡਾਕਟਰ" (Punjabi)

### 4. Handle Plurals
```json
{
  "slotsAvailable": "{{count}} slots available",
  "slotAvailable": "{{count}} slot available"
}
```

### 5. Fallback to English
If a translation is missing, the system automatically falls back to English.

## Testing Translations

### 1. Manual Testing
- Switch language using LanguageSelector
- Navigate through all pages
- Check all UI elements

### 2. Check Console
Missing translations will log warnings:
```
Translation not found for key: appointment.newField
```

### 3. Verify Persistence
- Change language
- Refresh page
- Language should persist

## RTL Support (Future)

For languages like Arabic or Urdu:

```jsx
useEffect(() => {
  const rtlLanguages = ['ar', 'ur', 'he'];
  document.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
}, [language]);
```

## Performance Optimization

### 1. Lazy Loading (Future Enhancement)
```jsx
const loadTranslations = async (lang) => {
  const translations = await import(`../locales/${lang}.json`);
  return translations.default;
};
```

### 2. Translation Caching
Translations are loaded once and cached in memory.

### 3. Code Splitting
Translation files are separate JSON files, not bundled with main JS.

## Accessibility

### 1. HTML Lang Attribute
Automatically updated: `<html lang="hi">`

### 2. Screen Readers
Proper language detection for screen readers

### 3. ARIA Labels
```jsx
<button aria-label={t('appointment.bookAppointment')}>
  {t('common.submit')}
</button>
```

## Common Issues & Solutions

### Issue 1: Translation Not Showing
**Solution**: Check if key exists in all language files

### Issue 2: Language Not Persisting
**Solution**: Check localStorage permissions

### Issue 3: Special Characters Not Displaying
**Solution**: Ensure UTF-8 encoding in JSON files

### Issue 4: Context Not Available
**Solution**: Ensure component is wrapped in LanguageProvider

## Migration Checklist

- [x] Wrap app with LanguageProvider (✅ Done in main.jsx)
- [x] Replace hardcoded text with `t()` calls (✅ Done for Navbar, Landing, BottomNavBar)
- [x] Add translations to all 3 language files (✅ English, Hindi, Punjabi)
- [ ] Test language switching (⏳ Ready for testing)
- [ ] Verify persistence (⏳ Ready for testing)
- [ ] Check mobile responsiveness (⏳ Ready for testing)
- [ ] Test with screen readers
- [ ] Continue converting remaining components (AppointmentBooking, Profile, etc.)

## Implementation Status

### ✅ Completed Components
1. **Navbar** - Fully translated with role-based navigation
2. **Landing Page** - Services, AI Assistant, CTA sections translated
3. **BottomNavBar** - Mobile navigation fully translated
4. **LanguageContext** - Translation system with nested keys and parameters
5. **LanguageSelector** - Dropdown with native language names

### 🔄 Next Components to Convert
1. AppointmentBooking - High priority (patient-facing)
2. Profile/Account pages
3. Appointments list page
4. Prescriptions page
5. Chat/Doctor consultation pages
6. Health Tips and Analysis pages

## Future Enhancements

1. **Translation Management UI** - Admin panel to edit translations
2. **Automatic Translation** - Use Google Translate API for initial translations
3. **Crowdsourced Translations** - Allow community contributions
4. **Regional Variants** - en-US, en-GB, hi-IN
5. **Date/Time Localization** - Format dates per locale
6. **Number Formatting** - Currency, decimals per locale
7. **Pluralization Rules** - Advanced plural handling
8. **Translation Analytics** - Track missing translations

## Resources

- [React i18n Best Practices](https://react.i18next.com/)
- [Unicode CLDR](http://cldr.unicode.org/)
- [Google Translate](https://translate.google.com/)
- [Language Codes (ISO 639-1)](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Support

For translation issues or to add new languages, contact the development team.
