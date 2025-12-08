const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dcmdkvmwe',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'teleconnect/doctors',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
        ]
    }
});

// Configure multer
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Configure storage for medical documents (supports various file types)
const documentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'teleconnect/medical-documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        resource_type: 'auto' // Allows non-image files
    }
});

// Configure multer for documents
const documentUpload = multer({ 
    storage: documentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for documents
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images, PDF, DOC, and DOCX files are allowed!'), false);
        }
    }
});

// Upload single image
const uploadSingle = upload.single('avatar');

// Upload single document
const uploadDocument = documentUpload.single('document');

// Upload multiple images
const uploadMultiple = upload.array('images', 5);

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
};

// Get image URL with transformations
const getImageUrl = (publicId, transformations = {}) => {
    return cloudinary.url(publicId, {
        ...transformations,
        secure: true
    });
};

module.exports = {
    cloudinary,
    uploadSingle,
    uploadDocument,
    uploadMultiple,
    deleteImage,
    getImageUrl
};
