import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MapPin, 
  Globe, 
  Calendar, 
  Building2, 
  Phone, 
  Mail, 
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Flag,
  Share2,
  User,
  Edit,
  CheckCircle,
  AlertTriangle,
  Clock,
  Reply,
  Send,
  X,
  Shield,
  EyeOff,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { 
  getCompanyWithCategoryById, 
  getReviewsByCompanyId, 
  toggleReviewVote,
  toggleReplyVote,
  submitReport,
  submitReplyReport,
  isCompanyRepresentative,
  CompanyWithCategory,
  ReviewWithProfile,
  supabase,
  createNotification,
  deleteReplyVotes
} from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface CompanyProfileProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number) => void;
  companyId?: number | null;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ 
  language, 
  onLanguageChange, 
  onNavigate, 
  companyId 
}) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyWithCategory | null>(null);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Reply states
  const [replyingToReviewId, setReplyingToReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const text = {
    ar: {
      loading: 'جاري التحميل...',
      companyNotFound: 'الشركة غير موجودة',
      backToHome: 'العودة للرئيسية',
      writeReview: 'اكتب تقييم',
      claimBusiness: 'اطلب ملكية الشركة',
      website: 'الموقع الإلكتروني',
      established: 'تأسست في',
      location: 'الموقع',
      category: 'الفئة',
      about: 'حول الشركة',
      reviews: 'التقييمات',
      noReviews: 'لا توجد تقييمات حتى الآن',
      beFirst: 'كن أول من يكتب تقييماً لهذه الشركة',
      helpful: 'مفيد',
      reply: 'رد',
      report: 'إبلاغ',
      share: 'مشاركة',
      anonymous: 'مجهول',
      companyReply: 'رد الشركة',
      daysAgo: 'منذ',
      day: 'يوم',
      days: 'أيام',
      hours: 'ساعات',
      hour: 'ساعة',
      minutes: 'دقائق',
      minute: 'دقيقة',
      now: 'الآن',
      reportReview: 'إبلاغ عن التقييم',
      reportReply: 'إبلاغ عن الرد',
      reportReason: 'سبب الإبلاغ',
      spam: 'محتوى مزعج',
      inappropriate: 'محتوى غير مناسب',
      fake: 'تقييم مزيف',
      other: 'أخرى',
      reportDetails: 'تفاصيل إضافية (اختياري)',
      submitReport: 'إرسال البلاغ',
      cancel: 'إلغاء',
      reportSubmitted: 'تم إرسال البلاغ بنجاح',
      errorOccurred: 'حدث خطأ',
      loginToVote: 'يجب تسجيل الدخول للتصويت',
      loginToReport: 'يجب تسجيل الدخول للإبلاغ',
      writeReply: 'اكتب رداً...',
      submitReply: 'إرسال الرد',
      submitting: 'جاري الإرسال...',
      replySubmitted: 'تم إرسال الرد بنجاح',
      replyError: 'حدث خطأ أثناء إرسال الرد',
      adminControls: 'أدوات الإدارة',
      hide: 'إخفاء',
      delete: 'حذف',
      confirmHide: 'هل أنت متأكد من إخفاء هذا المحتوى؟',
      confirmDelete: 'هل أنت متأكد من حذف هذا المحتوى نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      contentHidden: 'تم إخفاء المحتوى بنجاح',
      contentDeleted: 'تم حذف المحتوى بنجاح',
      hideError: 'حدث خطأ أثناء إخفاء المحتوى',
      deleteError: 'حدث خطأ أثناء حذف المحتوى'
    },
    en: {
      loading: 'Loading...',
      companyNotFound: 'Company Not Found',
      backToHome: 'Back to Home',
      writeReview: 'Write Review',
      claimBusiness: 'Claim Business',
      website: 'Website',
      established: 'Established',
      location: 'Location',
      category: 'Category',
      about: 'About',
      reviews: 'Reviews',
      noReviews: 'No reviews yet',
      beFirst: 'Be the first to write a review for this company',
      helpful: 'Helpful',
      reply: 'Reply',
      report: 'Report',
      share: 'Share',
      anonymous: 'Anonymous',
      companyReply: 'Company Reply',
      daysAgo: '',
      day: 'day ago',
      days: 'days ago',
      hours: 'hours ago',
      hour: 'hour ago',
      minutes: 'minutes ago',
      minute: 'minute ago',
      now: 'just now',
      reportReview: 'Report Review',
      reportReply: 'Report Reply',
      reportReason: 'Report Reason',
      spam: 'Spam',
      inappropriate: 'Inappropriate Content',
      fake: 'Fake Review',
      other: 'Other',
      reportDetails: 'Additional Details (Optional)',
      submitReport: 'Submit Report',
      cancel: 'Cancel',
      reportSubmitted: 'Report submitted successfully',
      errorOccurred: 'An error occurred',
      loginToVote: 'Please log in to vote',
      loginToReport: 'Please log in to report',
      writeReply: 'Write a reply...',
      submitReply: 'Submit Reply',
      submitting: 'Submitting...',
      replySubmitted: 'Reply submitted successfully',
      replyError: 'Error submitting reply',
      adminControls: 'Admin Controls',
      hide: 'Hide',
      delete: 'Delete',
      confirmHide: 'Are you sure you want to hide this content?',
      confirmDelete: 'Are you sure you want to permanently delete this content? This action cannot be undone.',
      contentHidden: 'Content hidden successfully',
      contentDeleted: 'Content deleted successfully',
      hideError: 'Error hiding content',
      deleteError: 'Error deleting content'
    }
  };

  // Report modal state
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    type: 'review' | 'reply';
    targetId: number | string;
    reason: string;
    details: string;
  }>({
    isOpen: false,
    type: 'review',
    targetId: 0,
    reason: '',
    details: ''
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) {
        setError('No company ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch company details
        const companyData = await getCompanyWithCategoryById(companyId);
        if (!companyData) {
          setError('Company not found');
          return;
        }
        setCompany(companyData);

        // Fetch reviews
        const reviewsData = await getReviewsByCompanyId(companyId, user?.id);
        setReviews(reviewsData);

        // Check if current user is a representative
        if (user) {
          const isRep = await isCompanyRepresentative(companyId, user.id);
          setIsRepresentative(isRep);

          // Check if current user is an admin
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (!profileError && profileData) {
            setIsAdmin(profileData.is_admin || false);
          }
        }
      } catch (error: any) {
        console.error('Error fetching company data:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, user]);

  const renderStars = (rating: number | null) => {
    const stars = [];
    const ratingValue = rating || 0;
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < ratingValue ? 'fill-current text-highlight-500' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (language === 'ar') {
      if (diffMinutes < 1) return text[language].now;
      if (diffMinutes < 60) {
        if (diffMinutes === 1) return `${text[language].daysAgo} ${text[language].minute}`;
        return `${text[language].daysAgo} ${diffMinutes} ${text[language].minutes}`;
      }
      if (diffHours < 24) {
        if (diffHours === 1) return `${text[language].daysAgo} ${text[language].hour}`;
        return `${text[language].daysAgo} ${diffHours} ${text[language].hours}`;
      }
      if (diffDays === 1) return `${text[language].daysAgo} ${text[language].day}`;
      return `${text[language].daysAgo} ${diffDays} ${text[language].days}`;
    } else {
      if (diffMinutes < 1) return text[language].now;
      if (diffMinutes < 60) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
      }
      if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      }
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
  };

  const getReviewerName = (review: ReviewWithProfile) => {
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

  const getReviewerAvatar = (review: ReviewWithProfile) => {
    if (review.is_anonymous || !review.profiles?.avatar_url) {
      return null;
    }
    return review.profiles.avatar_url;
  };

  const handleVoteToggle = async (reviewId: number) => {
    if (!user) {
      toast.error(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReviewVote(reviewId, user.id);
      if (result.success) {
        // Update local state
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, vote_count: result.voteCount, user_has_voted: result.isVoted }
            : review
        ));
      }
    } catch (error) {
      console.error('Error toggling vote:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleReplyVoteToggle = async (replyId: string) => {
    if (!user) {
      toast.error(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReplyVote(replyId, user.id);
      if (result.success) {
        // Update local state
        setReviews(prev => prev.map(review => ({
          ...review,
          company_reply: review.company_reply?.id === replyId 
            ? { ...review.company_reply, vote_count: result.voteCount, user_has_voted: result.isVoted }
            : review.company_reply
        })));
      }
    } catch (error) {
      console.error('Error toggling reply vote:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const openReportModal = (type: 'review' | 'reply', targetId: number | string) => {
    if (!user) {
      toast.error(text[language].loginToReport);
      return;
    }

    setReportModal({
      isOpen: true,
      type,
      targetId,
      reason: '',
      details: ''
    });
  };

  const closeReportModal = () => {
    setReportModal({
      isOpen: false,
      type: 'review',
      targetId: 0,
      reason: '',
      details: ''
    });
  };

  const handleReportSubmit = async () => {
    if (!user || !reportModal.reason) return;

    try {
      let result;
      if (reportModal.type === 'review') {
        result = await submitReport(
          reportModal.targetId as number,
          user.id,
          reportModal.reason,
          reportModal.details
        );
      } else {
        result = await submitReplyReport(
          reportModal.targetId as string,
          user.id,
          reportModal.reason,
          reportModal.details
        );
      }

      if (result.success) {
        toast.success(text[language].reportSubmitted);
        closeReportModal();
      } else {
        toast.error(result.error || text[language].errorOccurred);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(text[language].errorOccurred);
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
          profile_id: user.id,
          status: 'published'
        }])
        .select()
        .single();

      if (error) throw error;

      // Update reviews state to include the new reply
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              company_reply: {
                ...data,
                vote_count: 0,
                user_has_voted: false
              }
            }
          : review
      ));

      setReplyingToReviewId(null);
      setReplyText('');
      toast.success(text[language].replySubmitted);
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error(text[language].replyError);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Admin functions with proper notification handling
  const handleHideReview = async (reviewId: number) => {
    if (!confirm(text[language].confirmHide)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'removed' })
        .eq('id', reviewId);

      if (error) throw error;

      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success(text[language].contentHidden);
    } catch (error: any) {
      console.error('Error hiding review:', error);
      toast.error(text[language].hideError);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    // Step A: Read and Store Information First
    const reviewToDelete = reviews.find(review => review.id === reviewId);
    if (!reviewToDelete) return;

    const authorIdToNotify = reviewToDelete.profile_id;
    const companyName = company?.name || 'الشركة';
    
    // Step B: Confirm and Delete
    if (!confirm(text[language].confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // Step C: Create the Notification
      if (authorIdToNotify) {
        const notificationMessage = language === 'ar' 
          ? `تم حذف تقييمك لشركة ${companyName} من قبل الإدارة`
          : `Your review for ${companyName} has been deleted by administration`;

        await createNotification(
          authorIdToNotify,
          'review_deleted',
          notificationMessage,
          `/company/${companyId}`
        );
      }

      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success(text[language].contentDeleted);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(text[language].deleteError);
    }
  };

  const handleHideReply = async (replyId: string, reviewId: number) => {
    if (!confirm(text[language].confirmHide)) return;

    try {
      const { error } = await supabase
        .from('company_replies')
        .update({ status: 'removed' })
        .eq('id', replyId);

      if (error) throw error;

      // Update local state to remove the reply
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, company_reply: null }
          : review
      ));
      toast.success(text[language].contentHidden);
    } catch (error: any) {
      console.error('Error hiding reply:', error);
      toast.error(text[language].hideError);
    }
  };

  const handleDeleteReply = async (replyId: string, reviewId: number) => {
    // Step A: Read and Store Information First
    const reviewWithReply = reviews.find(review => review.id === reviewId);
    if (!reviewWithReply?.company_reply) return;

    const authorIdToNotify = reviewWithReply.company_reply.profile_id;
    const companyName = company?.name || 'الشركة';
    
    // Step B: Confirm and Delete
    if (!confirm(text[language].confirmDelete)) return;

    try {
      // First delete all associated votes for this reply
      const deleteVotesResult = await deleteReplyVotes(replyId);
      if (!deleteVotesResult.success) {
        throw new Error(deleteVotesResult.error || 'Failed to delete reply votes');
      }

      // Then delete the reply itself
      const { error } = await supabase
        .from('company_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      // Step C: Create the Notification
      if (authorIdToNotify) {
        const notificationMessage = language === 'ar' 
          ? `تم حذف ردك على تقييم شركة ${companyName} من قبل الإدارة`
          : `Your reply on ${companyName} review has been deleted by administration`;

        await createNotification(
          authorIdToNotify,
          'reply_deleted',
          notificationMessage,
          `/company/${companyId}`
        );
      }

      // Update local state to remove the reply
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, company_reply: null }
          : review
      ));
      toast.success(text[language].contentDeleted);
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      toast.error(text[language].deleteError);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const validRatings = reviews.filter(r => r.overall_rating !== null);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, r) => acc + (r.overall_rating || 0), 0);
    return Math.round((sum / validRatings.length) * 10) / 10;
  };

  // Loading state
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

  // Error state
  if (error || !company) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-dark-500 mb-2">
              {text[language].companyNotFound}
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
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

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      {/* Report Modal */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-dark-500 mb-4">
              {reportModal.type === 'review' ? text[language].reportReview : text[language].reportReply}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].reportReason}
                </label>
                <select
                  value={reportModal.reason}
                  onChange={(e) => setReportModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">{text[language].reportReason}</option>
                  <option value="spam">{text[language].spam}</option>
                  <option value="inappropriate">{text[language].inappropriate}</option>
                  <option value="fake">{text[language].fake}</option>
                  <option value="other">{text[language].other}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].reportDetails}
                </label>
                <textarea
                  value={reportModal.details}
                  onChange={(e) => setReportModal(prev => ({ ...prev, details: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 rtl:space-x-reverse mt-6">
              <button
                onClick={closeReportModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                {text[language].cancel}
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!reportModal.reason}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {text[language].submitReport}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start space-x-6 rtl:space-x-reverse mb-6 lg:mb-0">
              {/* Company Logo */}
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
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
                    {company.name || 'Company Name'}
                  </h1>
                  {company.is_claimed && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 rtl:space-x-reverse">
                      <CheckCircle className="h-3 w-3" />
                      <span>{language === 'ar' ? 'موثق' : 'Verified'}</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    {renderStars(calculateAverageRating())}
                  </div>
                  <span className="font-bold text-dark-500 text-lg">
                    {calculateAverageRating()}
                  </span>
                  <span className="text-gray-500">
                    ({reviews.length} {text[language].reviews})
                  </span>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {company.website && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:text-primary-600 transition-colors duration-200"
                      >
                        {text[language].website}
                      </a>
                    </div>
                  )}
                  
                  {company.established_in && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{text[language].established} {company.established_in}</span>
                    </div>
                  )}
                  
                  {company.location && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{company.location}</span>
                    </div>
                  )}
                  
                  {company.categories && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{company.categories.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 rtl:sm:space-x-reverse">
              <button 
                onClick={() => onNavigate('write-review', companyId)}
                className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <Edit className="h-4 w-4" />
                <span>{text[language].writeReview}</span>
              </button>
              
              {!company.is_claimed && (
                <button className="btn-secondary px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2 rtl:space-x-reverse">
                  <Building2 className="h-4 w-4" />
                  <span>{text[language].claimBusiness}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        {company.description && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-dark-500 mb-4">
              {text[language].about}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {company.description}
            </p>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-dark-500 mb-6">
            {text[language].reviews} ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-dark-500 mb-2">
                {text[language].noReviews}
              </h3>
              <p className="text-gray-600 mb-6">
                {text[language].beFirst}
              </p>
              <button 
                onClick={() => onNavigate('write-review', companyId)}
                className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
              >
                {text[language].writeReview}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors duration-200"
                >
                  {/* Admin Controls for Review */}
                  {isAdmin && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Shield className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-semibold text-gray-700">
                            {text[language].adminControls}
                          </span>
                        </div>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleHideReview(review.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition-colors duration-200"
                          >
                            <EyeOff className="h-3 w-3" />
                            <span>{text[language].hide}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors duration-200"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{text[language].delete}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Header with Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0">
                        {getReviewerAvatar(review) ? (
                          <img 
                            src={getReviewerAvatar(review)!} 
                            alt="Reviewer Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-primary-500" />
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <h4 className="font-semibold text-dark-500">
                          {getReviewerName(review)}
                        </h4>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            {renderStars(Math.round(review.overall_rating || 0))}
                          </div>
                          <span className="text-gray-500 text-sm">
                            {formatTimeAgo(review.created_at)}
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
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <button
                        onClick={() => handleVoteToggle(review.id)}
                        className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors duration-200 ${
                          review.user_has_voted
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{text[language].helpful}</span>
                        {review.vote_count > 0 && (
                          <span className="text-sm">({review.vote_count})</span>
                        )}
                      </button>

                      <button
                        onClick={() => openReportModal('review', review.id)}
                        className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-red-600 transition-colors duration-200"
                      >
                        <Flag className="h-4 w-4" />
                        <span className="text-sm">{text[language].report}</span>
                      </button>

                      <button className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-primary-600 transition-colors duration-200">
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm">{text[language].share}</span>
                      </button>
                    </div>
                  </div>

                  {/* Company Reply Section */}
                  {review.company_reply ? (
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg rtl:border-r-4 rtl:border-l-0 rtl:rounded-l-lg rtl:rounded-r-none">
                      {/* Admin Controls for Reply */}
                      {isAdmin && (
                        <div className="mb-3 p-2 bg-white border border-gray-200 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Shield className="h-3 w-3 text-red-500" />
                              <span className="text-xs font-semibold text-gray-700">
                                {text[language].adminControls}
                              </span>
                            </div>
                            <div className="flex space-x-2 rtl:space-x-reverse">
                              <button
                                onClick={() => handleHideReply(review.company_reply!.id, review.id)}
                                className="flex items-center space-x-1 rtl:space-x-reverse px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition-colors duration-200"
                              >
                                <EyeOff className="h-2 w-2" />
                                <span>{text[language].hide}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteReply(review.company_reply!.id, review.id)}
                                className="flex items-center space-x-1 rtl:space-x-reverse px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors duration-200"
                              >
                                <Trash2 className="h-2 w-2" />
                                <span>{text[language].delete}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">{text[language].companyReply}</span>
                        <span className="text-blue-600 text-sm">
                          {formatTimeAgo(review.company_reply.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {review.company_reply.reply_body}
                      </p>
                      
                      {/* Reply Actions */}
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <button
                          onClick={() => handleReplyVoteToggle(review.company_reply!.id)}
                          className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-lg transition-colors duration-200 text-sm ${
                            review.company_reply!.user_has_voted
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{text[language].helpful}</span>
                          {review.company_reply!.vote_count > 0 && (
                            <span>({review.company_reply!.vote_count})</span>
                          )}
                        </button>

                        <button
                          onClick={() => openReportModal('reply', review.company_reply!.id)}
                          className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-red-600 transition-colors duration-200 text-sm"
                        >
                          <Flag className="h-3 w-3" />
                          <span>{text[language].report}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Reply Section for Company Representatives
                    isRepresentative && (
                      <div className="mt-6">
                        {replyingToReviewId === review.id ? (
                          // Reply Form
                          <div className="bg-gray-50 p-4 rounded-lg">
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
                                <X className="h-4 w-4 inline mr-2 rtl:ml-2 rtl:mr-0" />
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
                          // Reply Button
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
                        )}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default CompanyProfile;