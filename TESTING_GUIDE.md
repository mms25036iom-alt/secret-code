# Emergency Features Testing Guide

## Prerequisites

1. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```

2. **Environment Variables** (Backend/.env)
   ```env
   # Twilio Configuration (for SMS)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # MongoDB
   MONGO_URI=your_mongodb_connection_string
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   ```

3. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   ```

## Testing Steps

### 1. Test Family Members Management

1. **Login as a patient** (not doctor/pharmacist)
2. **Navigate to Profile** (click profile icon in bottom nav)
3. **Scroll down** to "Family Members" section
4. **Click "Add Member"**
   - Enter name: "John Doe"
   - Select relationship: "Child"
   - Enter age: 10
   - Select gender: "Male"
   - Enter phone: 9876543210 (optional)
   - Add medical conditions: "Asthma" (optional)
5. **Click "Add Member"** - Should see success toast
6. **Verify** family member appears in list
7. **Test Edit** - Click edit icon, modify details, save
8. **Test Delete** - Click delete icon, confirm deletion

**Expected Result**: ✅ Family member CRUD operations work smoothly

---

### 2. Test Emergency Contacts Management

1. **Stay on Profile page**
2. **Scroll to "Emergency Contacts"** section
3. **Click "Add Contact"**
   - Enter name: "Jane Doe"
   - Select relationship: "Spouse"
   - Enter phone: 9876543211 (10 digits required)
   - Check "Set as primary contact"
4. **Click "Add Contact"** - Should see success toast
5. **Add another contact** (without primary)
   - Name: "Bob Smith"
   - Relationship: "Friend"
   - Phone: 9876543212
6. **Verify** both contacts appear, primary has star icon
7. **Test Edit** - Change primary contact
8. **Test Delete** - Remove a contact

**Expected Result**: ✅ Emergency contacts management works, primary contact marked

---

### 3. Test Appointment Booking for Family Member

1. **Navigate to Chat/Doctors page**
2. **Select a doctor** and click "Book Appointment"
3. **In booking modal**, look for "Booking For" section at top
4. **Click "Family Member"** button
5. **Select family member** from dropdown (should show the one you added)
6. **Fill appointment details**:
   - Select date (future date)
   - Select time slot
   - Describe symptoms
7. **Submit appointment**
8. **Go to Appointments page**
9. **Verify** appointment shows: "John Doe - Your Name"

**Expected Result**: ✅ Appointment booked for family member with correct name format

---

### 4. Test SOS Button (Without SMS)

**Note**: If Twilio is not configured, SMS won't send but SOS will still work

1. **Look for red floating button** (bottom-right corner)
2. **Click SOS button**
3. **Allow location access** when browser prompts
4. **Wait for location** to load (shows address)
5. **Select severity**: "High" or "Critical"
6. **Add description**: "Chest pain, difficulty breathing"
7. **Click "Trigger SOS Alert"**
8. **Check console** for success message
9. **If Twilio configured**: Emergency contacts should receive SMS

**Expected Result**: ✅ SOS triggered, location captured, emergency record created

---

### 5. Test Ambulance Request

1. **Click SOS button** again
2. **Wait for location** to load
3. **Add description**: "Need immediate medical attention"
4. **Click "Request Ambulance"** button
5. **Should see success toast** with ambulance info:
   - Emergency Number: 108
   - Local Number: 01765-222108
   - ETA: 10-15 minutes
6. **If Twilio configured**: Emergency contacts receive SMS

**Expected Result**: ✅ Ambulance requested, contacts notified, emergency numbers shown

---

### 6. Test Location Sharing

1. **Trigger SOS** or **Request Ambulance**
2. **Check location display** in modal
3. **Should show**:
   - Latitude/Longitude
   - Reverse geocoded address (if available)
4. **Move to different location** (if testing on mobile)
5. **Trigger again** - location should update

**Expected Result**: ✅ Location accurately captured and displayed

---

### 7. Test SMS Notifications (Requires Twilio)

**Setup Twilio**:
1. Sign up at https://www.twilio.com
2. Get Account SID, Auth Token, Phone Number
3. Add to Backend/.env
4. Restart backend server

