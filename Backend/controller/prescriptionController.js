const ErrorHander = require("../utils/errorHander");
const Prescription = require("../models/prescriptionModel");
const catchAsyncError = require("../middleware/catchAsyncError");

exports.createPrescription = catchAsyncError(async (req, res, next) => {
    const { 
        patientId, 
        appointmentId, 
        medications, 
        notes, 
        diagnosis,
        diagnosisAudio,
        symptoms, 
        followUpInstructions,
        pharmacyId // New field
    } = req.body;

    console.log('📝 Creating prescription with data:', { 
        patientId, 
        appointmentId, 
        medications: medications?.length, 
        diagnosis,
        diagnosisAudio: diagnosisAudio ? 'Yes' : 'No',
        medicationsWithAudio: medications?.filter(m => m.instructionsAudio).length || 0,
        pharmacyId: pharmacyId || 'Not selected'
    });

    if (!patientId || !medications || !diagnosis) {
        return next(new ErrorHander("Please provide all required fields (patientId, medications, diagnosis)", 400));
    }

    if (!Array.isArray(medications) || medications.length === 0) {
        return next(new ErrorHander("Please provide at least one medication", 400));
    }

    // Generate unique prescription number
    const prescriptionNumber = `RX${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const prescriptionData = {
        patient: patientId,
        doctor: req.user._id,
        medications,
        notes,
        diagnosis,
        diagnosisAudio,
        symptoms,
        followUpInstructions,
        prescriptionNumber,
        pharmacyStatus: 'pending'
    };

    // Only add appointmentId if it's provided
    if (appointmentId) {
        prescriptionData.appointment = appointmentId;
    }

    // Add pharmacy if selected
    if (pharmacyId) {
        prescriptionData.pharmacy = pharmacyId;
    }

    const prescription = await Prescription.create(prescriptionData);

    // Populate the prescription with patient, doctor, and pharmacy details
    await prescription.populate('patient', 'name contact');
    await prescription.populate('doctor', 'name speciality');
    if (appointmentId) {
        await prescription.populate('appointment', 'day time');
    }
    if (pharmacyId) {
        await prescription.populate('pharmacy', 'name address contactInfo');
    }

    console.log('✅ Prescription created successfully:', prescription.prescriptionNumber);

    res.status(201).json({
        success: true,
        prescription
    });
});

exports.getPrescriptions = catchAsyncError(async (req, res, next) => {
    let prescriptions;

    console.log('📋 Fetching prescriptions for user:', req.user.role, req.user._id);

    if (req.user.role === 'doctor') {
        prescriptions = await Prescription.find({ doctor: req.user._id })
            .populate('patient', 'name contact')
            .populate('doctor', 'name speciality')
            .populate('appointment', 'day time')
            .populate('pharmacy', 'name address contactInfo')
            .populate('dispensedBy', 'name') // Populate pharmacist who dispensed
            .sort({ createdAt: -1 });
    } else if (req.user.role === 'pharmacist' || req.user.role === 'pharmacy') {
        // Get pharmacy owned by this user
        const Pharmacy = require('../models/pharmacyModel');
        const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
        
        if (!pharmacy) {
            return res.status(200).json({
                success: true,
                prescriptions: [],
                message: 'No pharmacy found for this user'
            });
        }
        
        // Get prescriptions for this pharmacy
        prescriptions = await Prescription.find({ pharmacy: pharmacy._id })
            .populate('patient', 'name contact')
            .populate('doctor', 'name speciality')
            .populate('appointment', 'day time')
            .populate('pharmacy', 'name address contactInfo')
            .populate('dispensedBy', 'name')
            .sort({ createdAt: -1 });
    } else {
        prescriptions = await Prescription.find({ patient: req.user._id })
            .populate('doctor', 'name speciality')
            .populate('patient', 'name contact')
            .populate('appointment', 'day time')
            .populate('pharmacy', 'name address contactInfo')
            .populate('dispensedBy', 'name') // Populate pharmacist who dispensed
            .sort({ createdAt: -1 });
    }

    console.log('✅ Found prescriptions:', prescriptions.length);
    
    // Log first prescription for debugging
    if (prescriptions.length > 0) {
        console.log('📝 Sample prescription:', {
            id: prescriptions[0]._id,
            doctor: prescriptions[0].doctor?.name,
            patient: prescriptions[0].patient?.name,
            prescriptionNumber: prescriptions[0].prescriptionNumber
        });
    }

    res.status(200).json({
        success: true,
        prescriptions
    });
});

exports.getSinglePrescription = catchAsyncError(async (req, res, next) => {
    const prescription = await Prescription.findById(req.params.id)
        .populate('patient', 'name contact')
        .populate('doctor', 'name speciality')
        .populate('appointment', 'day time');

    if (!prescription) {
        return next(new ErrorHander("Prescription not found", 404));
    }

    // Check if user is authorized to view this prescription (only if user is authenticated)
    if (req.user) {
        if (req.user.role !== 'doctor' && 
            prescription.patient._id.toString() !== req.user._id.toString()) {
            return next(new ErrorHander("Not authorized to view this prescription", 403));
        }
    }
    // If no user (public QR code verification), allow access

    res.status(200).json({
        success: true,
        prescription
    });
});

// Dispense prescription (for pharmacists)
exports.dispensePrescription = catchAsyncError(async (req, res, next) => {
    console.log('💊 Dispensing prescription:', req.params.id);
    console.log('👤 User:', req.user.name, '| Role:', req.user.role);
    
    const prescription = await Prescription.findById(req.params.id)
        .populate('patient', 'name contact')
        .populate('doctor', 'name speciality')
        .populate('pharmacy', 'name');

    if (!prescription) {
        console.log('❌ Prescription not found');
        return next(new ErrorHander("Prescription not found", 404));
    }

    console.log('📋 Prescription found:', {
        number: prescription.prescriptionNumber,
        status: prescription.pharmacyStatus,
        hasPharmacy: !!prescription.pharmacy,
        pharmacyName: prescription.pharmacy?.name || 'None'
    });

    // Check if user is pharmacist and prescription belongs to their pharmacy
    const Pharmacy = require('../models/pharmacyModel');
    const Medicine = require('../models/medicineModel');
    
    const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
    
    if (!pharmacy) {
        console.log('❌ No pharmacy found for user');
        return next(new ErrorHander("No pharmacy found for this user", 404));
    }

    console.log('🏪 Current pharmacy:', pharmacy.name, '| ID:', pharmacy._id.toString());

    // If prescription has a pharmacy assigned, check if it matches
    if (prescription.pharmacy) {
        const prescriptionPharmacyId = prescription.pharmacy._id || prescription.pharmacy;
        console.log('🔍 Checking pharmacy match:', {
            prescriptionPharmacy: prescriptionPharmacyId.toString(),
            currentPharmacy: pharmacy._id.toString(),
            match: prescriptionPharmacyId.toString() === pharmacy._id.toString()
        });
        
        if (prescriptionPharmacyId.toString() !== pharmacy._id.toString()) {
            console.log('❌ Pharmacy mismatch!');
            return next(new ErrorHander("This prescription is not for your pharmacy", 403));
        }
        console.log('✅ Pharmacy match confirmed');
    } else {
        // If no pharmacy was assigned, allow any pharmacy to dispense (assign it now)
        console.log('✅ No pharmacy assigned, auto-assigning to:', pharmacy.name);
        prescription.pharmacy = pharmacy._id;
    }

    if (prescription.pharmacyStatus === 'dispensed') {
        return next(new ErrorHander("Prescription already dispensed", 400));
    }

    // Check stock and deduct medicines
    const stockUpdates = [];
    const insufficientStock = [];

    for (const med of prescription.medications) {
        // Find medicine in pharmacy's inventory
        const medicine = await Medicine.findOne({
            name: new RegExp(`^${med.name}$`, 'i'),
            pharmacy: pharmacy._id
        });

        if (!medicine) {
            insufficientStock.push({
                name: med.name,
                reason: 'Not in inventory'
            });
            continue;
        }

        // Parse quantity from dosage/frequency/duration
        // Simple calculation: assume 1 unit per frequency per day
        const durationMatch = med.duration?.match(/(\d+)/);
        const frequencyMatch = med.frequency?.match(/(\d+)/);
        
        const days = durationMatch ? parseInt(durationMatch[1]) : 7; // Default 7 days
        const timesPerDay = frequencyMatch ? parseInt(frequencyMatch[1]) : 2; // Default twice daily
        const quantityNeeded = days * timesPerDay;

        if (medicine.stock < quantityNeeded) {
            insufficientStock.push({
                name: med.name,
                available: medicine.stock,
                needed: quantityNeeded
            });
            continue;
        }

        stockUpdates.push({
            medicine,
            quantityNeeded
        });
    }

    // If any medicine has insufficient stock, return error
    if (insufficientStock.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient stock for some medicines',
            insufficientStock
        });
    }

    // Update stock for all medicines
    for (const update of stockUpdates) {
        update.medicine.stock -= update.quantityNeeded;
        await update.medicine.save();
    }

    // Update prescription status
    prescription.pharmacyStatus = 'dispensed';
    prescription.dispensedAt = Date.now();
    prescription.dispensedBy = req.user._id;
    await prescription.save();

    console.log('✅ Prescription dispensed:', prescription.prescriptionNumber);

    res.status(200).json({
        success: true,
        message: 'Prescription dispensed successfully',
        prescription,
        stockUpdates: stockUpdates.map(u => ({
            medicine: u.medicine.name,
            quantityDispensed: u.quantityNeeded,
            remainingStock: u.medicine.stock
        }))
    });
});

// Get all pharmacies (for doctor to select)
exports.getAllPharmacies = catchAsyncError(async (req, res, next) => {
    const Pharmacy = require('../models/pharmacyModel');
    
    // Show all active pharmacies (auto-verified on registration)
    const pharmacies = await Pharmacy.find({ 
        status: 'active'
    }).select('name address contactInfo rating verificationStatus')
      .sort({ createdAt: -1 }); // Newest first

    console.log(`📋 Found ${pharmacies.length} active pharmacies for doctor selection`);

    res.status(200).json({
        success: true,
        count: pharmacies.length,
        pharmacies
    });
});

// Generate PDF for prescription
exports.generatePrescriptionPDF = catchAsyncError(async (req, res, next) => {
    const prescription = await Prescription.findById(req.params.id)
        .populate('patient', 'name contact')
        .populate('doctor', 'name speciality')
        .populate('appointment', 'day time');

    if (!prescription) {
        return next(new ErrorHander("Prescription not found", 404));
    }

    // Check if user is authorized to view this prescription
    if (req.user.role !== 'doctor' && 
        prescription.patient._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHander("Not authorized to view this prescription", 403));
    }

    console.log('📄 Generating PDF for prescription:', prescription.prescriptionNumber);

    // Set headers before generating PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription.prescriptionNumber}.pdf"`);

    // Generate and stream PDF directly to response
    generatePrescriptionPDF(prescription, res);
});

