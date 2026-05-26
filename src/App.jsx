import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PermissionGate from '@/components/PermissionGate';
import { ThemeProvider } from '@/lib/ThemeContext';
import ScrollToTop from '@/components/ScrollToTop';
import { MotionConfig } from 'framer-motion';

// Site pages
import SiteLayout from '@/components/site/SiteLayout';
import Home from '@/pages/site/Home';
import About from '@/pages/site/About';
import Projects from '@/pages/site/Projects';
import Gallery from '@/pages/site/Gallery';
import ProjectDetail from '@/pages/site/ProjectDetail';
import Testimonials from '@/pages/site/Testimonials';
import Contact from '@/pages/site/Contact';
import LegalPage from '@/pages/site/LegalPage';

// Admin pages
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHome from '@/pages/admin/AdminHome';
import AccountAdmin from '@/pages/admin/AccountAdmin';
import Dashboard from '@/pages/admin/Dashboard';
import PageEditor from '@/pages/admin/PageEditor';
import ProjectsAdmin from '@/pages/admin/ProjectsAdmin';
import TestimonialsAdmin from '@/pages/admin/TestimonialsAdmin';
import MessagesAdmin from '@/pages/admin/MessagesAdmin';
import ThemeSettings from '@/pages/admin/ThemeSettings';
import SiteAssets from '@/pages/admin/SiteAssets';
import Login from '@/pages/admin/Login';
import Help from '@/pages/admin/Help';
import PagesManager from '@/pages/admin/PagesManager';
import ScheduleAdmin from '@/pages/admin/ScheduleAdmin';
import ClientPackage from '@/pages/site/ClientPackage';
import Unsubscribe from '@/pages/site/Unsubscribe';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Public site */}
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/projects/:slug" element={<ProjectDetail />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<LegalPage />} />
                  <Route path="/terms" element={<LegalPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                </Route>

                <Route path="/documents/sign/:accessToken" element={<ClientPackage />} />
                <Route path="/client-package/:accessToken" element={<ClientPackage />} />
                <Route path="/unsubscribe/:accessToken" element={<Unsubscribe />} />

                {/* Admin login — public */}
                <Route path="/admin/login" element={<Login />} />

                {/* Admin panel — protected */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminHome />} />
                    <Route path="pages" element={<Navigate to="/admin" replace />} />
                    <Route path="dashboard" element={<PermissionGate permission="site"><Dashboard /></PermissionGate>} />
                    <Route path="projects" element={<PermissionGate permission="site"><ProjectsAdmin /></PermissionGate>} />
                    <Route path="testimonials" element={<PermissionGate permission="site"><TestimonialsAdmin /></PermissionGate>} />
                    <Route path="messages" element={<PermissionGate permission="messages"><MessagesAdmin /></PermissionGate>} />
                    <Route path="clients" element={<PermissionGate permission="clients"><Navigate to="/admin?panel=clients" replace /></PermissionGate>} />
                    <Route path="schedule" element={<PermissionGate permission="schedule"><ScheduleAdmin /></PermissionGate>} />
                    <Route path="account" element={<AccountAdmin />} />
                    <Route path="theme" element={<PermissionGate permission="site"><ThemeSettings /></PermissionGate>} />
                    <Route path="site" element={<PermissionGate permission="site"><SiteAssets /></PermissionGate>} />
                    <Route path="manage-pages" element={<PermissionGate permission="site"><PagesManager /></PermissionGate>} />
                    <Route path="help" element={<PermissionGate permission="site"><Help /></PermissionGate>} />
                  </Route>
                </Route>

                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Router>
          </MotionConfig>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
