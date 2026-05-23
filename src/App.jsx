import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ThemeProvider } from '@/lib/ThemeContext';
import ScrollToTop from '@/components/ScrollToTop';
import { MotionConfig } from 'framer-motion';
import { ADMIN_CMS_HOME, ADMIN_CMS_PATH, getAdminPanelHref } from '@/lib/adminNavigation';

// Site pages
import SiteLayout from '@/components/site/SiteLayout';
import Home from '@/pages/site/Home';
import About from '@/pages/site/About';
import Projects from '@/pages/site/Projects';
import ProjectDetail from '@/pages/site/ProjectDetail';
import Testimonials from '@/pages/site/Testimonials';
import Contact from '@/pages/site/Contact';
import LegalPage from '@/pages/site/LegalPage';
import NewsletterUnsubscribe from '@/pages/site/NewsletterUnsubscribe';
import NewsletterUnsubscribeSuccess from '@/pages/site/NewsletterUnsubscribeSuccess';

// Admin pages
import AdminLayout from '@/components/admin/AdminLayout';
import PageEditor from '@/pages/admin/PageEditor';
import Login from '@/pages/admin/Login';
import ContractSigningPage from '@/pages/site/ContractSigningPage';

function AdminSearchRedirect({ to }) {
  const location = useLocation();

  return <Navigate to={`${to}${location.search || ''}`} replace />;
}

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
                  <Route path="/projects/:slug" element={<ProjectDetail />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/sign/:token" element={<ContractSigningPage />} />
                  <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
                  <Route path="/newsletter/unsubscribed" element={<NewsletterUnsubscribeSuccess />} />
                  <Route path="/privacy" element={<LegalPage />} />
                  <Route path="/terms" element={<LegalPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                </Route>

                {/* Admin login — public */}
                <Route path="/admin/login" element={<Login />} />

                {/* Admin panel — protected */}
                <Route element={<ProtectedRoute requireAdmin />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to={ADMIN_CMS_HOME} replace />} />
                    <Route path="site-management" element={<Navigate to={ADMIN_CMS_HOME} replace />} />
                    <Route path="site-management/cms" element={<PageEditor />} />
                    <Route path="cms" element={<AdminSearchRedirect to={ADMIN_CMS_PATH} />} />
                    <Route path="pages" element={<AdminSearchRedirect to={ADMIN_CMS_PATH} />} />
                    <Route path="projects" element={<Navigate to={getAdminPanelHref('projects')} replace />} />
                    <Route path="clients" element={<Navigate to={getAdminPanelHref('clients')} replace />} />
                    <Route path="testimonials" element={<Navigate to={getAdminPanelHref('testimonials')} replace />} />
                    <Route path="messages" element={<Navigate to={getAdminPanelHref('messages')} replace />} />
                    <Route path="theme" element={<Navigate to={getAdminPanelHref('theme')} replace />} />
                    <Route path="site" element={<Navigate to={getAdminPanelHref('site')} replace />} />
                    <Route path="manage-pages" element={<Navigate to={getAdminPanelHref('manage-pages')} replace />} />
                    <Route path="help" element={<Navigate to={getAdminPanelHref('help')} replace />} />
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
