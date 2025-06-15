import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ExternalLink, 
  Filter, 
  Search, 
  ChevronDown, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Flag,
  User,
  Calendar,
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  X,
  AlertTriangle,
  CheckCircle,
  Shield,
  Award,
  MessageSquare,
  Send,
  Edit,
  Save
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { 
  supabase, 
  getCompanyWithCategoryById, 
  getReviewsByCompanyId,
  toggleReviewVote,
  toggleReplyVote,
  submitReport,
  submitReplyReport,
  isCompanyRepresentative,
  submitCompanyReply,
  claimCompany,
  Profile, 
  CompanyWithCategory,
  ReviewWithProfile
} from '../lib/supabase';

interface CompanyProfileProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number) => void;
  companyId?: number | null;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ language, onLanguageChange, onNavigate, companyId }) => {
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [company, setCompany] = useState<CompanyWithCategory | null>(null);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [isUserCompanyRepresentative, setIsUserCompanyRepresentative] = useState(false);
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);
  const [reportingReplyId, setReportingReplyId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  
  // Reply states
  const [replyingToReviewId, setReplyingToReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // Edit reply states
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [updatingReply, setUpdatingReply] = useState(false);
  
  // Claiming states
  const [claimingCompany, setClaimingCompany] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const text = {
    ar: {
      writeReview: 'اكتب تقييم',
      reviews: 'التقييمات',
      about: 'حول',
      filterByRating: 'تصفية حسب التقييم',
      allRatings: 'جميع التقييمات',
      searchReviews: 'البحث في التقييمات',
      sortBy: 'ترتيب حسب',
      newest: 'الأحدث',
      oldest: 'الأقدم',
      highest: 'الأعلى تقييماً',
      lowest: 'الأقل تقييماً',
      helpful: 'مفيد',
      notHelpful: 'غير مفيد',
      share: 'مشاركة',
      report: 'إبلاغ',
      reply: 'رد',
      editReply: 'تعديل الرد',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      companyName: 'اسم الشركة',
      website: 'الموقع الإلكتروني',
      category: 'الفئة',
      established: 'تأسست في',
      employees: 'الموظفون',
      location: 'الموقع',
      contactInfo: 'معلومات الاتصال',
      aboutText: 'نص وصفي عن الشركة وخدماتها ورؤيتها ورسالتها في السوق العقاري المصري.',
      stars: 'نجوم',
      companyNotFound: 'الشركة غير موجودة',
      companyNotFoundDesc: 'لم يتم العثور على الشركة المطلوبة. يرجى التحقق من الرابط والمحاولة مرة أخرى.',
      backToHome: 'العودة للرئيسية',
      loading: 'جاري التحميل...',
      noReviews: 'لا توجد تقييمات حتى الآن',
      anonymous: 'مجهول',
      realEstate: 'خدمات عقارية',
      loginToVote: 'يجب تسجيل الدخول للتصويت',
      linkCopied: 'تم نسخ الرابط',
      reportContent: 'الإبلاغ عن المحتوى',
      reportReason: 'سبب الإبلاغ',
      spam: 'رسائل مزعجة',
      offensiveLanguage: 'لغة مسيئة',
      falseInformation: 'معلومات خاطئة',
      inappropriate: 'محتوى غير مناسب',
      other: 'أخرى',
      additionalDetails: 'تفاصيل إضافية (اختياري)',
      submitReport: 'إرسال البلاغ',
      reportSubmitted: 'شكراً لك، تم إرسال بلاغك',
      reportError: 'حدث خطأ أثناء إرسال البلاغ',
      submitting: 'جاري الإرسال...',
      updating: 'جاري التحديث...',
      loginToReport: 'يجب تسجيل الدخول للإبلاغ',
      verifiedProfile: 'ملف شخصي موثق',
      claimProfile: 'هل هذه شركتك؟ اطلب ملفك الشخصي الآن',
      claimBenefits: 'فوائد المطالبة بملفك الشخصي',
      claimBenefit1: 'الرد على التقييمات',
      claimBenefit2: 'تحديث معلومات الشركة',
      claimBenefit3: 'عرض شارة التحقق',
      claimBenefit4: 'إحصائيات مفصلة',
      claiming: 'جاري المطالبة...',
      claimSuccess: 'تم المطالبة بالملف الشخصي بنجاح!',
      claimError: 'حدث خطأ أثناء المطالبة',
      companyReply: 'رد الشركة',
      writeReply: 'اكتب رداً...',
      submitReply: 'إرسال الرد',
      replySubmitted: 'تم إرسال الرد بنجاح',
      replyError: 'حدث خطأ أثناء إرسال الرد',
      replyUpdated: 'تم تحديث الرد بنجاح',
      loginToClaim: 'يجب تسجيل الدخول للمطالبة بالملف الشخصي'
    },
    en: {
      writeReview: 'Write a Review',
      reviews: 'Reviews',
      about: 'About',
      filterByRating: 'Filter by Rating',
      allRatings: 'All Ratings',
      searchReviews: 'Search reviews',
      sortBy: 'Sort by',
      newest: 'Newest',
      oldest: 'Oldest',
      highest: 'Highest Rated',
      lowest: 'Lowest Rated',
      helpful: 'Helpful',
      notHelpful: 'Not Helpful',
      share: 'Share',
      report: 'Report',
      reply: 'Reply',
      editReply: 'Edit Reply',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      companyName: 'Company Name',
      website: 'Website',
      category: 'Category',
      established: 'Established',
      employees: 'Employees',
      location: 'Location',
      contactInfo: 'Contact Information',
      aboutText: 'Descriptive text about the company and its services, vision and mission in the Egyptian real estate market.',
      stars: 'stars',
      companyNotFound: 'Company Not Found',
      companyNotFoundDesc: 'The requested company could not be found. Please check the link and try again.',
      backToHome: 'Back to Home',
      loading: 'Loading...',
      noReviews: 'No reviews yet',
      anonymous: 'Anonymous',
      realEstate: 'Real Estate Services',
      loginToVote: 'Please log in to vote',
      linkCopied: 'Link Copied',
      reportContent: 'Report Content',
      reportReason: 'Report Reason',
      spam: 'Spam',
      offensiveLanguage: 'Offensive Language',
      falseInformation: 'False Information',
      inappropriate: 'Inappropriate Content',
      other: 'Other',
      additionalDetails: 'Additional Details (Optional)',
      submitReport: 'Submit Report',
      reportSubmitted: 'Thank you, your report has been submitted',
      reportError: 'Error submitting report',
      submitting: 'Submitting...',
      updating: 'Updating...',
      loginToReport: 'Please log in to report',
      verifiedProfile: 'Verified Profile',
      claimProfile: 'Is this your company? Claim your profile now',
      claimBenefits: 'Benefits of claiming your profile',
      claimBenefit1: 'Reply to reviews',
      claimBenefit2: 'Update company information',
      claimBenefit3: 'Display verification badge',
      claimBenefit4: 'Detailed analytics',
      claiming: 'Claiming...',
      claimSuccess: 'Profile claimed successfully!',
      claimError: 'Error claiming profile',
      companyReply: 'Company Reply',
      writeReply: 'Write a reply...',
      submitReply: 'Submit Reply',
      replySubmitted: 'Reply submitted successfully',
      replyError: 'Error submitting reply',
      replyUpdated: 'Reply updated successfully',
      loginToClaim: 'Please log in to claim this profile'
    }
  };

  const reportReasons = [
    { value: 'spam', label: text[language].spam },
    { value: 'offensive', label: text[language].offensiveLanguage },
    { value: 'false_info', label: text[language].falseInformation },
    { value: 'inappropriate', label: text[language].inappropriate },
    { value: 'other', label: text[language].other }
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    } else {
      setError('No company ID provided');
      setLoading(false);
    }
  }, [companyId, user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query 1: Fetch Company Details with Category
      const companyData = await getCompanyWithCategoryById(companyId!);

      if (!companyData) {
        setError('Company not found');
        return;
      }

      setCompany(companyData);

      // Query 2: Fetch Reviews with Author Names and Vote Data
      const reviewsData = await getReviewsByCompanyId(companyId!, user?.id);
      setReviews(reviewsData);

      // Query 3: Check if current user is a representative of this company
      if (user) {
        const isRep = await isCompanyRepresentative(companyId!, user.id);
        setIsRepresentative(isRep);
        
        // Check if user is ANY company representative (for hiding write review button)
        const { data: anyRepData, error: anyRepError } = await supabase
          .from('company_representatives')
          .select('company_id')
          .eq('profile_id', user.id)
          .limit(1);

        if (!anyRepError && anyRepData && anyRepData.length > 0) {
          setIsUserCompanyRepresentative(true);
        }
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      setError(error.message || 'An error occurred while loading the company data');
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = () => {
    onNavigate('write-review', companyId!);
  };

  const handleVoteToggle = async (reviewId: number) => {
    if (!user) {
      alert(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReviewVote(reviewId, user.id);
      
      if (result.success) {
        // Update the reviews state with new vote data
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reviewId 
              ? { 
                  ...review, 
                  user_has_voted: result.isVoted,
                  vote_count: result.voteCount
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error toggling vote:', error);
    }
  };

  const handleReplyVoteToggle = async (replyId: string) => {
    if (!user) {
      alert(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReplyVote(replyId, user.id);
      
      if (result.success) {
        // Update the reviews state with new reply vote data
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.company_reply?.id === replyId 
              ? { 
                  ...review, 
                  company_reply: {
                    ...review.company_reply,
                    user_has_voted: result.isVoted,
                    vote_count: result.voteCount
                  }
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error toggling reply vote:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${company?.name} - R8 ESTATE`,
          url: url
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setToast({ message: text[language].linkCopied, type: 'success' });
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleReportClick = (reviewId?: number, replyId?: string) => {
    if (!user) {
      alert(text[language].loginToReport);
      return;
    }
    
    setReportingReviewId(reviewId || null);
    setReportingReplyId(replyId || null);
    setShowReportModal(true);
    setReportReason('');
    setReportDetails('');
  };

  const handleReportSubmit = async () => {
    if ((!reportingReviewId && !reportingReplyId) || !reportReason || !user) return;

    setSubmittingReport(true);

    try {
      let result;
      if (reportingReviewId) {
        result = await submitReport(
          reportingReviewId,
          user.id,
          reportReason,
          reportDetails.trim() || undefined
        );
      } else if (reportingReplyId) {
        result = await submitReplyReport(
          reportingReplyId,
          user.id,
          reportReason,
          reportDetails.trim() || undefined
        );
      }

      if (result?.success) {
        setShowReportModal(false);
        setToast({ message: text[language].reportSubmitted, type: 'success' });
      } else {
        setToast({ message: text[language].reportError, type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setToast({ message: text[language].reportError, type: 'error' });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleReplyClick = (reviewId: number) => {
    setReplyingToReviewId(reviewId);
    setReplyText('');
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (!replyText.trim() || !user) return;

    setSubmittingReply(true);

    try {
      const result = await submitCompanyReply(reviewId, replyText.trim(), user.id);

      if (result.success && result.reply) {
        // Update the reviews state with the new reply
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reviewId 
              ? { ...review, company_reply: { ...result.reply!, vote_count: 0, user_has_voted: false } }
              : review
          )
        );
        setReplyingToReviewId(null);
        setReplyText('');
        setToast({ message: text[language].replySubmitted, type: 'success' });
      } else {
        setToast({ message: text[language].replyError, type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      setToast({ message: text[language].replyError, type: 'error' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditReplyClick = (replyId: string, currentText: string) => {
    setEditingReplyId(replyId);
    setEditReplyText(currentText);
  };

  const handleEditReplySubmit = async (replyId: string) => {
    if (!editReplyText.trim() || !user) return;

    setUpdatingReply(true);

    try {
      const { error } = await supabase
        .from('company_replies')
        .update({ reply_body: editReplyText.trim() })
        .eq('id', replyId)
        .eq('profile_id', user.id); // Ensure user can only edit their own replies

      if (error) throw error;

      // Update the reviews state with the updated reply
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.company_reply?.id === replyId 
            ? { 
                ...review, 
                company_reply: {
                  ...review.company_reply,
                  reply_body: editReplyText.trim()
                }
              }
            : review
        )
      );

      setEditingReplyId(null);
      setEditReplyText('');
      setToast({ message: text[language].replyUpdated, type: 'success' });
    } catch (error: any) {
      console.error('Error updating reply:', error);
      setToast({ message: text[language].replyError, type: 'error' });
    } finally {
      setUpdatingReply(false);
    }
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyText('');
  };

  const handleClaimProfile = async () => {
    if (!user) {
      alert(text[language].loginToClaim);
      onNavigate('login');
      return;
    }

    if (!companyId) return;

    setClaimingCompany(true);

    try {
      const result = await claimCompany(companyId);

      if (result.success) {
        // Update the company state
        setCompany(prev => prev ? { ...prev, is_claimed: true } : null);
        setToast({ message: text[language].claimSuccess, type: 'success' });
      } else {
        setToast({ message: text[language].claimError, type: 'error' });
      }
    } catch (error) {
      console.error('Error claiming company:', error);
      setToast({ message: text[language].claimError, type: 'error' });
    } finally {
      setClaimingCompany(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = [];
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
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

  const calculateOverallRating = () => {
    if (reviews.length === 0) return 0;
    const validRatings = reviews.filter(review => review.overall_rating !== null);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, review) => acc + (review.overall_rating || 0), 0);
    return Math.round((sum / validRatings.length) * 10) / 10;
  };

  const ratingOptions = [
    { value: 'all', label: text[language].allRatings },
    { value: '5', label: `5 ${text[language].stars}` },
    { value: '4', label: `4 ${text[language].stars}` },
    { value: '3', label: `3 ${text[language].stars}` },
    { value: '2', label: `2 ${text[language].stars}` },
    { value: '1', label: `1 ${text[language].stars}` }
  ];

  const sortOptions = [
    { value: 'newest', label: text[language].newest },
    { value: 'oldest', label: text[language].oldest },
    { value: 'highest', label: text[language].highest },
    { value: 'lowest', label: text[language].lowest }
  ];

  if (loading) {
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

  if (error || !company) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">🏢</div>
            <h1 className="text-2xl font-bold text-dark-500 mb-2">
              {text[language].companyNotFound}
            </h1>
            <p className="text-gray-600 mb-6">
              {text[language].companyNotFoundDesc}
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
            >
              {text[language].backToHome}
            </button>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  const overallRating = calculateOverallRating();

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 rtl:left-4 rtl:right-auto z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center space-x-2 rtl:space-x-reverse animate-slide-up`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {text[language].reportContent}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Report Reason */}
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].reportReason}
                </label>
                <div className="space-y-2">
                  {reportReasons.map((reason) => (
                    <label key={reason.value} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason.value}
                        checked={reportReason === reason.value}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-primary-500 focus:ring-primary-500"
                        disabled={submittingReport}
                      />
                      <span className="text-gray-700">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].additionalDetails}
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  placeholder={text[language].additionalDetails}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  disabled={submittingReport}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={submittingReport}
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={!reportReason || submittingReport}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  {submittingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{text[language].submitting}</span>
                    </>
                  ) : (
                    <span>{text[language].submitReport}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start space-x-6 rtl:space-x-reverse mb-6 lg:mb-0">
              {/* Company Logo */}
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                {company.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.name || 'Company Logo'} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  '🏢'
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                  <h1 className="text-3xl font-bold text-dark-500">
                    {company.name || text[language].companyName}
                  </h1>
                  {company.is_claimed && (
                    <div className="flex items-center space-x-1 rtl:space-x-reverse bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                      <Shield className="h-4 w-4" />
                      <span>{text[language].verifiedProfile}</span>
                    </div>
                  )}
                </div>
                
                {company.website && (
                  <a 
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 rtl:space-x-reverse text-primary-500 hover:text-primary-600 transition-colors duration-200 mb-4"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{company.website}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {/* Rating Summary */}
                <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    {renderStars(Math.round(overallRating), 'lg')}
                  </div>
                  <span className="text-2xl font-bold text-dark-500">
                    {overallRating.toFixed(1)}
                  </span>
                  <span className="text-gray-600">
                    ({reviews.length} {text[language].reviews})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 space-y-3">
              {/* Write Review Button - Only show if user is NOT a company representative */}
              {!isUserCompanyRepresentative && (
                <button 
                  onClick={handleWriteReview}
                  className="w-full btn-primary px-8 py-4 rounded-lg font-semibold text-lg text-white hover-lift flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <Star className="h-5 w-5" />
                  <span>{text[language].writeReview}</span>
                </button>
              )}

              {/* Claim Profile Button (show for all unclaimed profiles) */}
              {!company.is_claimed && (
                <button 
                  onClick={handleClaimProfile}
                  disabled={claimingCompany}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  {claimingCompany ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{text[language].claiming}</span>
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4" />
                      <span>{text[language].claimProfile}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Column - Reviews */}
          <div className="lg:col-span-3">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
                {/* Rating Filter */}
                <div className="relative">
                  <select
                    value={selectedRatingFilter}
                    onChange={(e) => setSelectedRatingFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    {ratingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={text[language].searchReviews}
                    className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-dark-500 mb-6">
                {text[language].reviews}
              </h2>

              {/* Review Cards */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 text-lg">{text[language].noReviews}</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
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
                                {renderStars(Math.round(review.overall_rating || 0), 'sm')}
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

                      {/* Review Actions */}
                      <div className="flex items-center space-x-6 rtl:space-x-reverse mb-4">
                        <button 
                          onClick={() => handleVoteToggle(review.id)}
                          className={`flex items-center space-x-2 rtl:space-x-reverse transition-colors duration-200 ${
                            review.user_has_voted 
                              ? 'text-green-600' 
                              : 'text-gray-500 hover:text-green-600'
                          }`}
                        >
                          <ThumbsUp className={`h-4 w-4 ${review.user_has_voted ? 'fill-current' : ''}`} />
                          <span className="text-sm">
                            {text[language].helpful} {review.vote_count ? `(${review.vote_count})` : ''}
                          </span>
                        </button>
                        
                        <button 
                          onClick={handleShare}
                          className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="text-sm">{text[language].share}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleReportClick(review.id)}
                          className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-red-600 transition-colors duration-200"
                        >
                          <Flag className="h-4 w-4" />
                          <span className="text-sm">{text[language].report}</span>
                        </button>

                        {/* Reply Button (only for company representatives) */}
                        {isRepresentative && !review.company_reply && (
                          <button 
                            onClick={() => handleReplyClick(review.id)}
                            className="flex items-center space-x-2 rtl:space-x-reverse text-primary-500 hover:text-primary-600 transition-colors duration-200"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">{text[language].reply}</span>
                          </button>
                        )}
                      </div>

                      {/* Company Reply */}
                      {review.company_reply && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-800">{text[language].companyReply}</span>
                            </div>
                            
                            {/* Edit Reply Button - Only show if user is the author of the reply */}
                            {user && review.company_reply.profile_id === user.id && editingReplyId !== review.company_reply.id && (
                              <button
                                onClick={() => handleEditReplyClick(review.company_reply!.id, review.company_reply!.reply_body || '')}
                                className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 rtl:space-x-reverse"
                              >
                                <Edit className="h-3 w-3" />
                                <span>{text[language].editReply}</span>
                              </button>
                            )}
                          </div>
                          
                          {/* Reply Content - Editable if in edit mode */}
                          {editingReplyId === review.company_reply.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editReplyText}
                                onChange={(e) => setEditReplyText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                dir={language === 'ar' ? 'rtl' : 'ltr'}
                                disabled={updatingReply}
                              />
                              <div className="flex space-x-3 rtl:space-x-reverse">
                                <button
                                  onClick={handleCancelEditReply}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                  disabled={updatingReply}
                                >
                                  {text[language].cancel}
                                </button>
                                <button
                                  onClick={() => handleEditReplySubmit(review.company_reply!.id)}
                                  disabled={!editReplyText.trim() || updatingReply}
                                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 rtl:space-x-reverse"
                                >
                                  {updatingReply ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      <span>{text[language].updating}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4" />
                                      <span>{text[language].saveChanges}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700 leading-relaxed mb-3">
                              {review.company_reply.reply_body}
                            </p>
                          )}
                          
                          {/* Reply Actions - Only show if not in edit mode */}
                          {editingReplyId !== review.company_reply.id && (
                            <div className="flex items-center space-x-4 rtl:space-x-reverse pt-2 border-t border-blue-200">
                              <button 
                                onClick={() => handleReplyVoteToggle(review.company_reply!.id)}
                                className={`flex items-center space-x-2 rtl:space-x-reverse transition-colors duration-200 ${
                                  review.company_reply!.user_has_voted 
                                    ? 'text-green-600' 
                                    : 'text-gray-500 hover:text-green-600'
                                }`}
                              >
                                <ThumbsUp className={`h-4 w-4 ${review.company_reply!.user_has_voted ? 'fill-current' : ''}`} />
                                <span className="text-sm">
                                  {text[language].helpful} {review.company_reply!.vote_count ? `(${review.company_reply!.vote_count})` : ''}
                                </span>
                              </button>
                              
                              <button 
                                onClick={handleShare}
                                className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-blue-600 transition-colors duration-200"
                              >
                                <Share2 className="h-4 w-4" />
                                <span className="text-sm">{text[language].share}</span>
                              </button>
                              
                              {/* Report Button - Only show if user is NOT the author of the reply */}
                              {user && review.company_reply.profile_id !== user.id && (
                                <button 
                                  onClick={() => handleReportClick(undefined, review.company_reply!.id)}
                                  className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-red-600 transition-colors duration-200"
                                >
                                  <Flag className="h-4 w-4" />
                                  <span className="text-sm">{text[language].report}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reply Form (only show when replying to this specific review) */}
                      {replyingToReviewId === review.id && (
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
                              onClick={() => setReplyingToReviewId(null)}
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
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-dark-500 mb-4">
                {text[language].about} {company.name}
              </h3>
              
              {/* Company Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-500">{text[language].category}</span>
                    <p className="font-medium text-dark-500">
                      {company.categories?.name || text[language].realEstate}
                    </p>
                  </div>
                </div>
                
                {/* Only show establishment date if it exists */}
                {company.established_in && (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-500">{text[language].established}</span>
                      <p className="font-medium text-dark-500">
                        {company.established_in}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Only show location if it exists */}
                {company.location && (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-500">{text[language].location}</span>
                      <p className="font-medium text-dark-500">
                        {company.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* About Text - Only show if description exists */}
              {company.description && (
                <p className="text-gray-700 leading-relaxed mb-6">
                  {company.description}
                </p>
              )}

              {/* Contact Information */}
              {company.website && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-semibold text-dark-500 mb-4">
                    {text[language].contactInfo}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a 
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-500 hover:text-primary-600 transition-colors duration-200"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Claim Benefits Box (only show if unclaimed) */}
              {!company.is_claimed && (
                <div className="border-t border-gray-100 pt-6 mt-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-3">
                      {text[language].claimBenefits}
                    </h4>
                    <ul className="space-y-2 text-sm text-orange-700">
                      <li className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className="h-4 w-4" />
                        <span>{text[language].claimBenefit1}</span>
                      </li>
                      <li className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className="h-4 w-4" />
                        <span>{text[language].claimBenefit2}</span>
                      </li>
                      <li className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className="h-4 w-4" />
                        <span>{text[language].claimBenefit3}</span>
                      </li>
                      <li className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className="h-4 w-4" />
                        <span>{text[language].claimBenefit4}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default CompanyProfile;