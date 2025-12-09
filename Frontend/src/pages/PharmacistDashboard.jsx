import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../axios';
import PharmacyPrescriptions from '../components/PharmacyPrescriptions';

const PharmacistDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [pharmacy, setPharmacy] = useState(null);
    const [stats, setStats] = useState(null);
    const [medicines, setMedicines] = useState([]);
    const [lowStockMedicines, setLowStockMedicines] = useState([]);
    const [expiringMedicines, setExpiringMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [stockFilter, setStockFilter] = useState('');
    
    // New medicine form data
    const [newMedicine, setNewMedicine] = useState({
        name: '',
        genericName: '',
        category: '',
        manufacturer: '',
        composition: '',
        strength: '',
        formType: '',
        packSize: '',
        price: '',
        mrp: '',
        discount: 0,
        stock: '',
        minStock: 10,
        expiryDate: '',
        batchNumber: '',
        description: '',
        uses: '',
        sideEffects: '',
        precautions: '',
        dosage: '',
        prescriptionRequired: false
    });

    const categories = [
        'Pain Relief', 'Antibiotics', 'Vitamins & Supplements', 'Cold & Flu',
        'Digestive Health', 'Heart & Blood Pressure', 'Diabetes', 'Skin Care',
        'Eye Care', 'Women Health', 'Men Health', 'Child Care', 'First Aid',
        'Prescription', 'Other'
    ];

    const formTypes = [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 
        'Cream', 'Ointment', 'Gel', 'Powder', 'Other'
    ];

    useEffect(() => {
        loadPharmacyData();
    }, []);

    const loadPharmacyData = async () => {
        try {
            setLoading(true);
            const [pharmacyRes, statsRes, medicinesRes] = await Promise.all([
                axios.get('/pharmacy/my'),
                axios.get('/pharmacy/stats'),
                axios.get('/pharmacy/medicines/search')
            ]);

            setPharmacy(pharmacyRes.data.pharmacy);
            setStats(statsRes.data.stats);
            setMedicines(medicinesRes.data.medicines);

            // Orders can be empty or unavailable; don't fail whole dashboard
            try {
                const ordersRes = await axios.get('/pharmacy/orders');
                setOrders(ordersRes.data.orders || []);
            } catch (ordersErr) {
                const code = ordersErr?.response?.status;
                if (code === 404 || code === 400) {
                    setOrders([]);
                } else {
                    // Bubble up unexpected errors
                    throw ordersErr;
                }
            }

            // Load low stock and expiring medicines
            loadAlerts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadAlerts = async () => {
        try {
            const [lowStockRes, expiringRes] = await Promise.all([
                axios.get('/pharmacy/medicines/low-stock'),
                axios.get('/pharmacy/medicines/expiring?days=30')
            ]);
            
            setLowStockMedicines(lowStockRes.data.medicines);
            setExpiringMedicines(expiringRes.data.medicines);
        } catch (error) {
            console.error('Failed to load alerts:', error);
        }
    };

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/pharmacy/medicines', newMedicine);
            toast.success('Medicine added successfully');
            setShowAddMedicineModal(false);
            setNewMedicine({
                name: '', genericName: '', category: '', manufacturer: '',
                composition: '', strength: '', formType: '', packSize: '',
                price: '', mrp: '', discount: 0, stock: '', minStock: 10,
                expiryDate: '', batchNumber: '', description: '', uses: '',
                sideEffects: '', precautions: '', dosage: '', prescriptionRequired: false
            });
            loadPharmacyData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add medicine');
        }
    };

    const handleUpdateStock = async (medicineId, newStock) => {
        try {
            await axios.put('/pharmacy/medicines/bulk-stock-update', {
                stockUpdates: [{ medicineId, newStock }]
            });
            toast.success('Stock updated successfully');
            loadPharmacyData();
    } catch {
            toast.error('Failed to update stock');
        }
    };

    const handleDeleteMedicine = async (medicineId) => {
        if (window.confirm('Are you sure you want to delete this medicine?')) {
            try {
                await axios.delete(`/pharmacy/medicine/${medicineId}`);
                toast.success('Medicine deleted successfully');
                loadPharmacyData();
            } catch {
                toast.error('Failed to delete medicine');
            }
        }
    };

    const handleSearch = async () => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('keyword', searchTerm);
            if (filterCategory) params.append('category', filterCategory);
            if (stockFilter) params.append('stockStatus', stockFilter);

            const response = await axios.get(`/pharmacy/medicines/search?${params}`);
            setMedicines(response.data.medicines);
    } catch {
            toast.error('Search failed');
        }
    };

    const handleCsvFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Mobile devices might not set correct MIME type, so check extension only
            if (!file.name.toLowerCase().endsWith('.csv')) {
                toast.error('Please upload a valid CSV file (.csv extension required)');
                return;
            }
            
            console.log('📄 CSV File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
            setCsvFile(file);
            parseCsvFile(file);
        }
    };

    const parseCsvFile = (file) => {
        console.log('📖 Starting to parse CSV file...');
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                console.log('✅ File loaded successfully');
                const text = e.target.result;
                console.log('📝 File content length:', text.length);
                
                // Handle different line endings (Windows: \r\n, Unix: \n, Mac: \r)
                const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
                console.log('📊 Total lines:', lines.length);
                
                if (lines.length < 2) {
                    toast.error('CSV file is empty or invalid. Need at least header and one data row.');
                    return;
                }

                // Parse CSV properly handling quoted values
                const parseCsvLine = (line) => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            result.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim());
                    return result;
                };

                const headers = parseCsvLine(lines[0]);
                console.log('📋 Headers:', headers);
                
                const data = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = parseCsvLine(lines[i]);
                    const row = {};
                    
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    
                    // Only add rows that have at least a name
                    if (row.name || row.Name) {
                        data.push(row);
                    }
                }

                console.log('✅ Parsed data:', data.length, 'medicines');
                console.log('📦 Sample row:', data[0]);
                
                setCsvData(data);
                toast.success(`✅ Parsed ${data.length} medicines from CSV`);
            } catch (error) {
                console.error('❌ Error parsing CSV:', error);
                toast.error(`Failed to parse CSV: ${error.message}`);
            }
        };
        
        reader.onerror = (error) => {
            console.error('❌ FileReader error:', error);
            toast.error('Failed to read CSV file. Please try again.');
        };
        
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                console.log(`📥 Loading: ${percentLoaded}%`);
            }
        };
        
        console.log('📂 Reading file as text...');
        reader.readAsText(file);
    };

    const handleBulkUpload = async () => {
        if (!csvData || csvData.length === 0) {
            toast.error('No data to upload. Please select a CSV file first.');
            return;
        }

        try {
            setUploadProgress(10);
            
            // Transform CSV data to match backend schema
            const medicines = csvData.map(row => ({
                name: row.name || row.Name,
                genericName: row.genericName || row.GenericName || '',
                category: row.category || row.Category,
                manufacturer: row.manufacturer || row.Manufacturer,
                composition: row.composition || row.Composition,
                strength: row.strength || row.Strength,
                formType: row.formType || row.FormType,
                packSize: row.packSize || row.PackSize,
                price: parseFloat(row.price || row.Price),
                mrp: parseFloat(row.mrp || row.MRP),
                discount: parseFloat(row.discount || row.Discount || 0),
                stock: parseInt(row.stock || row.Stock),
                minStock: parseInt(row.minStock || row.MinStock || 10),
                expiryDate: row.expiryDate || row.ExpiryDate,
                batchNumber: row.batchNumber || row.BatchNumber,
                description: row.description || row.Description || '',
                uses: row.uses || row.Uses || '',
                sideEffects: row.sideEffects || row.SideEffects || '',
                precautions: row.precautions || row.Precautions || '',
                dosage: row.dosage || row.Dosage || '',
                prescriptionRequired: (row.prescriptionRequired || row.PrescriptionRequired || 'false').toLowerCase() === 'true'
            }));

            setUploadProgress(30);

            const response = await axios.post('/pharmacy/medicines/bulk-upload', { medicines });

            setUploadProgress(100);
            toast.success(response.data.message || 'Medicines uploaded successfully');
            
            setShowBulkUploadModal(false);
            setCsvFile(null);
            setCsvData([]);
            setUploadProgress(0);
            
            loadPharmacyData();
        } catch (error) {
            setUploadProgress(0);
            toast.error(error.response?.data?.message || 'Failed to upload medicines');
        }
    };

    const downloadSampleCsv = async () => {
        try {
            console.log('📥 Starting CSV download...');
            
            const sampleData = `name,genericName,category,manufacturer,composition,strength,formType,packSize,price,mrp,discount,stock,minStock,expiryDate,batchNumber,description,uses,sideEffects,precautions,dosage,prescriptionRequired
Paracetamol 500mg,Paracetamol,Pain Relief,ABC Pharma,Paracetamol 500mg,500mg,Tablet,Strip of 10 tablets,50,60,10,100,10,2025-12-31,BATCH001,Pain reliever and fever reducer,For headache and fever,Nausea and allergic reactions,Consult doctor if pregnant,1-2 tablets every 4-6 hours,false
Amoxicillin 250mg,Amoxicillin,Antibiotics,XYZ Labs,Amoxicillin 250mg,250mg,Capsule,Strip of 10 capsules,120,150,20,50,10,2026-06-30,BATCH002,Antibiotic for bacterial infections,Treats various bacterial infections,Diarrhea and rash,Complete full course,1 capsule 3 times daily,true
Cetirizine 10mg,Cetirizine,Cold & Flu,DEF Pharma,Cetirizine 10mg,10mg,Tablet,Strip of 10 tablets,30,40,25,200,20,2026-03-15,BATCH003,Antihistamine for allergies,For allergic rhinitis and urticaria,Drowsiness and dry mouth,Avoid alcohol,1 tablet once daily,false
Ibuprofen 400mg,Ibuprofen,Pain Relief,GHI Pharma,Ibuprofen 400mg,400mg,Tablet,Strip of 10 tablets,80,100,20,150,15,2025-09-20,BATCH004,Anti-inflammatory pain reliever,For pain and inflammation,Stomach upset and nausea,Take with food,1 tablet every 6-8 hours,false`;

            console.log('📄 Sample data length:', sampleData.length);
            
            // Check if we're on mobile (Capacitor)
            const isMobile = window.Capacitor?.isNativePlatform();
            console.log('📱 Is mobile:', isMobile);
            
            if (isMobile) {
                // Use Capacitor Filesystem for mobile
                console.log('📱 Using Capacitor Filesystem for mobile download');
                
                try {
                    const { Filesystem, Directory } = await import('@capacitor/filesystem');
                    
                    // Write file to Downloads directory
                    const result = await Filesystem.writeFile({
                        path: 'medicine_upload_sample.csv',
                        data: sampleData,
                        directory: Directory.Documents, // Use Documents as Downloads might not be accessible
                        encoding: 'utf8'
                    });
                    
                    console.log('✅ File written to:', result.uri);
                    
                    // Show success message with file location
                    toast.success('✅ CSV saved to Documents folder!');
                    
                    // Try to share the file so user can save it
                    try {
                        const { Share } = await import('@capacitor/share');
                        await Share.share({
                            title: 'Medicine Upload Sample CSV',
                            text: 'Sample CSV file for bulk medicine upload',
                            url: result.uri,
                            dialogTitle: 'Save CSV File'
                        });
                    } catch (shareError) {
                        console.log('Share not available:', shareError);
                        alert(`✅ File saved successfully!\n\nLocation: Documents/medicine_upload_sample.csv\n\nYou can find it in your file manager under Documents folder.`);
                    }
                    
                    return;
                } catch (fsError) {
                    console.error('❌ Filesystem error:', fsError);
                    console.log('Falling back to browser download...');
                }
            }
            
            // Browser download method (for web)
            console.log('🌐 Using browser download method');
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + sampleData], { type: 'text/csv;charset=utf-8;' });
            console.log('📦 Blob created, size:', blob.size);
            
            const url = window.URL.createObjectURL(blob);
            console.log('🔗 Blob URL created');
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'medicine_upload_sample.csv';
            a.setAttribute('download', 'medicine_upload_sample.csv');
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                console.log('🧹 Cleanup completed');
            }, 100);
            
            toast.success('✅ Sample CSV downloaded! Check your Downloads folder.');
            console.log('✅ Download completed successfully');
            
        } catch (error) {
            console.error('❌ Download error:', error);
            toast.error('Failed to download CSV. Showing sample data...');
            
            // Fallback: Show data in copyable format
            const sampleText = `name,genericName,category,manufacturer,composition,strength,formType,packSize,price,mrp,discount,stock,minStock,expiryDate,batchNumber,description,uses,sideEffects,precautions,dosage,prescriptionRequired
Paracetamol 500mg,Paracetamol,Pain Relief,ABC Pharma,Paracetamol 500mg,500mg,Tablet,Strip of 10 tablets,50,60,10,100,10,2025-12-31,BATCH001,Pain reliever,For headache,Nausea,Consult doctor,1-2 tablets,false
Amoxicillin 250mg,Amoxicillin,Antibiotics,XYZ Labs,Amoxicillin 250mg,250mg,Capsule,Strip of 10 capsules,120,150,20,50,10,2026-06-30,BATCH002,Antibiotic,For infections,Diarrhea,Complete course,1 capsule 3x daily,true`;
            
            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(sampleText).then(() => {
                    alert('✅ Sample CSV data copied to clipboard!\n\nYou can paste it into a text editor and save as .csv file.');
                }).catch(() => {
                    alert(`📋 Copy this sample data and save as .csv:\n\n${sampleText.substring(0, 200)}...`);
                });
            } else {
                alert(`📋 Copy this sample data and save as .csv:\n\n${sampleText.substring(0, 200)}...`);
            }
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN');
    };

    const getStockStatus = (medicine) => {
        if (medicine.stock === 0) return { text: 'Out of Stock', color: 'text-red-600' };
        if (medicine.stock <= medicine.minStock) return { text: 'Low Stock', color: 'text-yellow-600' };
        return { text: 'In Stock', color: 'text-green-600' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 break-words max-w-full">
                            {pharmacy?.name}
                        </h1>
                        <div className="flex flex-wrap gap-2 sm:space-x-3">
                            <button
                                onClick={() => setShowBulkUploadModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap"
                            >
                                Bulk Upload
                            </button>
                            <button
                                onClick={() => navigate('/pharmacist/create-medicine')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap"
                            >
                                Add Medicine
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'prescriptions', label: 'Prescriptions' },
                        { id: 'medicines', label: 'Medicines' },
                        { id: 'orders', label: 'Orders' },
                        { id: 'alerts', label: 'Alerts' },
                        { id: 'reports', label: 'Reports' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="text-sm font-medium text-gray-500">Total Medicines</div>
                                <div className="text-2xl font-bold text-blue-600">{stats?.medicines?.total || 0}</div>
                                <div className="text-sm text-green-600">
                                    {stats?.medicines?.active || 0} active
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="text-sm font-medium text-gray-500">Total Orders</div>
                                <div className="text-2xl font-bold text-green-600">{stats?.orders?.total || 0}</div>
                                <div className="text-sm text-orange-600">
                                    {stats?.orders?.pending || 0} pending
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="text-sm font-medium text-gray-500">Today&apos;s Orders</div>
                                <div className="text-2xl font-bold text-purple-600">{stats?.orders?.today || 0}</div>
                                <div className="text-sm text-gray-600">Last 24 hours</div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="text-sm font-medium text-gray-500">Low Stock Items</div>
                                <div className="text-2xl font-bold text-red-600">{stats?.medicines?.lowStock || 0}</div>
                                <div className="text-sm text-red-600">Need attention</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <button
                                    onClick={() => setActiveTab('prescriptions')}
                                    className="p-4 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 text-left"
                                >
                                    <div className="text-sm font-medium text-purple-900">Manage Prescriptions</div>
                                    <div className="text-xs text-purple-700">Dispense & scan QR codes</div>
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('medicines')}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                                >
                                    <div className="text-sm font-medium text-gray-900">Manage Inventory</div>
                                    <div className="text-xs text-gray-600">Add, edit, or remove medicines</div>
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                                >
                                    <div className="text-sm font-medium text-gray-900">Process Orders</div>
                                    <div className="text-xs text-gray-600">View and manage customer orders</div>
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('alerts')}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                                >
                                    <div className="text-sm font-medium text-gray-900">View Alerts</div>
                                    <div className="text-xs text-gray-600">Low stock and expiry warnings</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <PharmacyPrescriptions />
                    </div>
                )}

                {/* Medicines Tab */}
                {activeTab === 'medicines' && (
                    <div className="space-y-6">
                        {/* Search and Filter */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="Search medicines..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                
                                <select
                                    value={stockFilter}
                                    onChange={(e) => setStockFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Stock</option>
                                    <option value="inStock">In Stock</option>
                                    <option value="lowStock">Low Stock</option>
                                    <option value="outOfStock">Out of Stock</option>
                                </select>
                                
                                <button
                                    onClick={handleSearch}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Medicines List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Medicine Inventory ({medicines.length})
                                </h2>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Medicine
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Expiry
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {medicines.map(medicine => {
                                            const stockStatus = getStockStatus(medicine);
                                            return (
                                                <tr key={medicine._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {medicine.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {medicine.manufacturer} • {medicine.strength}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {medicine.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ₹{medicine.price}
                                                        {medicine.mrp > medicine.price && (
                                                            <div className="text-xs text-gray-500 line-through">
                                                                ₹{medicine.mrp}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="number"
                                                                value={medicine.stock}
                                                                onChange={(e) => handleUpdateStock(medicine._id, e.target.value)}
                                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                min="0"
                                                            />
                                                            <span className={`text-xs font-medium ${stockStatus.color}`}>
                                                                {stockStatus.text}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(medicine.expiryDate)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => setSelectedMedicine(medicine)}
                                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMedicine(medicine._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Orders ({orders.length})</h2>
                                <div className="text-sm text-gray-500">Most recent first</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                                                    No orders to display.
                                                </td>
                                            </tr>
                                        ) : (
                                            orders.map((order) => (
                                                <tr key={order._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {order.orderNumber || order._id.slice(-6)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {order.customer?.name || '—'}
                                                        <div className="text-xs text-gray-500">{order.customer?.phone || order.customer?.email || ''}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {order.items?.length || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ₹{order.pricing?.totalPrice ?? 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {order.orderStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {new Date(order.createdAt).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="space-y-6">
                        {/* Low Stock Medicines */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-red-600">
                                    Low Stock Medicines ({lowStockMedicines.length})
                                </h2>
                            </div>
                            <div className="p-6">
                                {lowStockMedicines.length === 0 ? (
                                    <p className="text-gray-600">No medicines are currently low on stock.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {lowStockMedicines.map(medicine => (
                                            <div key={medicine._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                                                <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                                                <p className="text-sm text-gray-600">{medicine.manufacturer}</p>
                                                <p className="text-sm text-red-600 font-medium">
                                                    Stock: {medicine.stock} (Min: {medicine.minStock})
                                                </p>
                                                <button
                                                    onClick={() => setSelectedMedicine(medicine)}
                                                    className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Update Stock →
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expiring Medicines */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-orange-600">
                                    Expiring Soon ({expiringMedicines.length})
                                </h2>
                                <p className="text-sm text-gray-600">Medicines expiring within 30 days</p>
                            </div>
                            <div className="p-6">
                                {expiringMedicines.length === 0 ? (
                                    <p className="text-gray-600">No medicines are expiring within the next 30 days.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {expiringMedicines.map(medicine => (
                                            <div key={medicine._id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                                                <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                                                <p className="text-sm text-gray-600">{medicine.manufacturer}</p>
                                                <p className="text-sm text-orange-600 font-medium">
                                                    Expires: {formatDate(medicine.expiryDate)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Stock: {medicine.stock}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Upload Modal */}
            {showBulkUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Medicines</h2>
                                <button
                                    onClick={() => {
                                        setShowBulkUploadModal(false);
                                        setCsvFile(null);
                                        setCsvData([]);
                                        setUploadProgress(0);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>Download the sample CSV file to see the required format</li>
                                    <li>Fill in your medicine data following the same column structure</li>
                                    <li>Required fields: name, category, manufacturer, composition, strength, formType, packSize, price, mrp, stock, expiryDate, batchNumber</li>
                                    <li>Date format: YYYY-MM-DD (e.g., 2025-12-31)</li>
                                    <li>Boolean fields (prescriptionRequired): use true or false</li>
                                </ul>
                            </div>

                            {/* Download Sample */}
                            <div className="space-y-2">
                                <button
                                    onClick={downloadSampleCsv}
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Download Sample CSV Template</span>
                                </button>
                                <p className="text-xs text-gray-500">
                                    💡 File will be saved to your Downloads folder
                                </p>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload CSV File
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv,text/csv,application/csv"
                                        onChange={handleCsvFileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        id="csv-file-input"
                                    />
                                </div>
                                {csvFile && (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-800 font-medium">
                                            ✅ Selected: {csvFile.name}
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">
                                            Size: {(csvFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Tip: On mobile, you can select CSV files from your file manager or downloads folder
                                </p>
                            </div>

                            {/* Preview Data */}
                            {csvData.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Preview ({csvData.length} medicines)
                                    </h3>
                                    <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-60">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {csvData.slice(0, 5).map((row, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{row.name || row.Name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{row.category || row.Category}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">₹{row.price || row.Price}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{row.stock || row.Stock}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {csvData.length > 5 && (
                                            <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                                                ... and {csvData.length - 5} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Upload Progress */}
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Uploading...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBulkUploadModal(false);
                                    setCsvFile(null);
                                    setCsvData([]);
                                    setUploadProgress(0);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkUpload}
                                disabled={!csvData || csvData.length === 0 || uploadProgress > 0}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium"
                            >
                                Upload {csvData.length > 0 ? `${csvData.length} Medicines` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Medicine Modal */}
            {showAddMedicineModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Add New Medicine</h2>
                                <button
                                    onClick={() => setShowAddMedicineModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddMedicine} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900">Basic Information</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Medicine Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={newMedicine.name}
                                            onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Generic Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newMedicine.genericName}
                                            onChange={(e) => setNewMedicine({...newMedicine, genericName: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category *
                                        </label>
                                        <select
                                            value={newMedicine.category}
                                            onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Manufacturer *
                                        </label>
                                        <input
                                            type="text"
                                            value={newMedicine.manufacturer}
                                            onChange={(e) => setNewMedicine({...newMedicine, manufacturer: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Composition *
                                        </label>
                                        <input
                                            type="text"
                                            value={newMedicine.composition}
                                            onChange={(e) => setNewMedicine({...newMedicine, composition: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Paracetamol 500mg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Strength *
                                        </label>
                                        <input
                                            type="text"
                                            value={newMedicine.strength}
                                            onChange={(e) => setNewMedicine({...newMedicine, strength: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., 500mg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Form Type *
                                        </label>
                                        <select
                                            value={newMedicine.formType}
                                            onChange={(e) => setNewMedicine({...newMedicine, formType: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Form Type</option>
                                            {formTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pack Size *
                                        </label>
                                        <input
                                            type="text"
                                            value={newMedicine.packSize}
                                            onChange={(e) => setNewMedicine({...newMedicine, packSize: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Strip of 10 tablets"
                                        />
                                    </div>
                                </div>

                                {/* Pricing and Stock */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900">Pricing & Stock</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                MRP *
                                            </label>
                                            <input
                                                type="number"
                                                value={newMedicine.mrp}
                                                onChange={(e) => setNewMedicine({...newMedicine, mrp: e.target.value})}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Selling Price *
                                            </label>
                                            <input
                                                type="number"
                                                value={newMedicine.price}
                                                onChange={(e) => setNewMedicine({...newMedicine, price: e.target.value})}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stock Quantity *
                                            </label>
                                            <input
                                                type="number"
                                                value={newMedicine.stock}
                                                onChange={(e) => setNewMedicine({...newMedicine, stock: e.target.value})}
                                                required
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Minimum Stock
                                            </label>
                                            <input
                                                type="number"
                                                value={newMedicine.minStock}
                                                onChange={(e) => setNewMedicine({...newMedicine, minStock: e.target.value})}
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Expiry Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={newMedicine.expiryDate}
                                            onChange={(e) => setNewMedicine({...newMedicine, expiryDate: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Batch Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={newMedicine.batchNumber}
                                            onChange={(e) => setNewMedicine({...newMedicine, batchNumber: e.target.value})}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., BATCH001"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddMedicineModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                                >
                                    Add Medicine
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacistDashboard;
