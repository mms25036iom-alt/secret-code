# ASHA Worker Portal - Maternal Healthcare System

## Overview
A comprehensive portal for ASHA (Accredited Social Health Activist) workers to manage pregnant women in Nabha village, addressing delivery, labor, and pregnancy phase issues through systematic tracking and follow-ups.

## Features Implemented

### 1. ASHA Worker Authentication
- **Login System**: Government ID + Password authentication
- **Secure Access**: JWT token-based authentication
- **Profile Management**: View and update worker details

### 2. Patient Management
- **Register Pregnant Women**: Complete patient registration with:
  - Personal information (name, age, phone, address)
  - Family details (husband information)
  - Pregnancy details (LMP, EDD, gravida, para)
  - Medical history (blood group, complications, chronic diseases)
  - Emergency contacts
- **Automatic Risk Assessment**: System identifies high-risk pregnancies based on:
  - Age factors (< 18 or > 35)
  - Grand multipara (> 4 pregnancies)
  - Chronic diseases
- **Automatic EDD Calculation**: Calculates Expected Delivery Date from LMP

### 3. Follow-up Management
- **Weekly Follow-ups**: Track patient visits with:
  - Date and week of pregnancy
  - Weight and blood pressure monitoring
  - Hemoglobin levels
  - Complaints and findings
  - Medical advice
  - Next visit scheduling
  - Doctor referral tracking
- **Visit Scheduling**: Automatic tracking of:
  - Upcoming visits (next 7 days)
  - Overdue visits
  - Last visit date

### 4. Medicine Management
- **Prescriptions**: Add and track medicines with:
  - Medicine name and dosage
  - Frequency and duration
  - Start and end dates
  - Prescriber information
  - Notes
- **Update Medicines**: Modify existing prescriptions

### 5. Health Monitoring
- **Vaccinations**: Track TT1, TT2, TT Booster
- **Lab Tests**: Record test results and findings
- **Vital Signs**: Monitor weight, BP, hemoglobin

### 6. Delivery Tracking
- **Delivery Details**: Record:
  - Delivery date and type
  - Baby gender and weight
  - Complications
  - Hospital information
- **Status Updates**: Automatic status change to "Delivered"

### 7. Dashboard & Analytics
- **Statistics**:
  - Total patients
  - Active pregnancies
  - High-risk cases
  - Delivered patients
  - Upcoming visits (7 days)
  - Overdue visits
- **Quick Actions**:
  - Add new patient
  - View all patients
  - Check upcoming visits
  - Review overdue visits
  - Filter high-risk patients

### 8. Patient List Views
- **Filters**:
  - By status (Active, Delivered, Referred, Inactive)
  - High-risk patients
  - Upcoming visits
  - Overdue visits
- **Search**: By name or phone number
- **Visual Indicators**:
  - Status badges
  - High-risk warnings
  - Overdue visit alerts

## Technical Architecture

### Backend (Node.js + Express + MongoDB)

#### Models
1. **AshaWorkerModel** (`Backend/models/ashaWorkerModel.js`)
   - Authentication and profile management
   - JWT token generation
   - Password hashing with bcrypt

2. **PregnantPatientModel** (`Backend/models/pregnantPatientModel.js`)
   - Comprehensive patient data structure
   - Embedded documents for follow-ups, medicines, vaccinations
   - Methods for risk assessment and week calculation

#### Controllers
1. **ashaWorkerController.js**
   - Registration and login
   - Profile management
   - Dashboard statistics

2. **pregnantPatientController.js**
   - Patient CRUD operations
   - Follow-up management
   - Medicine tracking
   - Vaccination and lab test recording
   - Delivery details

#### Middleware
- **ashaAuth.js**: JWT authentication for ASHA workers

#### Routes
- **ashaRoutes.js**: All ASHA worker and patient management endpoints

### Frontend (React)

