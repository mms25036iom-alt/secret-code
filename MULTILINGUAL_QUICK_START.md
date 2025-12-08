# 🌍 Multilingual Support - Quick Start Guide

## What's New?

Cureon now supports **3 languages**:
- 🇬🇧 **English** (Default)
- 🇮🇳 **हिंदी** (Hindi)
- 🇮🇳 **ਪੰਜਾਬੀ** (Punjabi)

## How to Use

### For Users

1. **Find the Language Selector**
   - Desktop: Look for the 🌐 globe icon in the top-right navbar
   - Mobile: Tap the 🌐 icon next to the profile icon

2. **Switch Language**
   - Click/tap the language selector
   - Choose your preferred language:
     - English
     - हिंदी (Hindi)
     - ਪੰਜਾਬੀ (Punjabi)

3. **Automatic Features**
   - ✅ All text updates instantly
   - ✅ Your choice is saved (persists after refresh)
   - ✅ Works on all devices (desktop, tablet, mobile)

### For Developers

#### Using Translations in Components

```jsx
import { useLanguage } from '../context/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

#### Available Translation Keys

**Common Actions**
- `t('common.submit')` → "Submit" / "जमा करें" / "ਜਮ੍ਹਾਂ ਕਰੋ"
- `t('common.cancel')` → "Cancel" / "रद्द करें" / "ਰੱਦ ਕਰੋ"
- `t('common.save')` → "Save" / "सहेजें" / "ਸੰਭਾਲੋ"

**Navigation**
- `t('navbar.home')` → "Home" / "होम" / "ਘਰ"
- `t('navbar.appointments')` → "Appointments" / "अपॉइंटमेंट" / "ਮੁਲਾਕਾਤਾਂ"
- `t('navbar.prescriptions')` → "Prescriptions" / "प्रिस्क्रिप्शन" / "ਨੁਸਖੇ"

**Authentication**
- `t('auth.login')` → "Login" / "लॉगिन" / "ਲੌਗਇਨ"
- `t('auth.logout')` → "Logout" / "लॉगआउट" / "ਲੌਗਆਉਟ"

**Appointments**
- `t('appointment.bookAppointment')` → "Book Appointment" / "अपॉइंटमेंट बुक करें" / "ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ"
- `t('appointment.selectDoctor')` → "Select Doctor" / "डॉक्टर चुनें" / "ਡਾਕਟਰ ਚੁਣੋ"

#### Adding New Translations

1. **Add to all 3 files**:
   - `Frontend/src/locales/en.json`
   - `Frontend/src/locales/hi.json`
   - `Frontend/src/locales/pa.json`

2. **Example**:
```json
// en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}

// hi.json
{
  "myFeature": {
    "title": "मेरी सुविधा",
    "description": "यह मेरी सुविधा है"
  }
}

// pa.json
{
  "myFeature": {
    "title": "ਮੇਰੀ ਵਿਸ਼ੇਸ਼ਤਾ",
    "description": "ਇਹ ਮੇਰੀ ਵਿਸ਼ੇਸ਼ਤਾ ਹੈ"
  }
}
```

3. **Use in component**:
```jsx
<h1>{t('myFeature.title')}</h1>
<p>{t('myFeature.description')}</p>
```

## Currently Translated Components

✅ **Navbar** - All navigation items, buttons, dropdowns
✅ **Landing Page** - Services, AI Assistant, CTA
✅ **Bottom Navigation Bar** - Mobile navigation
✅ **Language Selector** - Language switching UI

## Testing Checklist

- [ ] Switch to Hindi - verify all text changes
- [ ] Switch to Punjabi - verify all text changes
- [ ] Switch back to English - verify all text changes
- [ ] Refresh page - verify language persists
- [ ] Test on mobile - verify language selector works
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Check console for any translation warnings

## Troubleshooting

### Language not changing?
- Clear browser cache and localStorage
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors

### Text showing as keys (e.g., "navbar.home")?
- Translation key might be missing
- Check console for warnings
- Verify key exists in all 3 language files

### Language not persisting after refresh?
- Check if localStorage is enabled in browser
- Check browser privacy settings
- Try in incognito/private mode

## Browser Support

✅ Chrome/Edge (Recommended)
✅ Firefox
✅ Safari
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Bundle Size Impact**: ~15KB (5KB per language file)
- **Load Time**: Instant (translations loaded with app)
- **Switching Speed**: Instant (no network requests)
- **Memory Usage**: Minimal (~50KB for all translations)

## Accessibility

✅ HTML `lang` attribute updates automatically
✅ Screen readers detect language changes
✅ Keyboard navigation works in all languages
✅ RTL support ready (for future Arabic/Urdu)

## Future Enhancements

🔄 **Planned**:
- More components (AppointmentBooking, Profile, etc.)
- More languages (Bengali, Tamil, Telugu, Marathi)
- Translation management UI for admins
- Automatic translation suggestions
- Regional variants (en-US, en-GB, hi-IN)

## Need Help?

- Check `MULTILINGUAL_IMPLEMENTATION_GUIDE.md` for detailed docs
- Check `MULTILINGUAL_STATUS.md` for implementation status
- Contact development team for translation issues

---

**Status**: ✅ Phase 1 Complete - Ready for Testing
**Last Updated**: December 7, 2025
