import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Landing Page
import LandingPage from './pages/LandingPage';

// Client Portal (Portal A)
import ClientLayout from './features/client/layouts/ClientLayout';
import ClientDashboard from './features/client/pages/Dashboard';
import CommandCenter from './features/client/pages/CommandCenter';
import AutomationStatus from './features/client/pages/AutomationStatus';
import ThreatMap from './features/client/pages/ThreatMap';
import EventStream from './features/client/pages/EventStream';

// Admin Portal (Portal B)
import AdminLayout from './features/admin/layouts/AdminLayout';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import IncidentReview from './features/admin/pages/IncidentReview';
import PolicyConfig from './features/admin/pages/PolicyConfig';
import DecisionTimeline from './features/admin/pages/DecisionTimeline';
import ComplianceReports from './features/admin/pages/ComplianceReports';
import IncidentsPage from './features/admin/pages/IncidentsPage';
import SettingsPage from './features/admin/pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Client Portal Routes */}
        <Route path="/client/*" element={
          <ClientLayout>
            <Routes>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="command-center" element={<CommandCenter />} />
              <Route path="automation" element={<AutomationStatus />} />
              <Route path="map" element={<ThreatMap />} />
              <Route path="events" element={<EventStream />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ClientLayout>
        } />

        {/* Admin Portal Routes */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="incidents/review/:id" element={<IncidentReview />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="compliance" element={<ComplianceReports />} />
              <Route path="policy" element={<PolicyConfig />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="timeline" element={<DecisionTimeline />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </AdminLayout>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