**Test**:
1. **Add emergency contact** with YOUR phone number
2. **Trigger SOS**
3. **Check your phone** - should receive SMS:
   ```
   🚨 EMERGENCY ALERT 🚨
   [Your Name] has triggered an SOS emergency!
   Location: [Your Location]
   Description: [Your Description]
   Please contact them immediately or call emergency services.
   - Cureon Health App
   ```

**Expected Result**: ✅ SMS received on emergency contact's phone

---

### 8. Test Without Location Permission

1. **Block location** in browser settings
2. **Click SOS button**
3. **Should see error**: "Failed to get location"
4. **SOS button should still be clickable** but won't submit without location

**Expected Result**: ✅ Graceful error handling when location denied

---

### 9. Test Appointment Display

1. **Book appointment for family member**
2. **Go to Appointments page**
3. **Verify patient name** shows: "Family Member Name - Account Name"
4. **Doctor should see** same format when viewing appointments
5. **When prescription created**, should show correct patient name

**Expected Result**: ✅ Patient name correctly formatted everywhere

---

### 10. Test Edge Cases

**Family Member Booking Without Adding Members**:
1. Try booking for family member without adding any
2. Should show: "No family members added. Add them in your profile first."

**SOS Without Emergency Contacts**:
1. Remove all emergency contacts
2. Trigger SOS
3. Should still work but show "0 contacts notified"

**Invalid Phone Numbers**:
1. Try adding emergency contact with 9 digits
2. Should show validation error

**Past Date Appointment**:
1. Try booking appointment for yesterday
2. Should show error: "Please select a future date"

**Expected Result**: ✅ All edge cases handled gracefully

---

## Verification Checklist

After testing, verify:

- [ ] Family members can be added/edited/deleted
- [ ] Emergency contacts can be added/edited/deleted
- [ ] Primary contact is marked with star
- [ ] SOS button visible only for patients
- [ ] Location captured automatically
- [ ] SOS creates emergency record
- [ ] Ambulance request works
- [ ] Emergency numbers displayed
- [ ] Appointments can be booked for family members
- [ ] Patient name format correct: "Family - Account"
- [ ] SMS sent to emergency contacts (if Twilio configured)
- [ ] All forms validate input properly
- [ ] No console errors
- [ ] Mobile responsive design works

---

## Troubleshooting

### Location Not Working
- **Check**: Browser location permission
- **Check**: HTTPS connection (location requires secure context)
- **Try**: Different browser

### SMS Not Sending
- **Check**: Twilio credentials in .env
- **Check**: Twilio account has credits
- **Check**: Phone number format (+91 for India)
- **Check**: Backend console for Twilio errors

### Family Members Not Showing
- **Check**: Logged in as patient (not doctor)
- **Check**: Network tab for API errors
- **Check**: MongoDB connection

### SOS Button Not Visible
- **Check**: User role is 'user' (patient)
- **Check**: User is authenticated
- **Check**: Not on video call page (hidden there)

---

## Database Verification

**Check Emergency Records**:
```javascript
// In MongoDB
db.emergencies.find({ patient: ObjectId("user_id") })
```

**Check User Emergency Contacts**:
```javascript
db.users.findOne({ _id: ObjectId("user_id") }, { emergencyContacts: 1, familyMembers: 1 })
```

**Check Appointments**:
```javascript
db.appointments.find({ patient: ObjectId("user_id") }, { patientName: 1, bookingFor: 1, familyMemberDetails: 1 })
```

---

## Success Criteria

✅ **All features working**:
- Family members management
- Emergency contacts management
- SOS with location sharing
- Ambulance requests
- SMS notifications (if Twilio configured)
- Appointment booking for family
- Correct patient name display

✅ **No errors** in:
- Browser console
- Backend console
- Network requests

✅ **Good UX**:
- Smooth animations
- Clear error messages
- Loading states
- Mobile responsive

---

## Next Steps After Testing

1. **Configure Twilio** for production SMS
2. **Add more emergency contacts** for testing
3. **Test on mobile device** for GPS accuracy
4. **Integrate with real ambulance service** (future)
5. **Add emergency medical records** (future)
6. **Implement geofencing** (future)

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify environment variables
4. Check MongoDB connection
5. Test with different user accounts
6. Try different browsers

**Emergency features are critical - test thoroughly before production!**
