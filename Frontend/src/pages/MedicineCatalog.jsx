import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../axios';
import SearchBar from '../components/SearchBar';

const MedicineCatalog = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || 'all',
        sortBy: searchParams.get('sortBy') || 'name',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        prescriptionRequired: searchParams.get('prescriptionRequired') || '',
        city: searchParams.get('city') || ''
    });

    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    useEffect(() => {
        fetchCategories();
        fetchMedicines();
        loadCart();
    }, []);

    useEffect(() => {
        fetchMedicines();
    }, [filters, pagination.page]);

    const loadCart = () => {
        const savedCart = localStorage.getItem('medicineCart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    };

    const saveCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem('medicineCart', JSON.stringify(newCart));
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/medicines/categories');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    params.append(key, value);
                }
            });
            
            params.append('page', pagination.page);
            params.append('limit', 20);

            const response = await axios.get(`/medicines?${params}`);
            setMedicines(response.data.medicines);
            setPagination({
                ...pagination,
                totalPages: response.data.pagination.pages,
                total: response.data.pagination.total
            });
        } catch (error) {
            toast.error('Failed to fetch medicines');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        
        // Update URL params
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([k, v]) => {
            if (v && v !== 'all') {
                params.set(k, v);
            }
        });
        setSearchParams(params);
        
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const addToCart = (medicine, quantity = 1) => {
        const existingItem = cart.find(item => item.medicine._id === medicine._id);
        
        if (existingItem) {
            if (existingItem.quantity + quantity > medicine.stock) {
                toast.error('Insufficient stock');
                return;
            }
            const newCart = cart.map(item =>
                item.medicine._id === medicine._id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            );
            saveCart(newCart);
        } else {
            if (quantity > medicine.stock) {
                toast.error('Insufficient stock');
                return;
            }
            const newCart = [...cart, { medicine, quantity }];
            saveCart(newCart);
        }
        toast.success('Added to cart');
    };

    const getCartItemCount = (medicineId) => {
        const item = cart.find(item => item.medicine._id === medicineId);
        return item ? item.quantity : 0;
    };

    const MedicineCard = ({ medicine }) => {
        const discountPercentage = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100);
        const cartQuantity = getCartItemCount(medicine._id);

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 relative">
                {/* Favorite Icon */}
                <button className="absolute top-2 right-2 z-10 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Medicine Image */}
                <div className="relative p-4">
                    <img
                        src={medicine.images?.[0]?.url || '/medicine-placeholder.jpg'}
                        alt={medicine.name}
                        className="w-full h-32 object-contain"
                    />
                </div>
                
                {/* Medicine Details */}
                <div className="px-4 pb-4">
                    {/* Pharmacy Name - At Top */}
                    <p className="text-xs text-gray-500 mb-1">{medicine.pharmacy?.name || 'Pharmacy'}</p>
                    
                    {/* Medicine Name */}
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{medicine.name}</h3>
                    
                    {/* Generic Name */}
                    {medicine.genericName && (
                        <p className="text-xs text-gray-600 mb-1">{medicine.genericName}</p>
                    )}
                    
                    {/* Manufacturer */}
                    <p className="text-xs text-gray-500 mb-2">{medicine.manufacturer}</p>
                    
                    {/* Strength & Pack Size */}
                    <p className="text-xs text-gray-600 mb-2">{medicine.strength} | {medicine.packSize}</p>
                    
                    {/* Price and Rating Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                            <span className="text-lg font-bold text-gray-900">₹{medicine.price}</span>
                            {medicine.mrp > medicine.price && (
                                <span className="text-xs text-gray-500 line-through">₹{medicine.mrp}</span>
                            )}
                        </div>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                            <span className="text-xs text-gray-600 ml-1">({medicine.rating || 3.5})</span>
                        </div>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button
                        onClick={() => medicine.stock > 0 ? addToCart(medicine) : null}
                        disabled={medicine.stock === 0}
                        className={`w-full py-2 rounded-full font-semibold text-sm transition-all active:scale-95 flex items-center justify-center ${
                            medicine.stock > 0
                                ? 'bg-blue-900 text-white hover:bg-blue-800'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {medicine.stock > 0 ? (
                            <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {cartQuantity > 0 ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                            </>
                        ) : (
                            'Out of Stock'
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // Category icons mapping
    const categoryIcons = {
        'Prescription': '💊',
        'Supplements': '🧴',
        'Injections': '💉',
        'OTC Meds': '📋',
        'Heart Health': '❤️',
        'Diabetes': '🩺',
        'Pain Relief': '🔴',
        'Vitamins': '🌟'
    };

    const categoryList = [
        { id: 'all', name: 'All', icon: '🏥' },
        { id: 'Prescription', name: 'Prescription', icon: '💊' },
        { id: 'Supplements', name: 'Supplements', icon: '🧴' },
        { id: 'Injections', name: 'Injections', icon: '💉' },
        { id: 'OTC Meds', name: 'OTC Meds', icon: '📋' },
        { id: 'Heart Health', name: 'Heart Health', icon: '❤️' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Search Bar - Mobile First */}
                <div className="mb-4 flex items-center space-x-2">
                    <SearchBar 
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Search medicines..."
                        className="flex-1"
                    />
                    <button
                        onClick={() => navigate('/cart')}
                        className="relative bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                        )}
                    </button>
                </div>

                {/* Categories - Horizontal Scroll */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-gray-900">Categories</h2>
                        <button className="text-blue-600 font-semibold text-xs">See All</button>
                    </div>
                    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                        {categoryList.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleFilterChange('category', category.id)}
                                className={`flex flex-col items-center min-w-[70px] transition-all active:scale-95 ${
                                    filters.category === category.id ? 'opacity-100' : 'opacity-70'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-1.5 ${
                                    filters.category === category.id ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                                }`}>
                                    <span className="text-2xl">{category.icon}</span>
                                </div>
                                <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
                                    {category.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Option */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Popular Medicines</h2>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="name">Name A-Z</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                        <option value="newest">Newest First</option>
                        <option value="popular">Most Popular</option>
                    </select>
                </div>

                {/* Medicine Grid - 2 columns on mobile, 4 cards visible */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                                <div className="h-32 bg-gray-300 rounded-t-2xl"></div>
                                <div className="p-4">
                                    <div className="h-3 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded mb-4"></div>
                                    <div className="h-8 bg-gray-300 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : medicines.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {medicines.map(medicine => (
                            <MedicineCard key={medicine._id} medicine={medicine} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-gray-500 text-lg mb-4">No medicines found</div>
                        <button
                            onClick={() => setFilters({
                                search: '',
                                category: 'all',
                                sortBy: 'name',
                                minPrice: '',
                                maxPrice: '',
                                prescriptionRequired: '',
                                city: ''
                            })}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Previous
                            </button>
                            {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                                const pageNum = pagination.page - 2 + index;
                                if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                        className={`px-3 py-2 rounded-lg text-sm ${
                                            pageNum === pagination.page
                                                ? 'bg-blue-900 text-white'
                                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default MedicineCatalog;
