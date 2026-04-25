import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ThemeProvider } from '@/lib/ThemeContext';

// Site pages
import SiteLayout from '@/components/site/SiteLayout';
import Home from '@/pages/site/Home';
import About from '@/pages/site/About';
import Projects from '@/pages/site/Projects';
import ProjectDetail from '@/pages/site/ProjectDetail';
import Testimonials from '@/pages/site/Testimonials';
import Contact from '@/pages/site/Contact';
import LegalPage from '@/pages/site/LegalPage';

// Admin pages
import AdminLayout from '@/components/admin/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import PageEditor from '@/pages/admin/PageEditor';
import ProjectsAdmin from '@/pages/admin/ProjectsAdmin';
import TestimonialsAdmin from '@/pages/admin/TestimonialsAdmin';
import MessagesAdmin from '@/pages/admin/MessagesAdmin';
import ThemeSettings from '@/pages/admin/ThemeSettings';
import SiteAssets from '@/pages/admin/SiteAssets';
import Login from '@/pages/admin/Login';
import Help from '@/pages/admin/Help';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider>
          <Router>
            <Routes>
              {/* Public site */}
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:slug" element={<ProjectDetail />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<LegalPage />} />
                <Route path="/terms" element={<LegalPage />} />
                <Route path="/legal" element={<LegalPage />} />
              </Route>

              {/* Admin login — public */}
              <Route path="/admin/login" element={<Login />} />

              {/* Admin panel — protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="pages" element={<PageEditor />} />
                  <Route path="projects" element={<ProjectsAdmin />} />
                  <Route path="testimonials" element={<TestimonialsAdmin />} />
                  <Route path="messages" element={<MessagesAdmin />} />
                  <Route path="theme" element={<ThemeSettings />} />
                  <Route path="site" element={<SiteAssets />} />
                  <Route path="help" element={<Help />} />
                </Route>
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
