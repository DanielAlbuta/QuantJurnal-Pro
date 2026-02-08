import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, BarChart3, Settings as SettingsIcon, LogOut, BookOpen, PlusCircle, RotateCcw } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import Analytics from './components/Analytics';
import UserProfileView from './components/UserProfile';
import Settings from './components/Settings';
import TradeEntryModal from './components/TradeEntryModal';
import TradePreviewModal from './components/TradePreviewModal';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import { MOCK_TRADES, DEFAULT_STRATEGIES, DEFAULT_SETUPS } from './utils/mockData';
import { Trade, UserProfile } from './types';
import { api, getToken, removeToken } from './api';

// Extended View Router
type View = 'dashboard' | 'journal' | 'analytics' | 'settings' | 'profile';
type AuthState = 'landing' | 'login' | 'register' | 'authenticated';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Trader One',
  accountType: 'Pro Account',
  startBalance: 100000,
  currency: 'USD',
  maxRiskPerTrade: 2.0,
  maxDailyLoss: 5.0,
  monthlyGoal: 10.0,
  avatarUrl: '',
  bio: 'Discretionary trader focused on FX and Indices.',
  customStrategies: DEFAULT_STRATEGIES,
  customSetups: DEFAULT_SETUPS
};

const App: React.FC = () => {
  // Routing State
  const [authState, setAuthState] = useState<AuthState>('landing');
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Data State
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modal states
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | undefined>(undefined);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [tradeToPreview, setTradeToPreview] = useState<Trade | undefined>(undefined);

  // Load user data and trades from API
  const loadUserData = async () => {
    setIsLoadingData(true);
    try {
      // Get user profile
      const userResponse = await api.getMe();
      const userData = userResponse.user;

      // Ensure custom lists have defaults
      if (!userData.customStrategies) userData.customStrategies = DEFAULT_STRATEGIES;
      if (!userData.customSetups) userData.customSetups = DEFAULT_SETUPS;

      setUserProfile(userData);

      // Get trades
      const tradesResponse = await api.getTrades();
      setTrades(tradesResponse.trades || []);

      setAuthState('authenticated');
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Token invalid or expired, clear it
      removeToken();
      setAuthState('landing');
    } finally {
      setIsLoadingData(false);
      setIsLoaded(true);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Verify token and load data from API
      loadUserData();
    } else {
      setIsLoaded(true);
    }
  }, []);

  const handleLoginSuccess = async (userData?: Partial<UserProfile>) => {
    if (userData) {
      // Merge with defaults for any missing fields
      const newProfile = {
        ...DEFAULT_PROFILE,
        ...userData,
        customStrategies: userData.customStrategies || DEFAULT_STRATEGIES,
        customSetups: userData.customSetups || DEFAULT_SETUPS
      };
      setUserProfile(newProfile);
    }

    // Load trades from API after successful login
    try {
      const tradesResponse = await api.getTrades();
      setTrades(tradesResponse.trades || []);
    } catch (error) {
      console.error('Failed to load trades:', error);
      setTrades([]);
    }

    setAuthState('authenticated');
  };

  const handleLogout = () => {
    removeToken();
    setTrades([]);
    setUserProfile(DEFAULT_PROFILE);
    setAuthState('landing');
    setCurrentView('dashboard');
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    try {
      const response = await api.updateProfile(profile);
      setUserProfile(response.user);
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Still update local state for UX
      setUserProfile(profile);
    }
  };

  const handleSaveTrade = async (tradeData: Trade) => {
    try {
      const exists = trades.some(t => t.id === tradeData.id);

      if (exists) {
        // Update existing trade
        const response = await api.updateTrade(tradeData.id, tradeData);
        setTrades(prev => prev.map(t => t.id === tradeData.id ? response.trade : t));
      } else {
        // Create new trade
        const { id, ...newTradeData } = tradeData;
        const response = await api.createTrade(newTradeData);
        setTrades(prev => [response.trade, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save trade:', error);
      // Fallback to local state update for UX
      setTrades(prev => {
        const exists = prev.some(t => t.id === tradeData.id);
        if (exists) {
          return prev.map(t => t.id === tradeData.id ? tradeData : t);
        }
        return [tradeData, ...prev];
      });
    }
    setTradeToEdit(undefined);
  };

  const handleDeleteTrade = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await api.deleteTrade(id);
        setTrades(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error('Failed to delete trade:', error);
      }
      setIsTradeModalOpen(false);
    }
  };

  const handleImportTrades = async (newTrades: Trade[]) => {
    try {
      // First, delete all existing trades
      await api.deleteAllTrades();

      // Then import new trades via API
      const result = await api.importTrades(newTrades);

      // Reload trades from API to get proper IDs
      const tradesResponse = await api.getTrades();
      setTrades(tradesResponse.trades || []);

      alert(`Successfully imported ${result.imported} trades.`);
    } catch (error) {
      console.error('Import failed:', error);
      // Fallback to local state
      setTrades(newTrades);
      alert(`Imported ${newTrades.length} trades (offline mode).`);
    }
  };

  // CLEARS ALL DATA (Empty Array)
  const handleDeleteAllTrades = async () => {
    if (window.confirm('WARNING: This will permanently delete ALL your trades from the journal. Are you sure?')) {
      try {
        await api.deleteAllTrades();
        setTrades([]);
      } catch (error) {
        console.error('Failed to delete all trades:', error);
        setTrades([]);
      }

      setTradeToEdit(undefined);
      setTradeToPreview(undefined);

      alert("All trades have been deleted.");
    }
  };

  // RESTORES DEMO DATA
  const handleLoadDemo = async () => {
    if (window.confirm('Load demo data? This will overwrite your current trades.')) {
      try {
        // Delete existing trades first
        await api.deleteAllTrades();

        // Import demo trades
        await api.importTrades(MOCK_TRADES);

        // Reload from API
        const tradesResponse = await api.getTrades();
        setTrades(tradesResponse.trades || MOCK_TRADES);

        alert("Demo data restored.");
      } catch (error) {
        console.error('Failed to load demo:', error);
        setTrades(MOCK_TRADES);
        alert("Demo data restored (offline mode).");
      }
      setCurrentView('dashboard');
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsTradeModalOpen(true);
  };

  const handlePreviewTrade = (trade: Trade) => {
    setTradeToPreview(trade);
    setIsPreviewModalOpen(true);
  };

  const handleAddTrade = () => {
    setTradeToEdit(undefined);
    setIsTradeModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTradeModalOpen(false);
    setTimeout(() => setTradeToEdit(undefined), 100);
  };

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setTimeout(() => setTradeToPreview(undefined), 100);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          trades={trades}
          userProfile={userProfile}
          onViewJournal={() => setCurrentView('journal')}
          onPreviewTrade={handlePreviewTrade}
        />;
      case 'journal':
        return <TradeList
          trades={trades}
          userProfile={userProfile}
          onAddTrade={handleAddTrade}
          onEditTrade={handleEditTrade}
          onDeleteTrade={handleDeleteTrade}
          onDeleteAll={handleDeleteAllTrades}
          onPreviewTrade={handlePreviewTrade}
        />;
      case 'analytics':
        return <Analytics trades={trades} userProfile={userProfile} />;
      case 'profile':
        return <UserProfileView profile={userProfile} onSave={handleSaveProfile} />;
      case 'settings':
        return <Settings
          userProfile={userProfile}
          onUpdateProfile={handleSaveProfile}
          trades={trades}
          onImportTrades={handleImportTrades}
          onResetData={handleDeleteAllTrades}
          onLoadDemo={handleLoadDemo}
        />;
      default:
        return <Dashboard
          trades={trades}
          userProfile={userProfile}
          onViewJournal={() => setCurrentView('journal')}
          onPreviewTrade={handlePreviewTrade}
        />;
    }
  };

  const NavItem = ({ view, icon, label }: { view: View; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === view
          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  // --- LOADING STATE ---
  if (!isLoaded || isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your journal...</p>
        </div>
      </div>
    );
  }

  // --- PUBLIC ROUTES (Landing / Auth) ---
  if (authState === 'landing') {
    return <LandingPage onLogin={() => setAuthState('login')} onRegister={() => setAuthState('register')} />;
  }

  if (authState === 'login' || authState === 'register') {
    return (
      <AuthPage
        initialMode={authState}
        onAuthSuccess={handleLoginSuccess}
        onBack={() => setAuthState('landing')}
      />
    );
  }

  // --- PROTECTED APP ROUTE ---
  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">QuantJournal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem view="dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Overview" />
          <NavItem view="journal" icon={<List className="w-5 h-5" />} label="Trade Journal" />
          <NavItem view="analytics" icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />

          <div className="pt-8 pb-2 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Tools
          </div>
          <NavItem view="profile" icon={<UserIcon className="w-5 h-5" />} label="Profile" />
          <NavItem view="settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setCurrentView('profile')}
            className="flex-1 flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left group"
            title="Go to Profile"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden border border-slate-600 group-hover:border-indigo-500 transition-colors">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userProfile.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-slate-200 truncate group-hover:text-indigo-400 transition-colors">{userProfile.name}</div>
              <div className="text-xs text-slate-500 truncate">{userProfile.accountType}</div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-900/10 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">QJ</span>
          </div>
          <button className="p-2 text-slate-400">
            <List className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>

        {/* Floating Action Button */}
        {currentView === 'journal' && (
          <div className="absolute bottom-8 right-8">
            <button
              onClick={handleAddTrade}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg shadow-indigo-900/50 transition-transform hover:scale-105"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>

      {/* Trade Entry Modal (Create/Edit) */}
      <TradeEntryModal
        isOpen={isTradeModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTrade}
        onDelete={handleDeleteTrade}
        tradeToEdit={tradeToEdit}
        userProfile={userProfile}
      />

      {/* Trade Preview Modal (Read Only) */}
      <TradePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreview}
        trade={tradeToPreview}
        allTrades={trades}
        userProfile={userProfile}
        onEdit={handleEditTrade}
        onDelete={handleDeleteTrade}
      />
    </div>
  );
};

// Helper Icon for sidebar
const UserIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default App;