#### Pages
1. **AshaWorkerLogin.jsx**: Login interface
2. **AshaDashboard.jsx**: Main dashboard with statistics
3. **AddPatient.jsx**: Patient registration form
4. **PatientList.jsx**: Patient listing with filters

#### Styling
- Modern, responsive CSS
- Gradient designs
- Mobile-friendly layouts

## API Endpoints

### Authentication
```
POST /api/v1/asha/register - Register ASHA worker (Admin)
POST /api/v1/asha/login - Login
GET /api/v1/asha/profile - Get profile
PUT /api/v1/asha/profile - Update profile
```

### Dashboard
```
GET /api/v1/asha/dashboard/stats - Get statistics
```

### Patient Management
```
POST /api/v1/asha/patients - Add patient
GET /api/v1/asha/patients - Get all patients
GET /api/v1/asha/patients/:id - Get patient details
PUT /api/v1/asha/patients/:id - Update patient
GET /api/v1/asha/patients/upcoming-visits - Upcoming visits
GET /api/v1/asha/patients/overdue-visits - Overdue visits
```

### Follow-ups
```
POST /api/v1/asha/patients/:id/followup - Add follow-up
```

### Medicines
```
POST /api/v1/asha/patients/:id/medicines - Add medicine
PUT /api/v1/asha/patients/:id/medicines/:medicineId - Update medicine
```

### Vaccinations & Tests
```
POST /api/v1/asha/patients/:id/vaccinations - Add vaccination
POST /api/v1/asha/patients/:id/labtests - Add lab test
```

### Delivery
```
PUT /api/v1/asha/patients/:id/delivery - Update delivery details
```

## Setup Instructions

### 1. Backend Setup
```bash
cd Backend
npm install
```

Add to `.env`:
```
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
```

Add to `.env`:
```
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Start Servers
```bash
# Backend
cd Backend
npm run dev

# Frontend
cd Frontend
npm run dev
```

### 4. Register First ASHA Worker
Use API tool (Postman/Thunder Client):
```
POST http://localhost:5000/api/v1/asha/register
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

### 5. Login
Navigate to: `http://localhost:5173/asha/login`
- Govt ID: ASHA001
- Password: password123

## Usage Workflow

### For ASHA Workers

1. **Login** with Government ID and password

2. **Dashboard Overview**
   - View statistics of all patients
   - Check upcoming and overdue visits
   - Monitor high-risk cases

3. **Add New Patient**
   - Click "Add New Patient"
   - Fill complete registration form
   - System auto-calculates EDD and assesses risk

4. **Conduct Follow-ups**
   - Select patient from list
   - Add follow-up visit details
   - Record vitals, complaints, findings
   - Schedule next visit
   - Refer to doctor if needed

5. **Manage Medicines**
   - Add prescribed medicines
   - Update dosages and duration
   - Track medication compliance

6. **Track Vaccinations**
   - Record TT vaccinations
   - Set reminder for next dose

7. **Monitor High-Risk Cases**
   - Filter high-risk patients
   - Ensure frequent follow-ups
   - Coordinate with doctors

8. **Record Delivery**
   - Update delivery details
   - Record baby information
   - Note any complications

## Data Security
- Password hashing with bcrypt
- JWT token authentication
- Authorization checks on all routes
- ASHA workers can only access their assigned patients

## Mobile Responsiveness
- Fully responsive design
- Works on tablets and smartphones
- Touch-friendly interface

## Future Enhancements
1. SMS/WhatsApp reminders for visits
2. Integration with government health systems
3. Offline mode for areas with poor connectivity
4. Multi-language support (Punjabi, Hindi)
5. Photo upload for patient documents
6. Nutrition and diet tracking
7. Ambulance booking integration
8. Video consultation with doctors
9. Report generation (monthly, quarterly)
10. Training modules for ASHA workers

## Support
For technical support or feature requests, contact the development team.

## License
This system is developed for maternal healthcare in Nabha village and is intended for use by authorized ASHA workers only.
