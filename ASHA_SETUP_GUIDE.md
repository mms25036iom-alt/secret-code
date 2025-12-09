# ASHA Worker Portal - Setup Guide

## Quick Integration Steps

### 1. Add Routes to Your React App

Update your main routing file (usually `App.jsx` or `Routes.jsx`):

```jsx
import AshaLandingPage from './pages/AshaLandingPage';
import AshaWorkerLogin from './pages/AshaWorkerLogin';
import AshaDashboard from './pages/AshaDashboard';
import AddPatient from './pages/AddPatient';
import PatientList from './pages/PatientList';
import PatientDetails from './pages/PatientDetails';

// Add these routes:
<Route path="/asha" element={<AshaLandingPage />} />
<Route path="/asha/login" element={<AshaWorkerLogin />} />
<Route path="/asha/dashboard" element={<AshaDashboard />} />
<Route path="/asha/patients" element={<PatientList />} />
<Route path="/asha/patients/add" element={<AddPatient />} />
<Route path="/asha/patients/:id" element={<PatientDetails />} />
```

### 2. Start Backend Server

```bash
cd Backend
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Start Frontend Server

```bash
cd Frontend
npm run dev
```

The app will start on `http://localhost:5173`

### 4. Register First ASHA Worker

Use an API client (Postman, Thunder Client, or curl):

```bash
POST http://localhost:5000/api/v1/asha/register
Content-Type: application/json

{
  "name": "Rajni Devi",
  "govtId": "ASHA001",
  "phone": "9876543210",
  "password": "password123",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "assignedArea": "Ward 1"
}
```

### 5. Access the Portal

1. **Landing Page**: Navigate to `http://localhost:5173/asha`
2. **Login**: Click "ASHA Worker Login" or go to `http://localhost:5173/asha/login`
3. **Credentials**:
   - Govt ID: `ASHA001`
   - Password: `password123`

## Page Flow

```
Landing Page (/asha)
    ↓
Login Page (/asha/login)
    ↓
Dashboard (/asha/dashboard)
    ↓
├── Add Patient (/asha/patients/add)
├── Patient List (/asha/patients)
│   ↓
│   Patient Details (/asha/patients/:id)
│       ↓
│       ├── Add Follow-up
│       ├── Add Medicine
│       ├── View Medical History
│       └── Update Delivery Details
```

## Features Available

### Landing Page
- Beautiful hero section with statistics
- About the program
- Features showcase
- How it works timeline
- Success stories/testimonials
- Call-to-action
- Footer with contact info

### Login Page
- Government ID authentication
- Password-based login
- Error handling
- Responsive design

### Dashboard
- Statistics overview:
  - Total patients
  - Active pregnancies
  - High-risk cases
  - Delivered patients
  - Upcoming visits
  - Overdue visits
- Quick action buttons
- Navigation to all features

### Add Patient
- Complete registration form
- Automatic EDD calculation from LMP
- Risk assessment
- Medical history capture
- Emergency contact details

### Patient List
- View all patients
- Filter by status (Active, Delivered, Referred, Inactive)
- Filter high-risk patients
- View upcoming visits
- View overdue visits
- Search by name or phone
- Visual indicators for status and risk

### Patient Details
- Comprehensive patient information
- Tabbed interface:
  - Overview
  - Follow-ups
  - Medicines
  - Medical History
- Add follow-up visits
- Record vitals (weight, BP, hemoglobin)
- Add medicines with dosage
- Track vaccinations
- Update delivery details

## Testing the System

### 1. Register a Patient
1. Login as ASHA worker
2. Click "Add New Patient"
3. Fill the form with test data:
   - Name: Priya Sharma
   - Age: 25
   - Phone: 9876543211
   - LMP: (select a date 12 weeks ago)
   - Fill other required fields
4. Submit

### 2. Add Follow-up
1. Go to Patient List
2. Click on the patient
3. Go to "Follow-ups" tab
4. Click "Add Follow-up"
5. Fill vitals and observations
6. Schedule next visit
7. Submit

### 3. Add Medicine
1. In Patient Details
2. Go to "Medicines" tab
3. Click "Add Medicine"
4. Enter medicine details
5. Submit

### 4. Check Dashboard Stats
- Return to dashboard
- Stats should update automatically
- Check upcoming visits
- Check overdue visits

## Customization

### Colors
Edit the CSS files to change the color scheme:
- Primary: `#667eea`
- Secondary: `#764ba2`
- Accent: `#f093fb`

### Village Name
Update "Nabha" references in:
- `AshaLandingPage.jsx`
- `AddPatient.jsx` (default village)
- `pregnantPatientModel.js` (default village)

### Language
Add translations for Punjabi/Hindi by:
1. Creating language files
2. Using i18n library
3. Updating text content

## Security Notes

1. **Production Setup**:
   - Change default passwords
   - Use strong JWT secrets
   - Enable HTTPS
   - Add rate limiting
   - Implement proper admin registration

2. **Access Control**:
   - Only authenticated ASHA workers can access portal
   - Workers can only see their assigned patients
   - Admin approval for new ASHA workers

3. **Data Privacy**:
   - Patient data is protected
   - Secure password storage (bcrypt)
   - JWT token authentication

## Troubleshooting

### Backend not starting
- Check MongoDB connection
- Verify `.env` file exists
- Check port 5000 is available

### Frontend not connecting
- Verify `VITE_BACKEND_URL` in Frontend `.env`
- Check CORS settings in `server.js`
- Ensure backend is running

### Login fails
- Verify ASHA worker is registered
- Check Govt ID is uppercase
- Verify password is correct
- Check JWT_SECRET in backend `.env`

### Stats not showing
- Check MongoDB connection
- Verify patients are assigned to logged-in ASHA worker
- Check browser console for errors

## Next Steps

1. **Add Navigation**: Include ASHA portal link in main app navigation
2. **Mobile App**: The portal is mobile-responsive and works on Android/iOS
3. **Notifications**: Implement SMS/WhatsApp reminders for visits
4. **Reports**: Add monthly/quarterly report generation
5. **Multi-language**: Add Punjabi and Hindi translations
6. **Offline Mode**: Implement service workers for offline access

## Support

For issues or questions:
- Check browser console for errors
- Review backend logs
- Verify database connections
- Check API endpoints are accessible

## Demo Credentials

After registration, use these for testing:
- **Govt ID**: ASHA001
- **Password**: password123

## Production Deployment

1. Set environment variables
2. Build frontend: `npm run build`
3. Deploy backend to cloud service
4. Deploy frontend to hosting service
5. Configure domain and SSL
6. Set up database backups
7. Enable monitoring and logging

---

**Congratulations!** Your ASHA Worker Portal is ready to transform maternal healthcare in Nabha village! 🎉
