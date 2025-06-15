import React, { useState, useEffect } from 'react';
import { Globe, Menu, X, Home, Grid3X3, Settings, LogOut, Building2, Shield, Info, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, getUnreadNotificationCount, getRecentNotifications, Notification } from '../lib/supabase';

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCompanyRepresentative, setIsCompanyRepresentative] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
      loggingOut: 'جاري تسجيل الخروج...',
      notifications: 'الإشعارات',
      seeAllNotifications: 'عرض كل الإشعارات',
      noNotifications: 'لا توجد إشعارات',
      loadingNotifications: 'جاري التحميل...'
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
      loggingOut: 'Logging out...',
      notifications: 'Notifications',
      seeAllNotifications: 'See all notifications',
      noNotifications: 'No notifications',
      loadingNotifications: 'Loading...'
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

  // Fetch notification data when user is authenticated
  useEffect(() => {
    const fetchNotificationData = async () => {
      if (!user) {
        setUnreadCount(0);
        setRecentNotifications([]);
        return;
      }

      try {
        // Fetch unread count
        const count = await getUnreadNotificationCount(user.id);
        setUnreadCount(count);

        // Fetch recent notifications when dropdown is opened
        if (isNotificationDropdownOpen) {
          setLoadingNotifications(true);
          const notifications = await getRecentNotifications(user.id, 4);
          setRecentNotifications(notifications);
          setLoadingNotifications(false);
        }
      } catch (error) {
        console.error('Error fetching notification data:', error);
        setLoadingNotifications(false);
      }
    };

    fetchNotificationData();
  }, [user, isNotificationDropdownOpen]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsMenuOpen(false);
    setIsNotificationDropdownOpen(false);
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (language === 'ar') {
      if (diffMinutes < 1) return 'الآن';
      if (diffMinutes < 60) {
        if (diffMinutes === 1) return 'منذ دقيقة';
        return `منذ ${diffMinutes} دقائق`;
      }
      if (diffHours < 24) {
        if (diffHours === 1) return 'منذ ساعة';
        return `منذ ${diffHours} ساعات`;
      }
      if (diffDays === 1) return 'منذ يوم';
      return `منذ ${diffDays} أيام`;
    } else {
      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
      }
      if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      }
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_review':
        return '⭐';
      case 'new_reply':
        return '💬';
      case 'review_approved':
        return '✔️';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;

    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id)
          .eq('recipient_profile_id', user.id);

        if (!error) {
          // Update local state
          setRecentNotifications(prev => prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          ));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Close dropdown
    setIsNotificationDropdownOpen(false);

    // Navigate to the link if available
    if (notification.link_url) {
      // Parse the link URL and navigate accordingly
      if (notification.link_url.startsWith('/company/')) {
        const companyId = parseInt(notification.link_url.split('/')[2]);
        onNavigate && onNavigate('company', companyId);
      } else if (notification.link_url.startsWith('/dashboard')) {
        onNavigate && onNavigate('dashboard');
      } else {
        // Default navigation
        onNavigate && onNavigate('home');
      }
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
                  // Logged in state - Show notifications, dashboard links and logout
                  <>
                    {/* Notification Bell */}
                    <div className="relative notification-dropdown">
                      <button
                        onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                        className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors duration-200 rounded-lg hover:bg-gray-50"
                      >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Notification Dropdown */}
                      {isNotificationDropdownOpen && (
                        <div className="absolute top-full right-0 rtl:left-0 rtl:right-auto mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                          {/* Header */}
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-dark-500">{text[language].notifications}</h3>
                          </div>

                          {/* Notification List */}
                          <div className="max-h-64 overflow-y-auto">
                            {loadingNotifications ? (
                              <div className="px-4 py-6 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
                                <p className="text-gray-500 text-sm">{text[language].loadingNotifications}</p>
                              </div>
                            ) : recentNotifications.length === 0 ? (
                              <div className="px-4 py-6 text-center">
                                <p className="text-gray-500 text-sm">{text[language].noNotifications}</p>
                              </div>
                            ) : (
                              recentNotifications.map((notification) => (
                                <button
                                  key={notification.id}
                                  onClick={() => handleNotificationClick(notification)}
                                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 text-left"
                                >
                                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                    {/* Icon */}
                                    <div className="text-lg flex-shrink-0 mt-0.5">
                                      {getNotificationIcon(notification.type)}
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-800 leading-relaxed">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatTimeAgo(notification.created_at)}
                                      </p>
                                    </div>
                                    
                                    {/* Unread indicator */}
                                    {!notification.is_read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                    )}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>

                          {/* Footer */}
                          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                            <button
                              onClick={() => handleNavigation('notifications')}
                              className="w-full text-center text-primary-500 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                            >
                              {text[language].seeAllNotifications}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dashboard Links */}
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
                    // Logged in state - Show notifications, dashboard links and logout
                    <>
                      {/* Mobile Notifications */}
                      <button
                        onClick={() => handleNavigation('notifications')}
                        className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg font-medium btn-secondary text-dark-500 hover:text-primary-500 relative"
                      >
                        <Bell className="h-4 w-4" />
                        <span>{text[language].notifications}</span>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Mobile Dashboard Links */}
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