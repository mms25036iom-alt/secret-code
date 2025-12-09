import { useEffect } from "react";
import "./i18";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomNavBar from "./components/BottomNavBar";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginSignup from "./components/User/LoginSignup";
import LoginSignupOTP from "./components/User/LoginSignupOTP";
import Profile from "./components/User/Profile.jsx";
import VideoCall from "./components/VideoCall.jsx";
import VideoCallRoom from "./pages/VideoCallRoom.jsx";
import SimpleVideoCall from "./pages/SimpleVideoCall.jsx";
import ZegoVideoCall from "./pages/ZegoVideoCall.jsx";
import MedicalAssistant from "./components/MedicalAssistant.jsx";
import VideoCallNotificationListener from "./components/VideoCallNotificationListener.jsx";
import { loadUser } from './actions/userActions.js';
import { useSelector } from 'react-redux';
import { persistReduxStore } from './store.js'
import AnalysisBot from "./pages/AnalysisBot.jsx";
import SpecificAnalysis from "./pages/SpecificAnalysis.jsx";
import AnalysisBotECG from "./pages/AnalysisBotECG.jsx";
import AnalysisBotXRAY from "./pages/AnalysisBotXRAY.jsx";
import HealthTips from "./components/HealthTips.jsx"
import Chat from "./components/Chat/Chat.jsx"
import Landing from "./pages/Landing.jsx";
import MedicalVisionAI from "./pages/FinalCancer.jsx"
import AlzheimerVisionAI from "./pages/Alziemer.jsx"
import AlzheimerVideoAnalysis from "./pages/AlzheimerVideoAnalysis.jsx"
import SkinVisionAI from "./pages/SkinAnalysis.jsx"
import SkinVideoAnalysis from "./pages/SkinVideoAnalysis.jsx";
import RetinolVisionAI from "./pages/Retinopathy.jsx"
import CancerVideoAnalysis from "./pages/CancerVideoAnalysis.jsx";
import RetinopathyVideoAnalysis from './pages/RetinopathyVideoAnalysis';
import XRayVideoAnalysis from './pages/XRayVideoAnalysis';
import ECGVideoAnalysis from './pages/ECGVideoAnalysis';
import GeneralAnalysis from './pages/GeneralAnalysis.jsx';
import Appointments from './pages/Appointments.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import VerifyPrescription from './pages/VerifyPrescription.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import VideoAnalysisTest from './components/VideoAnalysisTest.jsx';
import PharmacyRegistration from './pages/PharmacyRegistration.jsx';
import PharmacyDashboard from './pages/PharmacyDashboard.jsx';
import MedicineCatalog from './pages/MedicineCatalog.jsx';
import ShoppingCart from './pages/ShoppingCart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import PharmacyAdminPanel from './pages/PharmacyAdminPanel.jsx';
import PharmacistDashboard from './pages/PharmacistDashboard.jsx';
import SOSButton from './components/SOSButton.jsx';
import CreateMedicine from './pages/CreateMedicine.jsx';
import RoleBasedHomeRedirect from './components/PharmacistHomeRedirect.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HealthDashboard from './pages/HealthDashboard.jsx';

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.user);

  useEffect(() => {
    // Try to load user on mount (will fail silently if not logged in)
    persistReduxStore.dispatch(loadUser());
  }, []);

  return (
    <div className="flex items-center flex-col w-full min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-20 pb-20 md:pb-0 w-full max-w-full overflow-x-hidden">
        <Routes>
          {/* Public Routes - Login pages only */}
          <Route path='/login' element={isAuthenticated ? <Navigate to="/" replace /> : <LoginSignupOTP />} />
          <Route path='/login-old' element={isAuthenticated ? <Navigate to="/" replace /> : <LoginSignup />} />
          
          {/* Protected Routes - Require authentication */}
          <Route path='/' element={
            <ProtectedRoute>
              <RoleBasedHomeRedirect>
                <Landing />
              </RoleBasedHomeRedirect>
            </ProtectedRoute>
          }></Route>
          
          <Route path='/analysis' element={<ProtectedRoute><AnalysisBot /></ProtectedRoute>}></Route>
          <Route path='/analysis/specific' element={<ProtectedRoute><SpecificAnalysis /></ProtectedRoute>}></Route>
          <Route path='/analysis/ecg' element={<ProtectedRoute><AnalysisBotECG /></ProtectedRoute>}></Route>
          <Route path='/analysis/ecg-video' element={<ProtectedRoute><ECGVideoAnalysis /></ProtectedRoute>}></Route>
          <Route path='/analysis/xray' element={<ProtectedRoute><AnalysisBotXRAY /></ProtectedRoute>}></Route>
          <Route path='/analysis/xray-video' element={<ProtectedRoute><XRayVideoAnalysis /></ProtectedRoute>}></Route>
          <Route path='/analysis/cancer' element={<ProtectedRoute><MedicalVisionAI /></ProtectedRoute>}></Route>
          <Route path='/analysis/cancer-video' element={<ProtectedRoute><CancerVideoAnalysis /></ProtectedRoute>}></Route>
          <Route path='/analysis/alzheimer' element={<ProtectedRoute><AlzheimerVisionAI /></ProtectedRoute>}></Route>
          <Route path='/analysis/alzheimer-video' element={<ProtectedRoute><AlzheimerVideoAnalysis /></ProtectedRoute>}></Route>
          <Route path='/analysis/skin' element={<ProtectedRoute><SkinVisionAI /></ProtectedRoute>}></Route>
          <Route path='/analysis/skin-video' element={<ProtectedRoute><SkinVideoAnalysis /></ProtectedRoute>}></Route>
          <Route path='/analysis/retinopathy' element={<ProtectedRoute><RetinolVisionAI /></ProtectedRoute>}></Route> 
          <Route path='/analysis/retinopathy-video' element={<ProtectedRoute><RetinopathyVideoAnalysis /></ProtectedRoute>} />
          <Route path='/health' element={<ProtectedRoute><HealthTips/></ProtectedRoute>}></Route>
          <Route path='/health/dashboard' element={<ProtectedRoute><HealthDashboard/></ProtectedRoute>}></Route>
          <Route path='/health/monitoring' element={<ProtectedRoute><HealthDashboard/></ProtectedRoute>}></Route>
          <Route path='/health/sync' element={<ProtectedRoute><HealthDashboard/></ProtectedRoute>}></Route>
          <Route path='/health/settings' element={<ProtectedRoute><HealthDashboard/></ProtectedRoute>}></Route>
          <Route path='/chat' element={<ProtectedRoute><Chat/></ProtectedRoute>}></Route>
          <Route path='/analysis/general' element={<ProtectedRoute><GeneralAnalysis/></ProtectedRoute>}></Route>
          
          <Route path='/telemedicine' element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
          <Route path='/video-room' element={<ProtectedRoute><ZegoVideoCall /></ProtectedRoute>} />
          
          <Route path='/account' element={<ProtectedRoute><Profile user={user} /></ProtectedRoute>} />
          <Route path='/appointments' element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path='/prescriptions' element={<ProtectedRoute><ErrorBoundary><Prescriptions /></ErrorBoundary></ProtectedRoute>} />
          <Route path='/verify-prescription/:id' element={<VerifyPrescription />} />
          <Route path='/test-video' element={<ProtectedRoute><VideoAnalysisTest /></ProtectedRoute>} />
          
          {/* Pharmacy Routes */}
          <Route path='/pharmacy/register' element={<ProtectedRoute><PharmacyRegistration /></ProtectedRoute>} />
          <Route path='/pharmacy/dashboard' element={<ProtectedRoute><PharmacyDashboard /></ProtectedRoute>} />
          <Route path='/medicines' element={<ProtectedRoute><MedicineCatalog /></ProtectedRoute>} />
          <Route path='/cart' element={<ProtectedRoute><ShoppingCart /></ProtectedRoute>} />
          <Route path='/checkout' element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path='/orders' element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path='/admin/pharmacy' element={<ProtectedRoute><PharmacyAdminPanel /></ProtectedRoute>} />
          <Route path='/pharmacist/dashboard' element={<ProtectedRoute><PharmacistDashboard /></ProtectedRoute>} />
          <Route path='/pharmacist/create-medicine' element={<ProtectedRoute><CreateMedicine /></ProtectedRoute>} />
        </Routes>
        <Footer />
        <VideoCallNotificationListener />
        <BottomNavBar />
        {/* SOS Button - Only for authenticated patients */}
        {isAuthenticated && user?.role === 'user' && <SOSButton />}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
}

export default App;