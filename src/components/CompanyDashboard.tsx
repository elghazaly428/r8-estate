import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Building2, 
  CreditCard, 
  Star, 
  TrendingUp, 
  Calendar, 
  Users,
  Filter,
  Search,
  ChevronDown,
  Reply,
  Upload,
  Save,
  ExternalLink,
  User,
  ThumbsUp,
  Flag,
  Share2,
  Send,
  Edit,
  X,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { supabase, CompanyWithCategory, ReviewWithProfile } from '../lib/supabase';

interface CompanyDashboardProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number) => void;
}

interface CompanyStats {
  totalReviews: number;
  averageRating: number;
  newReviewsThisMonth: number;
  responseRate: number;
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'profile' | 'subscription'>('overview');
  const [company, setCompany] = useState<CompanyWithCategory | null>(null);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [stats, setStats] = useState<CompanyStats>({
    totalReviews: 0,
    averageRating: 0,
    newReviewsThisMonth: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    logoUrl: '',
    website: '',
    description: ''
  });
  
  // Reply states
  const [replyingToReviewId, setReplyingToReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  const text = {
    ar: {
      // Navigation
      overview: 'نظرة عامة',
      reviews: 'التقييمات',
      companyProfile: 'الملف الشخصي للشركة',
      subscription: 'الاشتراك',
      viewPublicProfile: 'عرض الملف الشخصي العام',
      
      // Overview
      totalReviews: 'إجمالي التقييمات',
      averageRating: 'متوسط التقييم',
      newReviewsThisMonth: 'التقييمات الجديدة هذا الشهر',
      responseRate: 'معدل الاستجابة',
      recentReviews: 'التقييمات الحديثة',
      viewAll: 'عرض الكل',
      
      // Reviews
      filterReviews: 'تصفية التقييمات',
      sortBy: 'ترتيب حسب',
      newest: 'الأحدث',
      oldest: 'الأقدم',
      highest: 'الأعلى تقييماً',
      lowest: 'الأقل تقييماً',
      allRatings: 'جميع التقييمات',
      searchReviews: 'البحث في التقييمات',
      reply: 'رد',
      editReply: 'تعديل الرد',
      helpful: 'مفيد',
      share: 'مشاركة',
      report: 'إبلاغ',
      anonymous: 'مجهول',
      daysAgo: 'منذ',
      day: 'يوم',
      companyReply: 'رد الشركة',
      writeReply: 'اكتب رداً...',
      submitReply: 'إرسال الرد',
      cancel: 'إلغاء',
      save: 'حفظ',
      
      // Company Profile
      editCompanyProfile: 'تعديل الملف الشخصي للشركة',
      companyLogo: 'شعار الشركة',
      logoUrl: 'رابط الشعار',
      websiteUrl: 'رابط الموقع الإلكتروني',
      companyDescription: 'وصف الشركة',
      descriptionPlaceholder: 'اكتب وصفاً شاملاً عن شركتك وخدماتها...',
      uploadLogo: 'رفع شعار',
      saveChanges: 'حفظ التغييرات',
      
      // Subscription
      manageSubscription: 'إدارة الاشتراك',
      currentPlan: 'الخطة الحالية',
      proPlan: 'خطة احترافية',
      nextRenewal: 'التجديد التالي',
      manageBilling: 'إدارة الفواتير',
      planFeatures: 'مميزات الخطة',
      unlimitedReplies: 'ردود غير محدودة',
      advancedAnalytics: 'تحليلات متقدمة',
      prioritySupport: 'دعم أولوية',
      customBranding: 'علامة تجارية مخصصة',
      
      // Messages
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      replySubmitted: 'تم إرسال الرد بنجاح',
      replyUpdated: 'تم تحديث الرد بنجاح',
      profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
      errorOccurred: 'حدث خطأ',
      submitting: 'جاري الإرسال...',
      updating: 'جاري التحديث...'
    },
    en: {
      // Navigation
      overview: 'Overview',
      reviews: 'Reviews',
      companyProfile: 'Company Profile',
      subscription: 'Subscription',
      viewPublicProfile: 'View Public Profile',
      
      // Overview
      totalReviews: 'Total Reviews',
      averageRating: 'Average Rating',
      newReviewsThisMonth: 'New Reviews This Month',
      responseRate: 'Response Rate',
      recentReviews: 'Recent Reviews',
      viewAll: 'View All',
      
      // Reviews
      filterReviews: 'Filter Reviews',
      sortBy: 'Sort by',
      newest: 'Newest',
      oldest: 'Oldest',
      highest: 'Highest Rated',
      lowest: 'Lowest Rated',
      allRatings: 'All Ratings',
      searchReviews: 'Search reviews',
      reply: 'Reply',
      editReply: 'Edit Reply',
      helpful: 'Helpful',
      share: 'Share',
      report: 'Report',
      anonymous: 'Anonymous',
      daysAgo: '',
      day: 'day ago',
      companyReply: 'Company Reply',
      writeReply: 'Write a reply...',
      submitReply: 'Submit Reply',
      cancel: 'Cancel',
      save: 'Save',
      
      // Company Profile
      editCompanyProfile: 'Edit Company Profile',
      companyLogo: 'Company Logo',
      logoUrl: 'Logo URL',
      websiteUrl: 'Website URL',
      companyDescription: 'Company Description',
      descriptionPlaceholder: 'Write a comprehensive description of your company and services...',
      uploadLogo: 'Upload Logo',
      saveChanges: 'Save Changes',
      
      // Subscription
      manageSubscription: 'Manage Subscription',
      currentPlan: 'Current Plan',
      proPlan: 'Pro Plan',
      nextRenewal: 'Next Renewal',
      manageBilling: 'Manage Billing',
      planFeatures: 'Plan Features',
      unlimitedReplies: 'Unlimited Replies',
      advancedAnalytics: 'Advanced Analytics',
      prioritySupport: 'Priority Support',
      customBranding: 'Custom Branding',
      
      // Messages
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      replySubmitted: 'Reply submitted successfully',
      replyUpdated: 'Reply updated successfully',
      profileUpdated: 'Profile updated successfully',
      errorOccurred: 'An error occurred',
      submitting: 'Submitting...',
      updating: 'Updating...'
    }
  };

  // CRITICAL SECURITY: Check access and fetch data
  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      // Step A: Wait for auth to load
      if (authLoading) return;
      
      // Step A: Get current user
      if (!user) {
        onNavigate('login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Step B: Perform strict query - check if user is a company representative
        const { data: representativeDataArray, error: repError } = await supabase
          .from('company_representatives')
          .select('company_id')
          .eq('profile_id', user.id) // STRICT filter: only exact match with current user ID
          .limit(1);

        if (repError) {
          console.error('Error checking company representative:', repError);
          throw repError;
        }

        // Step C: Implement access control logic
        if (!representativeDataArray || representativeDataArray.length === 0) {
          // NO MATCH found - user is not a company representative
          // Immediately redirect to standard user dashboard
          onNavigate('dashboard');
          return;
        }

        // ONLY proceed if record is found - user is authorized
        const companyId = representativeDataArray[0].company_id;

        // Fetch company details with category
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*, categories(id, name, description)')
          .eq('id', companyId)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData);

        // Set profile form with company data
        setProfileForm({
          logoUrl: companyData.logo_url || '',
          website: companyData.website || '',
          description: companyData.description || ''
        });

        // Fetch reviews for this company
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles!reviews_profile_id_fkey(first_name, last_name),
            company_replies(id, reply_body, created_at)
          `)
          .eq('company_id', companyId)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;
        setReviews(reviewsData || []);

        // Calculate stats
        const totalReviews = reviewsData?.length || 0;
        const validRatings = reviewsData?.filter(r => r.overall_rating !== null) || [];
        const averageRating = validRatings.length > 0 
          ? validRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / validRatings.length 
          : 0;

        // Calculate new reviews this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const newReviewsThisMonth = reviewsData?.filter(r => {
          const reviewDate = new Date(r.created_at);
          return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
        }).length || 0;

        // Calculate response rate
        const reviewsWithReplies = reviewsData?.filter(r => r.company_replies && r.company_replies.length > 0).length || 0;
        const responseRate = totalReviews > 0 ? Math.round((reviewsWithReplies / totalReviews) * 100) : 0;

        setStats({
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          newReviewsThisMonth,
          responseRate
        });

      } catch (error: any) {
        console.error('Error fetching company dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchData();
  }, [user, authLoading, onNavigate]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-current text-highlight-500' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (language === 'ar') {
      if (diffDays === 1) return 'منذ يوم واحد';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;
      if (diffDays < 30) return `منذ ${Math.ceil(diffDays / 7)} أسابيع`;
      return `منذ ${Math.ceil(diffDays / 30)} شهور`;
    } else {
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    }
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (!replyText.trim() || !user) return;

    setSubmittingReply(true);

    try {
      const { data, error } = await supabase
        .from('company_replies')
        .insert([{
          review_id: reviewId,
          reply_body: replyText.trim(),
          profile_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Update reviews state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, company_replies: [data] }
          : review
      ));

      setReplyingToReviewId(null);
      setReplyText('');
      toast.success(text[language].replySubmitted);
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReplyUpdate = async (replyId: string) => {
    if (!editReplyText.trim()) return;

    setSubmittingReply(true);

    try {
      const { error } = await supabase
        .from('company_replies')
        .update({ reply_body: editReplyText.trim() })
        .eq('id', replyId);

      if (error) throw error;

      // Update reviews state
      setReviews(prev => prev.map(review => ({
        ...review,
        company_replies: review.company_replies?.map(reply => 
          reply.id === replyId 
            ? { ...reply, reply_body: editReplyText.trim() }
            : reply
        )
      })));

      setEditingReplyId(null);
      setEditReplyText('');
      toast.success(text[language].replyUpdated);
    } catch (error: any) {
      console.error('Error updating reply:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) return;

    setSubmittingReply(true);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          logo_url: profileForm.logoUrl.trim() || null,
          website: profileForm.website.trim() || null,
          description: profileForm.description.trim() || null
        })
        .eq('id', company.id);

      if (error) throw error;

      // Update company state
      setCompany(prev => prev ? {
        ...prev,
        logo_url: profileForm.logoUrl.trim() || null,
        website: profileForm.website.trim() || null,
        description: profileForm.description.trim() || null
      } : null);

      toast.success(text[language].profileUpdated);
    } catch (error: any) {
      console.error('Error updating company profile:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        </div>
        <Footer language={language} />
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
        <Footer language={language} />
      </div>
    );
  }

  // Overview View
  const OverviewView = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].overview}
        </h1>
        <div className="w-16 h-1 bg-primary-500 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalReviews}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.averageRating}</h3>
          <p className="text-gray-600 text-sm">{text[language].averageRating}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.newReviewsThisMonth}</h3>
          <p className="text-gray-600 text-sm">{text[language].newReviewsThisMonth}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.responseRate}%</h3>
          <p className="text-gray-600 text-sm">{text[language].responseRate}</p>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-500">
            {text[language].recentReviews}
          </h2>
          <button 
            onClick={() => setActiveTab('reviews')}
            className="text-primary-500 hover:text-primary-600 transition-colors duration-200 text-sm font-medium"
          >
            {text[language].viewAll}
          </button>
        </div>

        <div className="space-y-4">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-500 text-sm">
                      {review.is_anonymous 
                        ? text[language].anonymous
                        : review.profiles 
                          ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || text[language].anonymous
                          : text[language].anonymous
                      }
                    </h4>
                    <p className="text-gray-500 text-xs">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {renderStars(Math.round(review.overall_rating || 0))}
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {review.body || review.title || 'No review text provided'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Reviews View
  const ReviewsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reviews}
        </h1>
        <div className="w-16 h-1 bg-primary-500 rounded-full"></div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
          {/* Rating Filter */}
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
              <option>{text[language].allRatings}</option>
              <option>5 نجوم</option>
              <option>4 نجوم</option>
              <option>3 نجوم</option>
              <option>2 نجوم</option>
              <option>1 نجمة</option>
            </select>
            <ChevronDown className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={text[language].searchReviews}
              className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
              <option>{text[language].newest}</option>
              <option>{text[language].oldest}</option>
              <option>{text[language].highest}</option>
              <option>{text[language].lowest}</option>
            </select>
            <ChevronDown className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-dark-500">
                    {review.is_anonymous 
                      ? text[language].anonymous
                      : review.profiles 
                        ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || text[language].anonymous
                        : text[language].anonymous
                    }
                  </h4>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      {renderStars(Math.round(review.overall_rating || 0))}
                    </div>
                    <span className="text-gray-500 text-sm">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Content */}
            <div className="mb-4">
              {review.title && (
                <h3 className="font-semibold text-dark-500 mb-2">
                  {review.title}
                </h3>
              )}
              {review.body && (
                <p className="text-gray-700 leading-relaxed">
                  {review.body}
                </p>
              )}
            </div>

            {/* Company Reply Section */}
            {review.company_replies && review.company_replies.length > 0 ? (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">{text[language].companyReply}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingReplyId(review.company_replies![0].id);
                      setEditReplyText(review.company_replies![0].reply_body || '');
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <Edit className="h-3 w-3" />
                    <span>{text[language].editReply}</span>
                  </button>
                </div>
                
                {editingReplyId === review.company_replies[0].id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editReplyText}
                      onChange={(e) => setEditReplyText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      disabled={submittingReply}
                    />
                    <div className="flex space-x-3 rtl:space-x-reverse">
                      <button
                        onClick={() => {
                          setEditingReplyId(null);
                          setEditReplyText('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        disabled={submittingReply}
                      >
                        {text[language].cancel}
                      </button>
                      <button
                        onClick={() => handleReplyUpdate(review.company_replies![0].id)}
                        disabled={!editReplyText.trim() || submittingReply}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 rtl:space-x-reverse"
                      >
                        {submittingReply ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{text[language].updating}</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>{text[language].save}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {review.company_replies[0].reply_body}
                  </p>
                )}
              </div>
            ) : (
              // Reply Form
              replyingToReviewId === review.id ? (
                <div className="bg-gray-50 p-4 mt-4 rounded-lg">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={text[language].writeReply}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 mb-3"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    disabled={submittingReply}
                  />
                  <div className="flex space-x-3 rtl:space-x-reverse">
                    <button
                      onClick={() => {
                        setReplyingToReviewId(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      disabled={submittingReply}
                    >
                      {text[language].cancel}
                    </button>
                    <button
                      onClick={() => handleReplySubmit(review.id)}
                      disabled={!replyText.trim() || submittingReply}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 rtl:space-x-reverse"
                    >
                      {submittingReply ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>{text[language].submitting}</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>{text[language].submitReply}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setReplyingToReviewId(review.id);
                      setReplyText('');
                    }}
                    className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <Reply className="h-4 w-4" />
                    <span>{text[language].reply}</span>
                  </button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Company Profile View
  const CompanyProfileView = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].editCompanyProfile}
        </h1>
        <div className="w-16 h-1 bg-primary-500 rounded-full"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleProfileUpdate} className="space-y-8">
          {/* Company Logo Section */}
          <div>
            <h2 className="text-xl font-bold text-dark-500 mb-6 flex items-center space-x-2 rtl:space-x-reverse">
              <Building2 className="h-5 w-5 text-primary-500" />
              <span>{text[language].companyLogo}</span>
            </h2>
            
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
                {company?.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt="Company Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  '🏢'
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="logoUrl" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].logoUrl}
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  value={profileForm.logoUrl}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  dir="ltr"
                  disabled={submittingReply}
                />
              </div>
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-semibold text-dark-500 mb-2">
              {text[language].websiteUrl}
            </label>
            <input
              type="url"
              id="websiteUrl"
              value={profileForm.website}
              onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.yourcompany.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              dir="ltr"
              disabled={submittingReply}
            />
          </div>

          {/* Company Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-dark-500 mb-2">
              {text[language].companyDescription}
            </label>
            <textarea
              id="description"
              rows={8}
              value={profileForm.description}
              onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={text[language].descriptionPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-vertical"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              disabled={submittingReply}
            />
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={submittingReply}
              className="btn-primary text-white px-8 py-3 rounded-lg font-semibold hover-lift flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingReply ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{text[language].updating}</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{text[language].saveChanges}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Subscription View
  const SubscriptionView = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].manageSubscription}
        </h1>
        <div className="w-16 h-1 bg-primary-500 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-dark-500">
              {text[language].currentPlan}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">{text[language].currentPlan}:</span>
              <span className="font-semibold text-dark-500">{text[language].proPlan}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">{text[language].nextRenewal}:</span>
              <span className="font-semibold text-dark-500">15 يناير 2024</span>
            </div>
            
            <div className="pt-4">
              <button className="w-full btn-primary text-white py-3 px-6 rounded-lg font-semibold hover-lift flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <ExternalLink className="h-4 w-4" />
                <span>{text[language].manageBilling}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-dark-500">
              {text[language].planFeatures}
            </h2>
          </div>

          <div className="space-y-4">
            {[
              text[language].unlimitedReplies,
              text[language].advancedAnalytics,
              text[language].prioritySupport,
              text[language].customBranding
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">{text[language].overview}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reviews'
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">{text[language].reviews}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{text[language].companyProfile}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'subscription'
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">{text[language].subscription}</span>
                </button>

                {/* View Public Profile Link */}
                <button
                  onClick={() => company && onNavigate('company', company.id)}
                  className="w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 text-gray-700 hover:bg-gray-50 border-t border-gray-100 mt-4 pt-4"
                >
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">{text[language].viewPublicProfile}</span>
                  <ExternalLink className="h-4 w-4 ml-auto rtl:mr-auto rtl:ml-0" />
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'reviews' && <ReviewsView />}
            {activeTab === 'profile' && <CompanyProfileView />}
            {activeTab === 'subscription' && <SubscriptionView />}
          </div>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default CompanyDashboard;