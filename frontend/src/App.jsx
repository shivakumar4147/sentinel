import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SentinelProvider } from './context/SentinelContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { ServicesPage } from './pages/ServicesPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { RemediationPage } from './pages/RemediationPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SentinelProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="incidents" element={<IncidentsPage />} />
                <Route path="investigation" element={<InvestigationPage />} />
                <Route path="approvals" element={<ApprovalsPage />} />
                <Route path="remediation" element={<RemediationPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SentinelProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

