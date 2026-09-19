import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AwardsPage from './pages/AwardsPage';
import NominatePage from './pages/NominatePage';
import VotePage from './pages/VotePage';
import NomineesPage from './pages/NomineesPage';
import NomineeProfile from './pages/NomineeProfile';
import SponsorsPage from './pages/SponsorsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-ink-900 text-white overflow-x-hidden">
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="min-h-screen">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/awards" element={<AwardsPage />} />
                    <Route path="/nominate" element={<NominatePage />} />
                    <Route path="/vote" element={<VotePage />} />
                    <Route path="/nominees" element={<NomineesPage />} />
                    <Route path="/nominee/:id" element={<NomineeProfile />} />
                    <Route path="/sponsors" element={<SponsorsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimatePresence>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/*" element={<AdminDashboard />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center">
        <h1 className="text-7xl font-bold gold-text mb-4">404</h1>
        <p className="text-white/60 text-xl mb-8">Page not found</p>
        <a href="/" className="btn-gold">Back to Home</a>
      </div>
    </div>
  );
}