import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  ChevronDown,
  Star,
  User,
  Calendar,
  Search,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalReviews: number;
  pendingReports: number;
}

interface ReviewData {
  id: number;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  status: 'published' | 'hidden' | 'deleted' | null;
  created_at: string;
  is_anonymous: boolean | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  companies: {
    name: string | null;
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });

  // Reviews state
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewData[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'deleted'>('all');
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewData | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const text = {
    ar: {
      adminDashboard: 'لوحة تحكم الأدمن',
      overview: 'نظرة عامة',
      users: 'المستخدمين',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      // Reviews specific
      filterByStatus: 'تصفية حسب الحالة',
      all: 'الكل',
      published: 'منشور',
      hidden: 'مخفي',
      deleted: 'محذوف',
      author: 'الكاتب',
      company: 'الشركة',
      reviewTitle: 'عنوان التقييم',
      rating: 'التقييم',
      status: 'الحالة',
      createdDate: 'تاريخ الإنشاء',
      actions: 'الإجراءات',
      hide: 'إخفاء',
      unhide: 'إظهار',
      delete: 'حذف',
      anonymous: 'مجهول',
      noTitle: 'بدون عنوان',
      unknownCompany: 'شركة غير معروفة',
      confirmHide: 'هل أنت متأكد من إخفاء هذا التقييم؟',
      confirmUnhide: 'هل أنت متأكد من إظهار هذا التقييم؟',
      confirmDelete: 'تأكيد الحذف',
      deleteWarning: 'هذا الإجراء سيحذف التقييم نهائياً. اكتب "DELETE" للتأكيد:',
      typeDelete: 'اكتب DELETE',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      reviewHidden: 'تم إخفاء التقييم بنجاح',
      reviewUnhidden: 'تم إظهار التقييم بنجاح',
      reviewDeleted: 'تم حذف التقييم بنجاح',
      errorOccurred: 'حدث خطأ',
      deleting: 'جاري الحذف...',
      noReviews: 'لا توجد تقييمات'
    },
    en: {
      adminDashboard: 'Admin Dashboard',
      overview: 'Overview',
      users: 'Users',
      companies: 'Companies',
      reviews: 'Reviews',
      reports: 'Reports',
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      // Reviews specific
      filterByStatus: 'Filter by Status',
      all: 'All',
      published: 'Published',
      hidden: 'Hidden',
      deleted: 'Deleted',
      author: 'Author',
      company: 'Company',
      reviewTitle: 'Review Title',
      rating: 'Rating',
      status: 'Status',
      createdDate: 'Created Date',
      actions: 'Actions',
      hide: 'Hide',
      unhide: 'Unhide',
      delete: 'Delete',
      anonymous: 'Anonymous',
      noTitle: 'No Title',
      unknownCompany: 'Unknown Company',
      confirmHide: 'Are you sure you want to hide this review?',
      confirmUnhide: 'Are you sure you want to unhide this review?',
      confirmDelete: 'Confirm Delete',
      deleteWarning: 'This action will permanently delete the review. Type "DELETE" to confirm:',
      typeDelete: 'Type DELETE',
      cancel: 'Cancel',
      confirm: 'Confirm',
      reviewHidden: 'Review hidden successfully',
      reviewUnhidden: 'Review unhidden successfully',
      reviewDeleted: 'Review deleted successfully',
      errorOccurred: 'An error occurred',
      deleting: 'Deleting...',
      noReviews: 'No reviews found'
    }
  };

  // Check admin access and fetch data
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        onNavigate('login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if user is admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData?.is_admin) {
          onNavigate('dashboard');
          return;
        }

        // Fetch admin stats
        await fetchAdminStats();
        
        // Fetch reviews if on reviews tab
        if (activeTab === 'reviews') {
          await fetchReviews();
        }
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate, activeTab]);

  // Fetch reviews when tab changes to reviews
  useEffect(() => {
    if (activeTab === 'reviews' && user) {
      fetchReviews();
    }
  }, [activeTab, user]);

  // Filter reviews when status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(review => review.status === statusFilter));
    }
  }, [reviews, statusFilter]);

  const fetchAdminStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Fetch total reviews
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Fetch pending reports
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'received');

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: reportsCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          body,
          overall_rating,
          status,
          created_at,
          is_anonymous,
          profiles!reviews_profile_id_fkey(first_name, last_name),
          companies!reviews_company_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReviews(data || []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleHideReview = async (reviewId: number) => {
    if (!confirm(text[language].confirmHide)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'hidden' })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'hidden' as const } : review
      ));

      toast.success(text[language].reviewHidden);
    } catch (error: any) {
      console.error('Error hiding review:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleUnhideReview = async (reviewId: number) => {
    if (!confirm(text[language].confirmUnhide)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'published' })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'published' as const } : review
      ));

      toast.success(text[language].reviewUnhidden);
    } catch (error: any) {
      console.error('Error unhiding review:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete || deleteConfirmText !== 'DELETE') return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'deleted' })
        .eq('id', reviewToDelete.id);

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewToDelete.id ? { ...review, status: 'deleted' as const } : review
      ));

      toast.success(text[language].reviewDeleted);
      setShowDeleteModal(false);
      setReviewToDelete(null);
      setDeleteConfirmText('');
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (review: ReviewData) => {
    setReviewToDelete(review);
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setReviewToDelete(null);
    setDeleteConfirmText('');
  };

  const renderStars = (rating: number | null) => {
    const stars = [];
    const ratingValue = rating || 0;
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < ratingValue ? 'fill-current text-yellow-500' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
            {text[language].published}
          </span>
        );
      case 'hidden':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <EyeOff className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
            {text[language].hidden}
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
            {text[language].deleted}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getAuthorName = (review: ReviewData) => {
    if (review.is_anonymous) {
      return text[language].anonymous;
    }
    
    if (review.profiles) {
      const firstName = review.profiles.first_name || '';
      const lastName = review.profiles.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || text[language].anonymous;
    }
    
    return text[language].anonymous;
  };

  // Reviews View Component
  const ReviewsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reviews}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Filter className="h-5 w-5 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">
            {text[language].filterByStatus}:
          </label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'hidden' | 'deleted')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
            >
              <option value="all">{text[language].all}</option>
              <option value="published">{text[language].published}</option>
              <option value="hidden">{text[language].hidden}</option>
              <option value="deleted">{text[language].deleted}</option>
            </select>
            <ChevronDown className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loadingReviews ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{text[language].noReviews}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].author}
                  </th>
                  <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].company}
                  </th>
                  <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].reviewTitle}
                  </th>
                  <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].rating}
                  </th>
                  <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].status}
                  </th>
                  <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].createdDate}
                  </th>
                  <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {getAuthorName(review)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {review.companies?.name || text[language].unknownCompany}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {review.title || text[language].noTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        {renderStars(review.overall_rating)}
                        <span className="text-sm text-gray-600 ml-2 rtl:mr-2 rtl:ml-0">
                          ({review.overall_rating || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(review.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {formatDate(review.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {review.status === 'published' && (
                          <button
                            onClick={() => handleHideReview(review.id)}
                            className="inline-flex items-center px-3 py-1 border border-yellow-300 text-yellow-700 bg-yellow-50 rounded-md text-sm font-medium hover:bg-yellow-100 transition-colors duration-200"
                          >
                            <EyeOff className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                            {text[language].hide}
                          </button>
                        )}
                        
                        {review.status === 'hidden' && (
                          <button
                            onClick={() => handleUnhideReview(review.id)}
                            className="inline-flex items-center px-3 py-1 border border-green-300 text-green-700 bg-green-50 rounded-md text-sm font-medium hover:bg-green-100 transition-colors duration-200"
                          >
                            <Eye className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                            {text[language].unhide}
                          </button>
                        )}
                        
                        {review.status !== 'deleted' && (
                          <button
                            onClick={() => openDeleteModal(review)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 bg-red-50 rounded-md text-sm font-medium hover:bg-red-100 transition-colors duration-200"
                          >
                            <Trash2 className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                            {text[language].delete}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        </div>
        <Footer language={language} onNavigate={onNavigate} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-dark-500 mb-2">
              {text[language].accessDenied}
            </h1>
            <p className="text-gray-600 mb-6">
              {text[language].notAuthorized}
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
            >
              {text[language].backToDashboard}
            </button>
          </div>
        </div>
        <Footer language={language} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">{text[language].overview}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{text[language].users}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'companies'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{text[language].companies}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reviews'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">{text[language].reviews}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">{text[language].reports}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-dark-500 mb-2">
                    {text[language].adminDashboard}
                  </h1>
                  <div className="w-16 h-1 bg-red-500 rounded-full"></div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalUsers}</h3>
                    <p className="text-gray-600 text-sm">{text[language].totalUsers}</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalCompanies}</h3>
                    <p className="text-gray-600 text-sm">{text[language].totalCompanies}</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalReviews}</h3>
                    <p className="text-gray-600 text-sm">{text[language].totalReviews}</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.pendingReports}</h3>
                    <p className="text-gray-600 text-sm">{text[language].pendingReports}</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && <ReviewsView />}
            
            {/* Placeholder for other tabs */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Users management coming soon...</p>
              </div>
            )}
            
            {activeTab === 'companies' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Companies management coming soon...</p>
              </div>
            )}
            
            {activeTab === 'reports' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Reports management coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500 flex items-center space-x-2 rtl:space-x-reverse">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>{text[language].confirmDelete}</span>
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                {text[language].deleteWarning}
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={text[language].typeDelete}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isDeleting}
              />
            </div>

            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isDeleting}
              >
                {text[language].cancel}
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{text[language].deleting}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>{text[language].confirm}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default AdminDashboard;