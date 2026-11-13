import { useState } from 'react';
import { Shield, TriangleAlert as AlertTriangle, UserX, Loader as Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LoginScreen, RegisterScreen } from '@/components/AuthScreens';
import { AppLayout, type Page } from '@/components/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ShiftsPage } from '@/pages/ShiftsPage';
import { SanctionsPage } from '@/pages/SanctionsPage';
import { WarningsPage } from '@/pages/WarningsPage';
import { RegulationsPage } from '@/pages/RegulationsPage';
import { LogsPage } from '@/pages/LogsPage';
import { MembersPage } from '@/pages/MembersPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { InvoiriPage } from '@/pages/InvoiriPage';
import { StaffSanctionsPage } from '@/pages/StaffSanctionsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AccountPage } from '@/pages/AccountPage';
import { GuidelinesPage } from '@/pages/GuidelinesPage';
import { AccountsPage } from '@/pages/AccountsPage';

function AppContent() {
  const { session, profile, loading, banned, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return authMode === 'login' ? (
      <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  if (banned) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 mb-2">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Acces Blocat</h1>
          <p className="text-slate-400 mt-2 max-w-md">
            Contul tau de staff a fost blocat si nu mai poti accesa portalul. Daca aceasta este o
            eroare, contacteaza un supervizor sau manager.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition border border-slate-700"
        >
          Deconectare
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 mb-2">
          <UserX className="w-10 h-10 text-slate-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Profil lipsa</h1>
          <p className="text-slate-400 mt-2 max-w-md">
            Contul tau nu are un profil de staff asociat. Contacteaza un manager pentru a-ti atribui
            un profil si un grad.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition border border-slate-700"
        >
          Deconectare
        </button>
      </div>
    );
  }

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'shifts' && <ShiftsPage />}
      {currentPage === 'sanctions' && <SanctionsPage />}
      {currentPage === 'warnings' && <WarningsPage />}
      {currentPage === 'regulations' && <RegulationsPage />}
      {currentPage === 'logs' && <LogsPage />}
      {currentPage === 'members' && <MembersPage />}
      {currentPage === 'announcements' && <AnnouncementsPage />}
      {currentPage === 'invoiri' && <InvoiriPage />}
      {currentPage === 'staff_sanctions' && <StaffSanctionsPage />}
      {currentPage === 'settings' && <SettingsPage />}
      {currentPage === 'account' && <AccountPage />}
      {currentPage === 'guidelines' && <GuidelinesPage />}
      {currentPage === 'accounts' && <AccountsPage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
