import {
  Phone,
  User,
  Stethoscope,
  CheckCircle,
  X,
  Lock,
  Smartphone,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, loadUser } from "../../actions/userActions";
import CloudinaryUpload from "../CloudinaryUpload";
import axios from "../../axios"; // Use custom axios with credentials

const LoginSignupOTP = () => {
  const dispatch = useDispatch();
  const { error, loading, isAuthenticated, user } = useSelector(
    (state) => state.user
  );
  const navigate = useNavigate();

  const [step, setStep] = useState("phone"); // phone, otp, details
  const [isNewUser, setIsNewUser] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    name: "",
    gender: "",
    role: "user",
    speciality: "general",
    avatar: null,
  });
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [displayOtp, setDisplayOtp] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError("");
  };

  const handleAvatarUpload = (avatarData) => {
    setFormData((prev) => ({
      ...prev,
      avatar: avatarData,
    }));
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle authentication success
  useEffect(() => {
    if (error) {
      setLocalError(error);
      setTimeout(() => {
        dispatch(clearErrors());
        setLocalError("");
      }, 5000);
    }

    if (isAuthenticated && user) {
      console.log("✅ Authentication successful, redirecting...");
      navigate("/account");
    }
  }, [dispatch, error, isAuthenticated, user, navigate]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      setLocalError("Please enter a valid 10-digit phone number");
      return;
    }

    setLocalLoading(true);

    try {
      const { data } = await axios.post(
        "/send-otp",
        { phone: formData.phone }
      );

      console.log("✅ OTP Response:", data);
      
      // Show OTP if available (development mode or SMS failed) - EXACTLY like CureConnect
      if (data.otp) {
        console.log("🔐 Your OTP is:", data.otp);
        
        // Show alert with OTP - EXACTLY like CureConnect
        const otpMessage = `🔐 YOUR OTP CODE\n\n${data.otp}\n\nValid for 10 minutes\n\n${data.message}`;
        alert(otpMessage);
        
        // Auto-fill OTP in development - EXACTLY like CureConnect
        setFormData(prev => ({ ...prev, otp: data.otp }));
        
        // Also show in custom popup for better UX
        setDisplayOtp(data.otp);
        setShowOtpPopup(true);
      }
      
      setOtpSent(true);
      setIsNewUser(data.isNewUser);
      setStep("otp");
      setCountdown(60);
      
      // Show success message if no OTP in response
      if (!data.otp) {
        alert(`✅ ${data.message}\n\nPlease check your phone for the OTP.`);
      }
    } catch (error) {
      console.error("❌ OTP send failed:", error);
      setLocalError(
        error.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!formData.otp || formData.otp.length !== 6) {
      setLocalError("Please enter a valid 6-digit OTP");
      return;
    }

    // If existing user, verify and login
    if (!isNewUser) {
      setLocalLoading(true);
      try {
        const { data } = await axios.post(
          "/verify-otp",
          {
            phone: formData.phone,
            otp: formData.otp,
          }
        );

        console.log("✅ Login successful:", data);
        
        // Store token in localStorage as backup
        localStorage.setItem("token", data.token);
        
        // Load user data into Redux
        dispatch(loadUser());
        
        // Navigate to account page
        navigate("/account");
      } catch (error) {
        console.error("❌ OTP verification failed:", error);
        setLocalError(
          error.response?.data?.message || "Invalid OTP. Please try again."
        );
      } finally {
        setLocalLoading(false);
      }
    } else {
      // New user - go to details step
      setStep("details");
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!formData.name || formData.name.length < 4) {
      setLocalError("Name should have more than 4 characters");
      return;
    }

    if (!formData.gender) {
      setLocalError("Please select your gender");
      return;
    }

    setLocalLoading(true);

    try {
      const { data } = await axios.post(
        "/verify-otp",
        {
          phone: formData.phone,
          otp: formData.otp,
          name: formData.name,
          gender: formData.gender,
          role: formData.role,
          speciality: formData.speciality,
          avatar: formData.avatar ? JSON.stringify(formData.avatar) : null,
        }
      );

      console.log("✅ Registration successful:", data);
      
      // Store token in localStorage as backup
      localStorage.setItem("token", data.token);
      
      // Load user data into Redux
      dispatch(loadUser());
      
      // Navigate to account page
      navigate("/account");
    } catch (error) {
      console.error("❌ Registration failed:", error);
      setLocalError(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtpSent(false);
      setFormData((prev) => ({ ...prev, otp: "" }));
    } else if (step === "details") {
      setStep("otp");
    }
  };

  // OTP input refs for auto-focus
  const otpInputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = formData.otp.split('');
    newOtp[index] = value;
    const otpString = newOtp.join('');

    setFormData(prev => ({ ...prev, otp: otpString }));
    setLocalError("");

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      setFormData(prev => ({ ...prev, otp: pastedData }));
      // Focus last filled input
      const lastIndex = Math.min(pastedData.length - 1, 5);
      otpInputRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      {/* OTP Popup Modal */}
      {showOtpPopup && displayOtp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-green-400 to-emerald-400 p-6 rounded-full">
                  <Lock size={48} className="text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-3xl font-bold text-gray-800 text-center mb-2">
              Your OTP Code
            </h3>
            <p className="text-gray-500 text-center mb-8">
              Use this code to verify your account
            </p>

            {/* OTP Display */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
              <div className="flex justify-center items-center space-x-3">
                {displayOtp.split('').map((digit, index) => (
                  <div
                    key={index}
                    className="w-12 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-blue-300"
                  >
                    <span className="text-3xl font-bold text-blue-600">{digit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
              <p className="text-sm text-yellow-800">
                <strong>⏰ Valid for 10 minutes</strong>
                <br />
                This OTP popup appears for testing purposes on mobile devices.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowOtpPopup(false)}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg active:scale-95"
            >
              Got it! Close
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {(localError || error) && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-md animate-slide-in">
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg shadow-lg">
            <div className="flex items-center">
              <X size={18} className="text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
              <p className="text-red-800 text-xs sm:text-sm">{localError || error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-5xl">
        {/* Step 1: Phone Number Entry */}
        {step === "phone" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-md mx-auto">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-yellow-400 to-orange-400 p-4 rounded-2xl">
                  <Lock size={40} className="text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-2">
              OTP Verification
            </h2>
            <p className="text-sm sm:text-base text-gray-500 text-center mb-6 sm:mb-8">
              Enter Your Phone Number
            </p>

            {/* Phone Input */}
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="flex items-center bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-gray-200 focus-within:border-blue-500 transition-all">
                {/* Country Code */}
                <div className="flex items-center space-x-1 sm:space-x-2 pr-2 sm:pr-3 border-r-2 border-gray-300">
                  <span className="text-xl sm:text-2xl">🇮🇳</span>
                  <span className="text-gray-700 font-medium text-sm sm:text-base">+91</span>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Phone Number */}
                <input
                  type="tel"
                  name="phone"
                  placeholder="1234 5678 9101"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength="10"
                  className="flex-1 pl-2 sm:pl-4 bg-transparent text-gray-800 text-base sm:text-lg font-medium outline-none placeholder:text-gray-400"
                  required
                />

                {/* Check Icon */}
                {formData.phone.length === 10 && (
                  <div className="bg-green-500 p-1 sm:p-1.5 rounded-full ml-1 sm:ml-2">
                    <CheckCircle size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                  </div>
                )}
              </div>

              {/* Send Code Button */}
              <button
                type="submit"
                disabled={localLoading || formData.phone.length !== 10}
                className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-white text-base sm:text-lg transition-all shadow-lg ${
                  localLoading || formData.phone.length !== 10
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 active:scale-95"
                }`}
              >
                {localLoading ? "Sending..." : "Send Code"}
              </button>

              {/* Change Number Link */}
              <button
                type="button"
                className="w-full text-gray-500 hover:text-gray-700 font-medium transition-colors text-sm sm:text-base"
              >
                Change Number
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-md mx-auto">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-400 to-cyan-400 p-4 rounded-2xl">
                  <Smartphone size={40} className="text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-2">
              Account Verification
            </h2>
            <p className="text-sm sm:text-base text-gray-500 text-center mb-6 sm:mb-8">
              Enter Verify Code Below
            </p>

            {/* OTP Inputs */}
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3 px-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={formData.otp[index] || ''}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className={`w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl transition-all ${
                      formData.otp[index]
                        ? 'bg-gray-100 border-2 border-blue-500 text-gray-800'
                        : 'bg-gray-50 border-2 border-gray-200 text-gray-400'
                    } focus:border-blue-500 focus:bg-white outline-none`}
                  />
                ))}
              </div>

              {/* Phone Number Display */}
              <p className="text-center text-sm text-gray-500">
                Code sent to +91 {formData.phone}
              </p>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={localLoading || formData.otp.length !== 6}
                className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-white text-base sm:text-lg transition-all shadow-lg ${
                  localLoading || formData.otp.length !== 6
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 active:scale-95"
                }`}
              >
                {localLoading ? "Verifying..." : "Verify Code"}
              </button>

              {/* Resend Code */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-gray-500 text-sm">
                    Resend code in <span className="font-semibold text-blue-600">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-gray-500 hover:text-gray-700 font-medium transition-colors text-sm"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          </div>
        )}



        {/* Step 3: Complete Profile (New Users Only) */}
        {step === "details" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-2xl mx-auto">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-green-400 to-emerald-400 p-4 rounded-2xl">
                  <User size={40} className="text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-2">
              Complete Your Profile
            </h2>
            <p className="text-sm sm:text-base text-gray-500 text-center mb-6 sm:mb-8">
              Tell us a bit about yourself
            </p>

            <form onSubmit={handleCompleteRegistration} className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-800"
                  required
                />
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["male", "female", "other"].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, gender }))}
                      className={`py-3 px-4 rounded-xl font-medium capitalize transition-all ${
                        formData.gender === gender
                          ? "bg-blue-500 text-white shadow-lg"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I am a
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "user" }))}
                    className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                      formData.role === "user"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                    }`}
                  >
                    <User size={24} className="mb-2" />
                    <span className="text-sm font-medium">Patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "doctor" }))}
                    className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                      formData.role === "doctor"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                    }`}
                  >
                    <Stethoscope size={24} className="mb-2" />
                    <span className="text-sm font-medium">Doctor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "pharmacist" }))}
                    className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                      formData.role === "pharmacist"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      <path d="M12 6v6" />
                      <path d="M9 9h6" />
                    </svg>
                    <span className="text-sm font-medium mt-2">Pharmacist</span>
                  </button>
                </div>
              </div>

              {/* Doctor-specific fields */}
              {formData.role === "doctor" && (
                <div className="space-y-6 pt-4 border-t-2 border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Speciality
                    </label>
                    <select
                      name="speciality"
                      value={formData.speciality}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-800"
                      required
                    >
                      <option value="">Select Speciality</option>
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Orthopedic">Orthopedic</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Gynecologist">Gynecologist</option>
                      <option value="Psychiatrist">Psychiatrist</option>
                      <option value="ENT Specialist">ENT Specialist</option>
                      <option value="Ophthalmologist">Ophthalmologist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo
                    </label>
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                      <CloudinaryUpload
                        onImageUpload={handleAvatarUpload}
                        currentImage={formData.avatar?.url}
                        disabled={localLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={localLoading}
                className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-white text-base sm:text-lg transition-all shadow-lg ${
                  localLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 active:scale-95"
                }`}
              >
                {localLoading ? "Creating Account..." : "Complete Registration"}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginSignupOTP;
