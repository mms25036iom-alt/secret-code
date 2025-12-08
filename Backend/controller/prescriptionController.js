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
        followUpInstructions 
    } = req.body;

    console.log('📝 Creating prescription with data:', { 
        patientId, 
        appointmentId, 
        medications: medications?.length, 
        diagnosis,
        diagnosisAudio: diagnosisAudio ? 'Yes' : 'No',
        medicationsWithAudio: medications?.filter(m => m.instructionsAudio).length || 0
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
        prescriptionNumber
    };

    // Only add appointmentId if it's provided
    if (appointmentId) {
        prescriptionData.appointment = appointmentId;
    }

    const prescription = await Prescription.create(prescriptionData);

    // Populate the prescription with patient and doctor details
    await prescription.populate('patient', 'name contact');
    await prescription.populate('doctor', 'name speciality');
    if (appointmentId) {
        await prescription.populate('appointment', 'day time');
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
            .populate('doctor', 'name speciality') // Also populate doctor for consistency
            .populate('appointment', 'day time')
            .sort({ createdAt: -1 });
    } else {
        prescriptions = await Prescription.find({ patient: req.user._id })
            .populate('doctor', 'name speciality')
            .populate('patient', 'name contact') // Also populate patient for consistency
            .populate('appointment', 'day time')
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

    // Check if user is authorized to view this prescription
    if (req.user.role !== 'doctor' && 
        prescription.patient._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHander("Not authorized to view this prescription", 403));
    }

    res.status(200).json({
        success: true,
        prescription
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
function generatePrescriptionPDF(prescription, res) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
    });
    
    // Pipe the PDF directly to the response
    doc.pipe(res);
    
    // Header with styling
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('MEDICAL PRESCRIPTION', { align: 'center' });
    
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(`Prescription #: ${prescription.prescriptionNumber}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Reset color for body text
    doc.fillColor('#000000');
    
    // Doctor Information Box
    doc.fontSize(14)
       .fillColor('#1e40af')
       .text('DOCTOR INFORMATION', { underline: true });
    
    doc.fontSize(11)
       .fillColor('#000000')
       .text(`Name: Dr. ${prescription.doctor.name}`, { continued: false });
    
    doc.text(`Speciality: ${prescription.doctor.speciality || 'General Medicine'}`);
    doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`);
    
    doc.moveDown(1.5);
    
    // Patient Information Box
    doc.fontSize(14)
       .fillColor('#1e40af')
       .text('PATIENT INFORMATION', { underline: true });
    
    doc.fontSize(11)
       .fillColor('#000000')
       .text(`Name: ${prescription.patient.name}`);
    
    doc.text(`Contact: ${prescription.patient.contact}`);
    
    doc.moveDown(1.5);
    
    // Diagnosis
    if (prescription.diagnosis) {
        doc.fontSize(14)
           .fillColor('#1e40af')
           .text('DIAGNOSIS', { underline: true });
        
        doc.fontSize(11)
           .fillColor('#000000')
           .text(prescription.diagnosis, { align: 'left' });
        
        doc.moveDown(1.5);
    }
    
    // Symptoms
    if (prescription.symptoms) {
        doc.fontSize(14)
           .fillColor('#1e40af')
           .text('SYMPTOMS', { underline: true });
        
        doc.fontSize(11)
           .fillColor('#000000')
           .text(prescription.symptoms, { align: 'left' });
        
        doc.moveDown(1.5);
    }
    
    // Medications - Most Important Section
    doc.fontSize(14)
       .fillColor('#1e40af')
       .text('PRESCRIBED MEDICATIONS', { underline: true });
    
    doc.moveDown(0.5);
    
    prescription.medications.forEach((med, index) => {
        // Medication number and name
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`${index + 1}. ${med.name}`, { bold: true });
        
        // Medication details with indentation
        doc.fontSize(10)
           .fillColor('#374151');
        
        doc.text(`    Dosage: ${med.dosage}`, { indent: 20 });
        doc.text(`    Frequency: ${med.frequency}`, { indent: 20 });
        
        if (med.duration) {
            doc.text(`    Duration: ${med.duration}`, { indent: 20 });
        }
        
        if (med.instructions) {
            doc.text(`    Instructions: ${med.instructions}`, { indent: 20 });
        }
        
        doc.moveDown(0.8);
    });
    
    doc.moveDown(1);
    
    // Notes
    if (prescription.notes) {
        doc.fontSize(14)
           .fillColor('#1e40af')
           .text('ADDITIONAL NOTES', { underline: true });
        
        doc.fontSize(11)
           .fillColor('#000000')
           .text(prescription.notes, { align: 'left' });
        
        doc.moveDown(1.5);
    }
    
    // Follow-up Instructions
    if (prescription.followUpInstructions) {
        doc.fontSize(14)
           .fillColor('#1e40af')
           .text('FOLLOW-UP INSTRUCTIONS', { underline: true });
        
        doc.fontSize(11)
           .fillColor('#000000')
           .text(prescription.followUpInstructions, { align: 'left' });
        
        doc.moveDown(1.5);
    }
    
    // Add some space before footer
    doc.moveDown(2);
    
    // Footer with border
    const bottomY = doc.page.height - 100;
    doc.moveTo(50, bottomY)
       .lineTo(doc.page.width - 50, bottomY)
       .stroke();
    
    doc.y = bottomY + 10;
    
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text('This prescription is digitally generated and valid for 30 days from the date of issue.', { 
           align: 'center' 
       });
    
    doc.text('For any queries, please contact the prescribing doctor.', { 
        align: 'center' 
    });
    
    doc.moveDown(0.5);
    
    doc.fontSize(8)
       .text('Cureon Healthcare System', { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
    console.log('✅ PDF generated and streamed successfully');
}