// Helper function to generate PDF content and stream to response
async function generatePrescriptionPDF(prescription, res) {
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    
    const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        bufferPages: true
    });
    
    // Pipe the PDF directly to the response
    doc.pipe(res);
    
    // Generate QR Code
    const prescriptionData = {
        id: prescription._id.toString(),
        number: prescription.prescriptionNumber,
        patient: prescription.patient.name,
        doctor: prescription.doctor.name,
        date: new Date(prescription.createdAt).toLocaleDateString(),
        diagnosis: prescription.diagnosis,
        medications: prescription.medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration
        }))
    };
    
    let qrCodeDataUrl;
    try {
        qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(prescriptionData), {
            width: 150,
            margin: 1,
            color: {
                dark: '#2563eb',
                light: '#ffffff'
            }
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
    
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);
    
    // ============ HEADER SECTION ============
    // Blue header bar
    doc.rect(0, 0, pageWidth, 80)
       .fill('#2563eb');
    
    // Title
    doc.fontSize(28)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('MEDICAL PRESCRIPTION', margin, 25, { 
           width: contentWidth - 120,
           align: 'left' 
       });
    
    // Add QR Code in header if generated successfully
    if (qrCodeDataUrl) {
        const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrImageBuffer, pageWidth - margin - 90, 15, { 
            width: 80, 
            height: 80 
        });
    }
    
    // Prescription number below title
    doc.fontSize(11)
       .fillColor('#e0e7ff')
       .font('Helvetica')
       .text(`Prescription #: ${prescription.prescriptionNumber}`, margin, 55, {
           width: contentWidth - 120
       });
    
    // Reset position after header
    doc.y = 100;
    
    // ============ DOCTOR & PATIENT INFO SECTION ============
    const boxY = doc.y;
    const boxHeight = 85;
    const boxWidth = (contentWidth - 20) / 2;
    
    // Doctor Info Box (Left)
    doc.roundedRect(margin, boxY, boxWidth, boxHeight, 5)
       .fillAndStroke('#eff6ff', '#2563eb');
    
    doc.fontSize(12)
       .fillColor('#1e40af')
       .font('Helvetica-Bold')
       .text('DOCTOR INFORMATION', margin + 15, boxY + 15, { width: boxWidth - 30 });
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(`Dr. ${prescription.doctor.name}`, margin + 15, boxY + 35, { width: boxWidth - 30 });
    
    doc.fontSize(9)
       .fillColor('#4b5563')
       .text(`Speciality: ${prescription.doctor.speciality || 'General Medicine'}`, margin + 15, boxY + 50, { width: boxWidth - 30 });
    
    doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`, margin + 15, boxY + 65, { width: boxWidth - 30 });
    
    // Patient Info Box (Right)
    const patientBoxX = margin + boxWidth + 20;
    doc.roundedRect(patientBoxX, boxY, boxWidth, boxHeight, 5)
       .fillAndStroke('#fef3c7', '#f59e0b');
    
    doc.fontSize(12)
       .fillColor('#92400e')
       .font('Helvetica-Bold')
       .text('PATIENT INFORMATION', patientBoxX + 15, boxY + 15, { width: boxWidth - 30 });
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(prescription.patient.name, patientBoxX + 15, boxY + 35, { width: boxWidth - 30 });
    
    doc.fontSize(9)
       .fillColor('#4b5563')
       .text(`Contact: ${prescription.patient.contact}`, patientBoxX + 15, boxY + 50, { width: boxWidth - 30 });
    
    doc.y = boxY + boxHeight + 20;
    
    // ============ DIAGNOSIS SECTION ============
    if (prescription.diagnosis) {
        const diagnosisY = doc.y;
        
        // Section header with background
        doc.rect(margin, diagnosisY, contentWidth, 25)
           .fill('#fef2f2');
        
        doc.fontSize(11)
           .fillColor('#991b1b')
           .font('Helvetica-Bold')
           .text('DIAGNOSIS', margin + 10, diagnosisY + 8);
        
        doc.y = diagnosisY + 30;
        
        // Diagnosis content
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica')
           .text(prescription.diagnosis, margin + 10, doc.y, { 
               width: contentWidth - 20,
               align: 'left',
               lineGap: 3
           });
        
        doc.moveDown(1.5);
    }
    
    // ============ SYMPTOMS SECTION ============
    if (prescription.symptoms) {
        const symptomsY = doc.y;
        
        // Section header with background
        doc.rect(margin, symptomsY, contentWidth, 25)
           .fill('#fef9c3');
        
        doc.fontSize(11)
           .fillColor('#854d0e')
           .font('Helvetica-Bold')
           .text('SYMPTOMS', margin + 10, symptomsY + 8);
        
        doc.y = symptomsY + 30;
        
        // Symptoms content
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica')
           .text(prescription.symptoms, margin + 10, doc.y, { 
               width: contentWidth - 20,
               align: 'left',
               lineGap: 3
           });
        
        doc.moveDown(1.5);
    }
    
    // ============ MEDICATIONS SECTION ============
    const medicationsY = doc.y;
    
    // Section header with prominent background
    doc.rect(margin, medicationsY, contentWidth, 30)
       .fill('#dbeafe');
    
    doc.fontSize(13)
       .fillColor('#1e40af')
       .font('Helvetica-Bold')
       .text('℞ PRESCRIBED MEDICATIONS', margin + 10, medicationsY + 10);
    
    doc.y = medicationsY + 40;
    
    // Medications list
    prescription.medications.forEach((med, index) => {
        const medStartY = doc.y;
        
        // Check if we need a new page
        if (medStartY > pageHeight - 150) {
            doc.addPage();
            doc.y = margin;
        }
        
        // Medication box
        const medBoxHeight = 90 + (med.instructions ? 20 : 0);
        doc.roundedRect(margin, doc.y, contentWidth, medBoxHeight, 5)
           .fillAndStroke('#f0f9ff', '#3b82f6');
        
        const medContentX = margin + 15;
        const medContentY = doc.y + 12;
        
        // Medication number badge
        doc.circle(medContentX + 12, medContentY + 12, 12)
           .fill('#2563eb');
        
        doc.fontSize(11)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text(`${index + 1}`, medContentX + 8, medContentY + 7);
        
        // Medication name
        doc.fontSize(12)
           .fillColor('#1e40af')
           .font('Helvetica-Bold')
           .text(med.name, medContentX + 35, medContentY + 5, { 
               width: contentWidth - 60 
           });
        
        // Medication details in a grid
        const detailsY = medContentY + 30;
        const col1X = medContentX;
        const col2X = medContentX + (contentWidth - 30) / 2;
        
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica');
        
        // Dosage
        doc.text('Dosage:', col1X, detailsY);
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(med.dosage, col1X + 60, detailsY);
        
        // Frequency
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Frequency:', col2X, detailsY);
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(med.frequency, col2X + 60, detailsY);
        
        // Duration (if exists)
        if (med.duration) {
            doc.fontSize(9)
               .fillColor('#6b7280')
               .font('Helvetica')
               .text('Duration:', col1X, detailsY + 20);
            doc.fontSize(10)
               .fillColor('#1f2937')
               .font('Helvetica-Bold')
               .text(med.duration, col1X + 60, detailsY + 20);
        }
        
        // Instructions (if exists)
        if (med.instructions) {
            doc.fontSize(9)
               .fillColor('#6b7280')
               .font('Helvetica')
               .text('Instructions:', medContentX, detailsY + 45);
            doc.fontSize(9)
               .fillColor('#1f2937')
               .font('Helvetica')
               .text(med.instructions, medContentX, detailsY + 58, { 
                   width: contentWidth - 40,
                   lineGap: 2
               });
        }
        
        doc.y = medStartY + medBoxHeight + 12;
    });
    
    doc.moveDown(1);
    
    // ============ NOTES SECTION ============
    if (prescription.notes) {
        const notesY = doc.y;
        
        // Check if we need a new page
        if (notesY > pageHeight - 150) {
            doc.addPage();
            doc.y = margin;
        }
        
        // Section header
        doc.rect(margin, doc.y, contentWidth, 25)
           .fill('#f3f4f6');
        
        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica-Bold')
           .text('ADDITIONAL NOTES', margin + 10, doc.y + 8);
        
        doc.y += 30;
        
        // Notes content
        doc.fontSize(9)
           .fillColor('#1f2937')
           .font('Helvetica')
           .text(prescription.notes, margin + 10, doc.y, { 
               width: contentWidth - 20,
               align: 'left',
               lineGap: 3
           });
        
        doc.moveDown(1.5);
    }
    
    // ============ FOLLOW-UP INSTRUCTIONS ============
    if (prescription.followUpInstructions) {
        const followUpY = doc.y;
        
        // Check if we need a new page
        if (followUpY > pageHeight - 150) {
            doc.addPage();
            doc.y = margin;
        }
        
        // Section header
        doc.rect(margin, doc.y, contentWidth, 25)
           .fill('#d1fae5');
        
        doc.fontSize(11)
           .fillColor('#065f46')
           .font('Helvetica-Bold')
           .text('FOLLOW-UP INSTRUCTIONS', margin + 10, doc.y + 8);
        
        doc.y += 30;
        
        // Follow-up content
        doc.fontSize(9)
           .fillColor('#1f2937')
           .font('Helvetica')
           .text(prescription.followUpInstructions, margin + 10, doc.y, { 
               width: contentWidth - 20,
               align: 'left',
               lineGap: 3
           });
        
        doc.moveDown(1.5);
    }
    
    // ============ FOOTER SECTION ============
    // Calculate footer position
    const footerY = pageHeight - 80;
    
    // If current position is too close to footer, add new page
    if (doc.y > footerY - 20) {
        doc.addPage();
    }
    
    // Move to footer position
    doc.y = footerY;
    
    // Footer separator line
    doc.moveTo(margin, footerY)
       .lineTo(pageWidth - margin, footerY)
       .strokeColor('#d1d5db')
       .lineWidth(1)
       .stroke();
    
    // Footer content
    doc.fontSize(8)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text('This prescription is digitally generated and valid for 30 days from the date of issue.', 
           margin, footerY + 15, { 
               width: contentWidth,
               align: 'center',
               lineGap: 2
           });
    
    doc.fontSize(8)
       .text('For any queries, please contact the prescribing doctor.', 
           margin, footerY + 30, { 
               width: contentWidth,
               align: 'center'
           });
    
    doc.fontSize(7)
       .fillColor('#9ca3af')
       .text('Cureon Healthcare System - Digital Prescription Service', 
           margin, footerY + 50, { 
               width: contentWidth,
               align: 'center'
           });
    
    // Finalize the PDF
    doc.end();
    
    console.log('✅ PDF generated and streamed successfully');
}