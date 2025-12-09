# 🚀 Quick Start Guide - Emergency Features

## ⚡ 5-Minute Setup

### 1. Backend Setup (2 minutes)

```bash
# Navigate to Backend
cd Backend

# Install dependencies (if not already done)
npm install

# Start server
npm start
```

**Server should start on**: http://localhost:4000

### 2. Frontend Setup (2 minutes)

```bash
# Navigate to Frontend
cd Frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**App should open on**: http://localhost:5173

### 3. Quick Test (1 minute)

1. **Login** as a patient
2. **Look for red SOS button** (bottom-right corner)
3. **Click it** - Location should load
4. **Go to Profile** - See Family Members & Emergency Contacts sections

✅ **If you see these, everything is working!**

---

## 🎯 Feature Locations

### For Patients:

| Feature | Location | How to Access |
|---------|----------|---------------|
| **SOS Button** | Floating (bottom-right) | Always visible |
| **Family Members** | Profile → Scroll down | Click profile icon |
| **Emergency Contacts** | Profile → Scroll down | Click profile icon |
| **Book for Family** | Appointment Booking | Select "Family Member" |

### For Doctors:

| Feature | Location | What You See |
|---------|----------|--------------|
| **Family Appointments** | Appointments List | "Child Name - Parent Name" |
| **Patient Details** | Appointment Card | Family member info |
| **Prescriptions** | Create Prescription | Correct patient name |

---

## 📱 Quick Actions

### Add Emergency Contact
1. Profile → Emergency Contacts
2. Click "Add Contact"
3. Fill: Name, Relationship, Phone
4. Check "Primary" (optional)
5. Save

### Add Family Member
1. Profile → Family Members
2. Click "Add Member"
3. Fill: Name, Relationship, Age, Gender
4. Save

### Trigger SOS
1. Click red SOS button
2. Allow location access
3. Select severity
4. Add description (optional)
5. Click "Trigger SOS Alert"

### Request Ambulance
1. Click red SOS button
2. Allow location access
3. Add description
4. Click "Request Ambulance"

### Book for Family
1. Chat → Select Doctor → Book Appointment
2. Click "Family Member" button
3. Select family member
4. Fill appointment details
5. Submit

---

## 🔧 Configuration (Optional)

### Enable SMS Notifications

**Get Twilio Credentials**:
1. Sign up: https://www.twilio.com
2. Get: Account SID, Auth Token, Phone Number

**Add to Backend/.env**:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

**Restart Backend**:
```bash
npm start
```

✅ **SMS notifications now active!**

---

## 🐛 Troubleshooting

### SOS Button Not Visible
- ✅ Check: Logged in as patient (not doctor)
- ✅ Check: Not on video call page
- ✅ Check: User authenticated

### Location Not Working
- ✅ Allow location permission in browser
- ✅ Use HTTPS (location requires secure context)
- ✅ Try different browser

### SMS Not Sending
- ✅ Check Twilio credentials in .env
- ✅ Check Twilio account has credits
- ✅ Restart backend after adding credentials

### Family Members Not Showing
- ✅ Check logged in as patient
- ✅ Check network tab for errors
- ✅ Check MongoDB connection

---

## 📊 Test Checklist

Quick verification:

- [ ] SOS button visible
- [ ] Location captures
- [ ] Emergency contacts can be added
- [ ] Family members can be added
- [ ] Appointment booking shows "Booking For"
- [ ] Family member dropdown populated
- [ ] Appointment shows correct patient name
- [ ] No console errors

---

## 🎓 User Guide (Share with Users)

### For Patients:

**Setting Up Emergency Contacts**:
1. Go to your Profile
2. Scroll to "Emergency Contacts"
3. Add at least 2 contacts
4. Mark one as primary

**Adding Family Members**:
1. Go to your Profile
2. Scroll to "Family Members"
3. Add each family member
4. Include medical conditions if any

**In Case of Emergency**:
1. Click the red SOS button
2. Your location will be shared automatically
3. All emergency contacts will be notified
4. For ambulance, click "Request Ambulance"

**Booking for Family**:
1. Select a doctor
2. Click "Book Appointment"
3. Choose "Family Member"
4. Select who you're booking for
5. Complete booking

---

## 📞 Emergency Numbers (Nabha)

Keep these handy:

- 🚑 **Ambulance**: 108
- 🏥 **Nabha Civil Hospital**: 01765-222108
- 🚨 **Police**: 100
- 🔥 **Fire**: 101

---

## 💡 Pro Tips

1. **Add emergency contacts BEFORE emergency** - Don't wait!
2. **Test SOS once** - Make sure it works
3. **Keep location ON** - For faster emergency response
4. **Add family medical conditions** - Helps doctors
5. **Update emergency contacts** - Keep them current

---

## 🎯 Success Indicators

You're all set if:

✅ Red SOS button visible
✅ Location permission granted
✅ At least 2 emergency contacts added
✅ Family members added (if needed)
✅ Test SOS worked
✅ No errors in console

---

## 📚 More Information

- **Full Documentation**: See `EMERGENCY_FEATURES_IMPLEMENTATION.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_COMPLETE.md`

---

## 🆘 Need Help?

1. Check browser console for errors
2. Check backend logs
3. Verify environment variables
4. Test with different user account
5. Try different browser

---

## 🎉 You're Ready!

All emergency features are now active and ready to use. The app can now:

- ✅ Trigger SOS alerts
- ✅ Share location automatically
- ✅ Notify emergency contacts
- ✅ Request ambulances
- ✅ Manage family members
- ✅ Book appointments for family

**Stay safe! 🏥**
