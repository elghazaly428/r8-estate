import React, { useState, useEffect } from 'react';
import { Bell, Check, MessageSquare, ThumbsUp, Star, Building2, User, Clock } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { 
  getAllNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  Notification 
} from '../lib/supabase';

interface NotificationsProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const text = {
    ar: {
      notifications: 'الإشعارات',
      markAllAsRead: 'تحديد الكل كمقروء',
      noNotifications: 'لا توجد إشعارات',
      noNotificationsDesc: 'ستظهر إشعاراتك هنا عندما تتفاعل مع المنصة',
      unreadNotifications: 'الإشعارات غير المقروءة',
      allNotifications: 'جميع الإشعارات',
      markAsRead: 'تحديد كمقروء',
      markAsUnread: 'تحديد كغير مقروء',
      loading: 'جاري التحميل...',
      loadMore: 'تحميل المزيد',
      markingAsRead: 'جاري التحديد...',
      loginRequired: 'يجب تسجيل الدخول لعرض الإشعارات',
      loginButton: 'تسجيل الدخول'
    },
    en: {
      notifications: 'Notifications',
      markAllAsRead: 'Mark all as read',
      noNotifications: 'No notifications',
      noNotificationsDesc: 'Your notifications will appear here when you interact with the platform',
      unreadNotifications: 'Unread notifications',
      allNotifications: 'All notifications',
      markAsRead: 'Mark as read',
      markAsUnread: 'Mark as unread',
      loading: 'Loading...',
      loadMore: 'Load more',
      markingAsRead: 'Marking as read...',
      loginRequired: 'Please log in to view notifications',
      loginButton: 'Log In'
    }
  };

  // Fetch notifications when component mounts or user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      // Wait for auth to load
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getAllNotifications(user.id, currentPage, pageSize);
        setNotifications(result.notifications);
        setTotalCount(result.totalCount);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, authLoading, currentPage]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'new_reply':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'review_approved':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'vote':
        return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case 'company':
        return <Building2 className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
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

  const handleMarkAllAsRead = async () => {
    if (!user || markingAllAsRead) return;

    setMarkingAllAsRead(true);
    try {
      const result = await markAllNotificationsAsRead(user.id);
      if (result.success) {
        setNotifications(prev => prev.map(notification => ({
          ...notification,
          is_read: true
        })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;

    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        const result = await markNotificationAsRead(notification.id, user.id);
        if (result.success) {
          setNotifications(prev => prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          ));
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to the link if available
    if (notification.link_url) {
      // Parse the link URL and navigate accordingly
      if (notification.link_url.startsWith('/company/')) {
        const companyId = parseInt(notification.link_url.split('/')[2]);
        onNavigate('company', companyId);
      } else if (notification.link_url.startsWith('/dashboard')) {
        onNavigate('dashboard');
      } else {
        // Default navigation
        onNavigate('home');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        </div>
        <Footer language={language} onNavigate={onNavigate} />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-3xl mx-auto mb-6">
              <Bell className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold text-dark-500 mb-2">
              {text[language].loginRequired}
            </h1>
            <button
              onClick={() => onNavigate('login')}
              className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
            >
              {text[language].loginButton}
            </button>
          </div>
        </div>
        <Footer language={language} onNavigate={onNavigate} />
      </div>
    );
  }

  // Notification Item Component
  const NotificationItem: React.FC<{ notification: Notification; onClick: () => void }> = ({ notification, onClick }) => (
    <button
      onClick={onClick}
      className="w-full px-6 py-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 text-left"
    >
      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        {/* Icon (Left Side) */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        </div>
        
        {/* Text Content (Middle) */}
        <div className="flex-1 min-w-0">
          {/* Top Line: Message */}
          <p className={`text-sm leading-relaxed ${notification.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
            {notification.message}
          </p>
          {/* Bottom Line: Timestamp */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>
        </div>
        
        {/* Unread Indicator (Right Side) */}
        {!notification.is_read && (
          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
        )}
      </div>
    </button>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark-500 mb-2 flex items-center space-x-3 rtl:space-x-reverse">
              <Bell className="h-8 w-8 text-primary-500" />
              <span>{text[language].notifications}</span>
            </h1>
            <div className="w-16 h-1 bg-primary-500 rounded-full"></div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllAsRead}
              className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              <span>{markingAllAsRead ? text[language].markingAsRead : text[language].markAllAsRead}</span>
            </button>
          )}
        </div>

        {loading ? (
          /* Loading State */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-3xl mx-auto mb-6">
              <Bell className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold text-dark-500 mb-2">
              {text[language].noNotifications}
            </h3>
            <p className="text-gray-600">
              {text[language].noNotificationsDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unread Notifications Section */}
            {unreadNotifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                  <h2 className="text-lg font-bold text-dark-500 flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{text[language].unreadNotifications} ({unreadCount})</span>
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Notifications Section */}
            {readNotifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-dark-500">
                    {text[language].allNotifications}
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Load More Button */}
            {notifications.length < totalCount && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  {text[language].loadMore}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default Notifications;