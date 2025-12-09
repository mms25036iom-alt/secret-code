const ErrorHander = require("../utils/errorHander");
const Appointment = require("../models/appointmentModel.js");
const User = require("../models/userModel.js");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const catchAsyncError = require("../middleware/catchAsyncError");
const validator = require("validator");
const sendSMS = require("../utils/sendSMS");
const sendReminder = require("../utils/sendReminder");

const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 12);
};

exports.newAppointment = catchAsyncError(async (req, res, next) => {
    const { doctor, description, symptoms, symptomsAudio, day, time } = req.body;

    console.log('📥 Received appointment data:', {
        doctor,
        description: description ? `"${description}"` : 'empty',
        symptoms: symptoms ? `"${symptoms}"` : 'empty',
        symptomsAudio: symptomsAudio ? 'URL present' : 'empty',
        day,
        time
    });

    if (!doctor || !day || !time) {
        return next(new ErrorHander("Please provide doctor, day, and time", 400));
    }

    // Validate that at least one of symptoms or symptomsAudio is provided
    if ((!symptoms || symptoms.trim().length === 0) && (!symptomsAudio || symptomsAudio.trim().length === 0)) {
        return next(new ErrorHander("Please provide symptoms either as text or audio recording", 400));
    }

    // Description is optional if audio is provided
    if (!description || description.trim().length === 0) {
        if (!symptomsAudio || symptomsAudio.trim().length === 0) {
            return next(new ErrorHander("Please provide description or audio recording", 400));
        }
    }
    const doctorExists = await User.findOne({ _id: doctor, role: "doctor" });
    if (!doctorExists) {
        return next(new ErrorHander("Doctor not found", 404));
    }

    const existingAppointment = await Appointment.findOne({
        doctor,
        day,
        time
    });
    if (existingAppointment) {
        return next(new ErrorHander("This time slot is already booked", 400));
    }

    // Generate a random roomId
    const roomId = generateRoomId();

    const appointment = await Appointment.create({
        patient: req.user._id,
        doctor,
        description: description || 'Audio description provided',
        symptoms: symptoms || 'Audio symptoms provided',
        symptomsAudio: symptomsAudio || null,
        day,
        time,
        roomId // Add the roomId to the appointment
    });
    
    console.log('✅ Appointment created successfully:', {
        id: appointment._id,
        hasAudio: !!appointment.symptomsAudio,
        hasText: !!(symptoms && symptoms.trim().length > 0)
    });
    // Try to send email/SMS notification but don't fail if it doesn't work
    const isEmail = validator.isEmail(req.user.contact);

    try {
        let message = `
        Dear ${req.user.name},
        Your appointment has been successfully scheduled with Dr. ${doctorExists.name}.

        Appointment Details:
        -------------------
        Date: ${day}
        Time: ${time}
        Doctor: Dr. ${doctorExists.name}
        Speciality: ${doctorExists.speciality}
        Description: ${description}
        Symptoms: ${symptoms}
        
        To join the video call, go to your Appointments page and click "Join Call" button.

        Best regards,
        TeleConnect Team
        `;
        
        if (isEmail) {
            await sendEmail({
                email: req.user.contact,
                subject: `Appointment Confirmation - TeleConnect`,
                message,
            });
            
            // Send separate email to doctor
            const doctorMessage = `
            Dear Dr. ${doctorExists.name},
            You have a new appointment scheduled.

            Patient Details:
            ---------------
            Patient: ${req.user.name}
            Contact: ${req.user.contact}
            Date: ${day}
            Time: ${time}
            Description: ${description}
            Symptoms: ${symptoms}
            
            To join the video call, go to your Appointments page and click "Join Call" button.

            Best regards,
            TeleConnect Team
            `;

            await sendEmail({
                email: doctorExists.contact,
                subject: `New Appointment - ${req.user.name}`,
                message: doctorMessage,
            });
            
            console.log('✅ Appointment emails sent successfully');
        } else {
            message = `
                TeleConnect: Appointment confirmed!
                Dr. ${doctorExists.name} (${doctorExists.speciality})
                Date: ${day}
                Time: ${time}
                Room ID: ${roomId}
                Description: ${description}
                Symptoms: ${symptoms}
            `;
            
            await sendSMS({
                phone: `+91${req.user.contact}`,
                message,
            });
            
            console.log('✅ Appointment SMS sent successfully');
        }
    } catch (error) {
        // Log the error but don't fail the appointment creation
        console.error('⚠️ Failed to send appointment notification:', error.message);
        console.log('Appointment created successfully without notification');
    }

    // Schedule reminders 5 minutes before appointment
    const appointmentDateTime = new Date(`${day}T${time}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - 5 * 60000); // 5 minutes before
    const now = new Date();

    if (reminderTime > now) {
        const timeoutDuration = reminderTime.getTime() - now.getTime();
        
        setTimeout(async () => {
            try {
                await sendReminder(req.user, {
                    day,
                    time,
                    roomId,
                });
                await sendReminder(doctorExists, {
                    day,
                    time,
                    roomId,
                });
            } catch (error) {
                console.error("Failed to send reminder:", error);
            }
        }, timeoutDuration);
    }

    res.status(201).json({
        success: true,
        appointment
    });
});

exports.allAppointments = catchAsyncError(async (req, res, next) => {
    let appointments;
    try {
        console.log(`📋 Fetching appointments for ${req.user.role}: ${req.user._id}`);
        
        if (req.user.role == 'doctor') {
            appointments = await Appointment.find({ doctor: req.user._id })
                .populate('patient', 'name contact')
                .populate('doctor', 'name speciality availablity')
                .sort({ day: -1, time: -1 }); // Most recent appointments first
            
            console.log(`✅ Found ${appointments.length} appointments for doctor`);
            
            // Log patient data for debugging
            if (appointments.length > 0) {
                console.log('📊 Sample appointment data:', {
                    id: appointments[0]._id,
                    status: appointments[0].status,
                    hasPatient: !!appointments[0].patient,
                    patientId: appointments[0].patient?._id,
                    patientName: appointments[0].patient?.name,
                    patientContact: appointments[0].patient?.contact
                });
            }
        } else {
            appointments = await Appointment.find({ patient: req.user._id })
                .populate('doctor', 'name speciality availablity')
                .populate('patient', 'name contact')
                .sort({ day: -1, time: -1 }); // Most recent appointments first
            
            console.log(`✅ Found ${appointments.length} appointments for patient`);
        }
    } catch (error) {
        console.error('❌ Error fetching appointments:', error);
        return next(new ErrorHander(`Failed to fetch appointments: ${error.message}`, 500));
    }

    if (!appointments || appointments.length === 0) {
        console.log('⚠️ No appointments found');
        return res.status(200).json({
            success: true,
            message: "No appointments found",
            appointments: []
        });
    }

    // Auto-update past appointments based on their status
    // Only update if appointment was more than 1 hour ago to avoid timezone issues
    const now = new Date();
    
    try {
        const updatePromises = appointments.map(async (appointment) => {
            try {
                const appointmentDateTime = new Date(`${appointment.day}T${appointment.time}`);
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
                
                // If appointment time was more than 1 hour ago
                if (appointmentDateTime < oneHourAgo) {
                    // If still pending, mark as missed (doctor didn't accept)
                    if (appointment.status === 'pending') {
                        appointment.status = 'missed';
                        appointment.cancellationReason = 'Doctor did not accept the appointment in time';
                        await appointment.save();
                    }
                    // If confirmed but not completed, mark as completed
                    else if (appointment.status === 'confirmed') {
                        appointment.status = 'completed';
                        await appointment.save();
                    }
                }
                return appointment;
            } catch (err) {
                console.error('Error updating appointment:', appointment._id, err);
                return appointment; // Return unchanged if error
            }
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error in auto-update logic:', error);
        // Continue even if auto-update fails
    }

    // Format appointments for better readability
    const formattedAppointments = appointments.map(appointment => ({
        _id: appointment._id,
        patient: {
            id: appointment.patient._id,
            name: appointment.patient.name,
            contact: appointment.patient.contact
        },
        doctor: {
            id: appointment.doctor._id,
            name: appointment.doctor.name,
            speciality: appointment.doctor.speciality,
            availability: appointment.doctor.availablity
        },
        description: appointment.description,
        symptoms: appointment.symptoms,
        symptomsAudio: appointment.symptomsAudio || null,
        day: appointment.day,
        time: appointment.time,
        status: appointment.status,
        cancellationReason: appointment.cancellationReason || null, // Include cancellation reason
        roomId: appointment.roomId, // Add roomId to the response
        createdAt: appointment.createdAt
    }));

    console.log(`✅ Returning ${formattedAppointments.length} appointments for ${req.user.role}: ${req.user.name}`);

    res.status(200).json({
        success: true,
        count: appointments.length,
        appointments: formattedAppointments
    });
});

exports.deleteAppointment = catchAsyncError(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new ErrorHander('Appointment not found', 404));
    }

    // Check if user owns this appointment
    if (appointment.patient.toString() !== req.user._id.toString()) {
        return next(new ErrorHander('You can only delete your own appointments', 403));
    }

    await appointment.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully'
    });
});

// Get single appointment details
exports.getSingleAppointment = catchAsyncError(async (req, res, next) => {
    if (!req.params.id) {
        return next(new ErrorHander("Please provide appointment ID", 400));
    }

    const appointment = await Appointment.findById(req.params.id)
        .populate('doctor', 'name speciality')
        .populate('patient', 'name');

    if (!appointment) {
        return next(new ErrorHander('Appointment not found', 404));
    }

    res.status(200).json({
        success: true,
        appointment
    });
});

// Get available time slots for a doctor on a specific date
exports.getAvailableSlots = catchAsyncError(async (req, res, next) => {
    const { doctorId, date } = req.params;

    if (!doctorId || !date) {
        return next(new ErrorHander("Doctor ID and date are required", 400));
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return next(new ErrorHander("Invalid date format. Use YYYY-MM-DD", 400));
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
        return next(new ErrorHander("Doctor not found", 404));
    }

    // Get all non-cancelled appointments for this doctor on this date
    const existingAppointments = await Appointment.find({
        doctor: doctorId,
        day: date,
        status: { $nin: ['cancelled', 'missed'] } // Exclude cancelled and missed appointments
    }).select('time status patient');

    console.log(`📅 Checking slots for Dr. ${doctor.name} on ${date}`);
    console.log(`📋 Found ${existingAppointments.length} active appointments`);
    
    // Define available time slots (9 AM to 5 PM, 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            allSlots.push(timeString);
        }
    }

    // Filter out booked slots (only active appointments)
    const bookedTimes = existingAppointments.map(apt => apt.time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    console.log(`🔒 Booked slots: ${bookedTimes.join(', ') || 'None'}`);
    console.log(`✅ Available slots: ${availableSlots.length} out of ${allSlots.length}`);

    res.status(200).json({
        success: true,
        availableSlots,
        bookedSlots: bookedTimes, // Include booked slots for debugging
        totalSlots: allSlots.length,
        doctor: {
            id: doctor._id,
            name: doctor.name,
            speciality: doctor.speciality
        },
        date
    });
});

// Migration endpoint to fix existing appointments (temporary - for development)
exports.migrateAppointments = catchAsyncError(async (req, res, next) => {
    try {
        // Get all appointments without validation
        const appointments = await Appointment.find({}).lean();
        
        console.log(`Found ${appointments.length} appointments to check`);
        
        let updated = 0;
        for (const apt of appointments) {
            // Update appointments that don't have the new fields
            const updateData = {};
            
            // Ensure status is valid
            if (!['pending', 'confirmed', 'completed', 'cancelled', 'missed'].includes(apt.status)) {
                updateData.status = 'pending';
            }
            
            // Add cancellationReason field if it doesn't exist
            if (!apt.hasOwnProperty('cancellationReason')) {
                updateData.cancellationReason = null;
            }
            
            if (Object.keys(updateData).length > 0) {
                await Appointment.updateOne({ _id: apt._id }, { $set: updateData });
                updated++;
            }
        }
        
        console.log(`Updated ${updated} appointments`);
        
        res.status(200).json({
            success: true,
            message: `Migration completed. Updated ${updated} appointments out of ${appointments.length}`,
            total: appointments.length,
            updated
        });
    } catch (error) {
        console.error('Migration error:', error);
        return next(new ErrorHander(`Migration failed: ${error.message}`, 500));
    }
});

// Update appointment status (for doctors to accept/complete appointments)
exports.updateAppointmentStatus = catchAsyncError(async (req, res, next) => {
    const { status, cancellationReason } = req.body;
    
    if (!status) {
        return next(new ErrorHander("Please provide status", 400));
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'missed'];
    if (!validStatuses.includes(status)) {
        return next(new ErrorHander("Invalid status. Must be one of: pending, confirmed, completed, cancelled, missed", 400));
    }

    const appointment = await Appointment.findById(req.params.id)
        .populate('patient', 'name contact')
        .populate('doctor', 'name speciality');

    if (!appointment) {
        return next(new ErrorHander('Appointment not found', 404));
    }

    // Check if appointment date/time has passed
    const appointmentDateTime = new Date(`${appointment.day}T${appointment.time}`);
    const now = new Date();
    
    if (appointmentDateTime < now && status === 'cancelled') {
        return next(new ErrorHander('Cannot cancel appointment after the scheduled time has passed', 400));
    }

    // Check if user is the doctor for this appointment
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHander('You can only update your own appointments', 403));
    }

    // Check if user is the patient and trying to cancel
    if (req.user.role === 'user' && appointment.patient._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHander('You can only update your own appointments', 403));
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    
    // Set cancellation reason
    if (status === 'cancelled' && cancellationReason) {
        appointment.cancellationReason = cancellationReason;
    } else if (status === 'cancelled') {
        // Default cancellation reasons
        if (req.user.role === 'doctor') {
            appointment.cancellationReason = 'Cancelled by doctor due to unavailability';
        } else {
            appointment.cancellationReason = 'Cancelled by patient';
        }
    }
    
    await appointment.save();

    // Send notification to patient about status change
    try {
        const isEmail = validator.isEmail(appointment.patient.contact);
        let message = `
        Dear ${appointment.patient.name},
        
        Your appointment status has been updated.
        
        Appointment Details:
        -------------------
        Doctor: Dr. ${appointment.doctor.name}
        Date: ${appointment.day}
        Time: ${appointment.time}
        Previous Status: ${oldStatus}
        New Status: ${status}
        
        ${status === 'confirmed' ? 'Your appointment has been confirmed by the doctor. You can join the video call from your Appointments page.' : ''}
        ${status === 'completed' ? 'Your appointment has been marked as completed. Thank you for using TeleConnect!' : ''}
        ${status === 'cancelled' ? 'Your appointment has been cancelled. Please contact us if you have any questions.' : ''}
        
        Best regards,
        TeleConnect Team
        `;
        
        if (isEmail) {
            await sendEmail({
                email: appointment.patient.contact,
                subject: `Appointment Status Update - TeleConnect`,
                message,
            });
            console.log('✅ Status update email sent to patient');
        } else {
            message = `TeleConnect: Appointment status updated to ${status}. Dr. ${appointment.doctor.name}, ${appointment.day} at ${appointment.time}`;
            await sendSMS({
                phone: `+91${appointment.patient.contact}`,
                message,
            });
            console.log('✅ Status update SMS sent to patient');
        }
    } catch (error) {
        console.error('⚠️ Failed to send status update notification:', error.message);
    }

    res.status(200).json({
        success: true,
        message: `Appointment status updated to ${status}`,
        appointment
    });
});