import React, { useState } from 'react';
import { Bell, Check, MessageSquare, ThumbsUp, Star, Building2, User, Clock } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface NotificationsProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

interface NotificationItem {
  id: number;
  type: 'reply' | 'vote' | 'review' | 'company' | 'system';
  icon: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

const Notifications: React.FC<NotificationsProps> = ({ language, onLanguageChange, onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      type: 'reply',
      icon: '💬',
      message: language === 'ar' ? 'شركة العقارات المتميزة ردت على تقييمك' : 'Premium Real Estate replied to your review',
      timestamp: language === 'ar' ? 'منذ ٥ دقائق' : '5 minutes ago',
      isRead: false
    },
    {
      id: 2,
      type: 'vote',
      icon: '👍',
      message: language === 'ar' ? 'أحد المستخدمين وجد تقييمك مفيداً' : 'Someone found your review helpful',
      timestamp: language === 'ar' ? 'منذ ١٥ دقيقة' : '15 minutes ago',
      isRead: false
    },
    {
      id: 3,
      type: 'review',
      icon: '⭐',
      message: language === 'ar' ? 'تم نشر تقييمك بنجاح' : 'Your review has been published',
      timestamp: language === 'ar' ? 'منذ ساعة' : '1 hour ago',
      isRead: false
    },
    {
      id: 4,
      type: 'company',
      icon: '🏢',
      message: language === 'ar' ? 'شركة جديدة انضمت إلى المنصة' : 'A new company joined the platform',
      timestamp: language === 'ar' ? 'منذ ٣ ساعات' : '3 hours ago',
      isRead: true
    },
    {
      id: 5,
      type: 'system',
      icon: '🔔',
      message: language === 'ar' ? 'تم تحديث شروط الاستخدام' : 'Terms of service have been updated',
      timestamp: language === 'ar' ? 'منذ يوم' : '1 day ago',
      isRead: true
    },
    {
      id: 6,
      type: 'reply',
      icon: '💬',
      message: language === 'ar' ? 'مجموعة الإسكان الحديث ردت على تقييمك' : 'Modern Housing Group replied to your review',
      timestamp: language === 'ar' ? 'منذ يومين' : '2 days ago',
      isRead: true
    },
    {
      id: 7,
      type: 'vote',
      icon: '👍',
      message: language === 'ar' ? 'حصل تقييمك على ١٠ إعجابات' : 'Your review received 10 likes',
      timestamp: language === 'ar' ? 'منذ ٣ أيام' : '3 days ago',
      isRead: true
    },
    {
      id: 8,
      type: 'review',
      icon: '⭐',
      message: language === 'ar' ? 'تذكير: اكتب تقييماً لشركة التطوير العقاري الذكي' : 'Reminder: Write a review for Smart Real Estate Development',
      timestamp: language === 'ar' ? 'منذ أسبوع' : '1 week ago',
      isRead: true
    }
  ]);

  const text = {
    ar: {
      notifications: 'الإشعارات',
      markAllAsRead: 'تحديد الكل كمقروء',
      noNotifications: 'لا توجد إشعارات',
      noNotificationsDesc: 'ستظهر إشعاراتك هنا عندما تتفاعل مع المنصة',
      unreadNotifications: 'الإشعارات غير المقروءة',
      allNotifications: 'جميع الإشعارات',
      markAsRead: 'تحديد كمقروء',
      markAsUnread: 'تحديد كغير مقروء'
    },
    en: {
      notifications: 'Notifications',
      markAllAsRead: 'Mark all as read',
      noNotifications: 'No notifications',
      noNotificationsDesc: 'Your notifications will appear here when you interact with the platform',
      unreadNotifications: 'Unread notifications',
      allNotifications: 'All notifications',
      markAsRead: 'Mark as read',
      markAsUnread: 'Mark as unread'
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reply':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'vote':
        return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'company':
        return <Building2 className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

  const toggleNotificationRead = (id: number) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, isRead: !notification.isRead }
        : notification
    ));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

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
              onClick={markAllAsRead}
              className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <Check className="h-4 w-4" />
              <span>{text[language].markAllAsRead}</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
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
                    <div
                      key={notification.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => toggleNotificationRead(notification.id)}
                    >
                      <div className="flex items-start space-x-4 rtl:space-x-reverse">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-800 font-medium leading-relaxed">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  {notification.timestamp}
                                </span>
                              </div>
                            </div>
                            
                            {/* Unread indicator */}
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <div
                      key={notification.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer opacity-75"
                      onClick={() => toggleNotificationRead(notification.id)}
                    >
                      <div className="flex items-start space-x-4 rtl:space-x-reverse">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-600 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {notification.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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