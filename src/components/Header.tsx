import React, { useState, useEffect } from 'react';
import { Globe, Menu, X, Home, Grid3X3, Settings, LogOut, Building2, Shield, Info, CreditCard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate?: (page: string) => void;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
}

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCompanyRepresentative, setIsCompanyRepresentative] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const { user, isAuthenticated, signOut, loading } = useAuth();

  const text = {
    ar: {
      home: 'الرئيسية',
      categories: 'الفئات',
      about: 'من نحن',
      pricing: 'الأسعار',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      dashboard: 'لوحة التحكم',
      myDashboard: 'لوحة التحكم الخاصة بي',
      companyDashboard: 'لوحة الشركة',
      adminPanel: 'لوحة تحكم الأدمن',
      logout: 'تسجيل الخروج',
      menu: 'القائمة',
      loggingOut: 'جاري تسجيل الخروج...'
    },
    en: {
      home: 'Home',
      categories: 'Categories',
      about: 'About',
      pricing: 'Pricing',
      login: 'Log in',
      signup: 'Sign up',
      dashboard: 'Dashboard',
      myDashboard: 'My Dashboard',
      companyDashboard: 'Company Dashboard',
      adminPanel: 'Admin Panel',
      logout: 'Log Out',
      menu: 'Menu',
      loggingOut: 'Logging out...'
    }
  };

  // Check user role when user changes
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserProfile(null);
        setIsCompanyRepresentative(false);
        return;
      }

      try {
        setCheckingRole(true);
        
        // Fetch user profile including admin status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, is_admin, is_suspended')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setUserProfile(null);
        } else {
          setUserProfile(profileData);
        }

        // Check if user is a company representative
        const { data: repData, error: repError } = await supabase
          .from('company_representatives')
          .select('company_id')
          .eq('profile_id', user.id)
          .limit(1);

        if (repError) {
          console.error('Error checking company representative status:', repError);
          setIsCompanyRepresentative(false);
        } else {
          setIsCompanyRepresentative(repData && repData.length > 0);
        }
      } catch (error) {
        console.error('Error in checkUserRole:', error);
        setUserProfile(null);
        setIsCompanyRepresentative(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [user]);

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await signOut();
      // Navigate to home after successful logout
      handleNavigation('home');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Determine which dashboard links to show based on user role
  const getDashboardLinks = () => {
    const links = [];

    if (userProfile?.is_admin) {
      // Admin users get admin panel link
      links.push({
        label: text[language].adminPanel,
        route: 'admin',
        icon: Shield,
        priority: 1
      });
    }

    if (isCompanyRepresentative) {
      // Company representatives get company dashboard
      links.push({
        label: text[language].companyDashboard,
        route: 'company-dashboard',
        icon: Building2,
        priority: 2
      });
    }

    // All authenticated users get personal dashboard
    links.push({
      label: text[language].myDashboard,
      route: 'dashboard',
      icon: Settings,
      priority: 3
    });

    // Sort by priority and return
    return links.sort((a, b) => a.priority - b.priority);
  };

  const dashboardLinks = getDashboardLinks();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Right side */}
          <button 
            onClick={() => handleNavigation('home')}
            className="flex items-center space-x-2 rtl:space-x-reverse hover:opacity-80 transition-opacity duration-200"
          >
            <img 
              src="/Picture1.png" 
              alt="R8 ESTATE" 
              className="h-10 w-auto"
            />
            <div className="text-xl font-bold">
              <span className="text-accent-500">R8</span>
              <span className="text-primary-500">ESTATE</span>
            </div>
          </button>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            <button 
              onClick={() => handleNavigation('home')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium transition-colors duration-200"
            >
              <Home className="h-4 w-4" />
              <span>{text[language].home}</span>
            </button>
            <button 
              onClick={() => handleNavigation('categories')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium transition-colors duration-200"
            >
              <Grid3X3 className="h-4 w-4" />
              <span>{text[language].categories}</span>
            </button>
            <button 
              onClick={() => handleNavigation('about')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium transition-colors duration-200"
            >
              <Info className="h-4 w-4" />
              <span>{text[language].about}</span>
            </button>
            <button 
              onClick={() => handleNavigation('pricing')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium transition-colors duration-200"
            >
              <CreditCard className="h-4 w-4" />
              <span>{text[language].pricing}</span>
            </button>
            
            {/* Language Switcher */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Globe className="h-4 w-4 text-gray-500" />
              <button
                onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
                className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors duration-200"
              >
                {language === 'ar' ? 'EN' : 'العربية'}
              </button>
            </div>
          </div>

          {/* Right side buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            {!loading && !checkingRole && (
              <>
                {!isAuthenticated ? (
                  // Logged out state - Show Login and Sign up buttons
                  <>
                    <button 
                      onClick={() => handleNavigation('login')}
                      className="btn-secondary text-dark-500 hover:text-primary-500 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      {text[language].login}
                    </button>
                    <button 
                      onClick={() => handleNavigation('signup')}
                      className="btn-primary text-white px-6 py-2 rounded-lg font-medium"
                    >
                      {text[language].signup}
                    </button>
                  </>
                ) : (
                  // Logged in state - Show role-based dashboard links and logout
                  <>
                    {dashboardLinks.map((link, index) => (
                      <button 
                        key={index}
                        onClick={() => handleNavigation(link.route)}
                        className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          link.priority === 1 
                            ? 'bg-red-500 hover:bg-red-600 text-white' // Admin panel - red styling
                            : 'btn-secondary text-dark-500 hover:text-primary-500'
                        }`}
                      >
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </button>
                    ))}
                    
                    <button 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center space-x-2 rtl:space-x-reverse bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{isLoggingOut ? text[language].loggingOut : text[language].logout}</span>
                    </button>
                  </>
                )}
              </>
            )}
            
            {/* Loading state for role checking */}
            {(loading || checkingRole) && isAuthenticated && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-primary-500 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => handleNavigation('home')}
                className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium text-right"
              >
                <Home className="h-4 w-4" />
                <span>{text[language].home}</span>
              </button>
              
              <button 
                onClick={() => handleNavigation('categories')}
                className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium text-right"
              >
                <Grid3X3 className="h-4 w-4" />
                <span>{text[language].categories}</span>
              </button>

              <button 
                onClick={() => handleNavigation('about')}
                className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium text-right"
              >
                <Info className="h-4 w-4" />
                <span>{text[language].about}</span>
              </button>

              <button 
                onClick={() => handleNavigation('pricing')}
                className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium text-right"
              >
                <CreditCard className="h-4 w-4" />
                <span>{text[language].pricing}</span>
              </button>
              
              <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                <Globe className="h-4 w-4 text-gray-500" />
                <button
                  onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
                  className="text-sm font-medium text-gray-600 hover:text-primary-500"
                >
                  {language === 'ar' ? 'EN' : 'العربية'}
                </button>
              </div>

              {/* Mobile Auth Buttons */}
              {!loading && !checkingRole && (
                <>
                  {!isAuthenticated ? (
                    // Logged out state - Show Login and Sign up buttons
                    <>
                      <button 
                        onClick={() => handleNavigation('login')}
                        className="btn-secondary text-dark-500 hover:text-primary-500 px-4 py-2 rounded-lg font-medium text-center"
                      >
                        {text[language].login}
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation('signup')}
                        className="btn-primary text-white px-6 py-2 rounded-lg font-medium text-center"
                      >
                        {text[language].signup}
                      </button>
                    </>
                  ) : (
                    // Logged in state - Show role-based dashboard links and logout
                    <>
                      {dashboardLinks.map((link, index) => (
                        <button 
                          key={index}
                          onClick={() => handleNavigation(link.route)}
                          className={`flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg font-medium ${
                            link.priority === 1 
                              ? 'bg-red-500 hover:bg-red-600 text-white' // Admin panel - red styling
                              : 'btn-secondary text-dark-500 hover:text-primary-500'
                          }`}
                        >
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </button>
                      ))}
                      
                      <button 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{isLoggingOut ? text[language].loggingOut : text[language].logout}</span>
                      </button>
                    </>
                  )}
                </>
              )}
              
              {/* Mobile Loading state for role checking */}
              {(loading || checkingRole) && isAuthenticated && (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                  <span className="text-sm text-gray-600">Loading...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;