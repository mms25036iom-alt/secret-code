import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Stethoscope, Activity, Heart, Pill, MessageCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import MedicalAssistant from "../components/MedicalAssistant";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const medicalAssistantRef = useRef(null);

  // Slideshow images - just the image paths
  const slides = [
    "/ayushman-bharat.png",
    "/nasha-mukt.png"
  ];

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const services = [
    {
      id: 1,
      icon: <Stethoscope className="w-16 h-16" />,
      title: t('landing.services.doctorConsult.title'),
      description: t('landing.services.doctorConsult.description'),
      route: "/chat",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      id: 2,
      icon: <Activity className="w-16 h-16" />,
      title: t('landing.services.analysis.title'),
      description: t('landing.services.analysis.description'),
      route: "/analysis",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      id: 5,
      icon: <span className="text-5xl">🏥</span>,
      title: "AI Medical Scanner",
      description: "Advanced AI analysis for ECG, X-Ray, MRI, Skin & more",
      route: "/medical-ai",
      gradient: "from-indigo-500 to-cyan-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    },
    {
      id: 3,
      icon: <Heart className="w-16 h-16" />,
      title: t('landing.services.healthTips.title'),
      description: t('landing.services.healthTips.description'),
      route: "/health",
      gradient: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600"
    },
    {
      id: 4,
      icon: <Pill className="w-16 h-16" />,
      title: t('landing.services.medicineChecker.title'),
      description: t('landing.services.medicineChecker.description'),
      route: "/medicines",
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Slideshow Section - Full width images only */}
      <div className="relative w-full h-[250px] md:h-[350px] lg:h-[500px] overflow-hidden bg-white shadow-lg">
        {slides.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Navigation Arrows - Smaller on Mobile */}
        <button
          onClick={prevSlide}
          className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 lg:p-3 rounded-full shadow-lg transition-all z-20"
        >
          <ChevronLeft className="w-4 h-4 lg:w-6 lg:h-6 text-gray-800" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 lg:p-3 rounded-full shadow-lg transition-all z-20"
        >
          <ChevronRight className="w-4 h-4 lg:w-6 lg:h-6 text-gray-800" />
        </button>

        {/* Slide Indicators - Smaller on Mobile */}
        <div className="absolute bottom-3 lg:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-blue-600 w-6 lg:w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Services Section - Compact spacing on Mobile */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-24">
        <div className="text-center mb-6 md:mb-8 lg:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 md:mb-4">
            {t('landing.ourServices')}
          </h2>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg">
            {t('landing.servicesSubtitle')}
          </p>
        </div>

        {/* Service Cards Grid - 2 columns on mobile, 4 on desktop - Fully clickable cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => navigate(service.route)}
              className={`${service.bgColor} rounded-xl lg:rounded-2xl p-4 md:p-6 lg:p-8 shadow-md hover:shadow-xl transform active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer group`}
            >
              <div className={`${service.iconColor} mb-3 md:mb-4 lg:mb-6 transform group-hover:scale-110 transition-transform duration-300 flex justify-center`}>
                <Stethoscope className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" style={{ display: service.id === 1 ? 'block' : 'none' }} />
                <Activity className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" style={{ display: service.id === 2 ? 'block' : 'none' }} />
                <Heart className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" style={{ display: service.id === 3 ? 'block' : 'none' }} />
                <Pill className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" style={{ display: service.id === 4 ? 'block' : 'none' }} />
              </div>
              <h3 className="text-sm md:text-lg lg:text-2xl font-bold text-gray-800 mb-1 md:mb-2 text-center">
                {service.title}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm lg:text-base text-center line-clamp-2">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* AI Medical Assistant Section */}
        <div className="mt-8 md:mt-12">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 md:mb-6 text-center">
            {t('landing.aiAssistant.title')}
          </h3>
          <div 
            onClick={() => medicalAssistantRef.current?.toggleChatbot()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 md:p-8 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-center space-x-4 text-white">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16" />
              <div className="text-left">
                <h4 className="text-xl md:text-2xl font-bold mb-1">{t('landing.aiAssistant.name')}</h4>
                <p className="text-blue-100 text-sm md:text-base">{t('landing.aiAssistant.description')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden Medical Assistant - Opens as floating chat, button hidden */}
        <MedicalAssistant ref={medicalAssistantRef} hideButton={true} />
      </div>

      {/* Call to Action Section - Hidden on Mobile/Tablet, Visible on Desktop */}
      {!isAuthenticated && (
        <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('landing.cta.title')}
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              {t('landing.cta.subtitle')}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-blue-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl"
            >
              {t('landing.cta.button')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
