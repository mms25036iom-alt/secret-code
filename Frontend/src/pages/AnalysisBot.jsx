import { FileX2, Activity, Brain, Microscope, Eye, HeartPulse, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const handleAnalysis = (type) => {
    navigate(`/analysis/${type}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-24">
      <div className="max-w-7xl mx-auto px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
            Cureon Analysis
            <span className="block text-blue-600">Diagnostic Portal</span>
          </h1>
          <p className="mt-2 sm:mt-3 max-w-md mx-auto text-sm text-gray-500 sm:text-base md:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Advanced diagnostic tools powered by AI for precise medical analysis
          </p>
        </div>

        {/* Main Categories Grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8 mb-8 sm:mb-16">
          {/* General Disease Analysis Card */}
          <div 
            onClick={() => handleAnalysis('general')}
            className="relative group bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg sm:rounded-2xl" />
            <div className="px-3 py-4 sm:px-6 sm:py-8">
              <div className="flex items-center justify-between mb-3 sm:mb-6">
                <div className="p-1.5 sm:p-3 bg-blue-50 rounded-lg sm:rounded-2xl">
                  <Stethoscope size={20} className="text-blue-600 sm:w-7 sm:h-7" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                  General
                </span>
              </div>
              <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">General Disease Analysis</h3>
              <p className="text-xs sm:text-base text-gray-600 mb-3 sm:mb-6 line-clamp-2 sm:line-clamp-none">
                Comprehensive analysis for common medical conditions and symptoms
              </p>
              <div className="flex items-center text-blue-600 font-semibold text-xs sm:text-base">
                Start Analysis
                <svg className="w-3 h-3 sm:w-5 sm:h-5 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Specific Disease Analysis Card */}
          <div 
            onClick={() => handleAnalysis('specific')}
            className="relative group bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg sm:rounded-2xl" />
            <div className="px-3 py-4 sm:px-6 sm:py-8">
              <div className="flex items-center justify-between mb-3 sm:mb-6">
                <div className="p-1.5 sm:p-3 bg-purple-50 rounded-lg sm:rounded-2xl">
                  <Brain size={20} className="text-purple-600 sm:w-7 sm:h-7" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                  Specialized
                </span>
              </div>
              <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">Specific Disease Analysis</h3>
              <p className="text-xs sm:text-base text-gray-600 mb-3 sm:mb-6 line-clamp-2 sm:line-clamp-none">
                Specialized diagnostic tools for specific medical conditions
              </p>
              <div className="flex items-center text-purple-600 font-semibold text-xs sm:text-base">
                Start Analysis
                <svg className="w-3 h-3 sm:w-5 sm:h-5 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-8 sm:mt-16 text-center px-4">
          <p className="text-xs sm:text-sm text-gray-500">
            This tool is designed to assist medical professionals. For accurate diagnosis, please consult with qualified healthcare providers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;