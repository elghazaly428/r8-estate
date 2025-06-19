import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Building2, 
  User, 
  ThumbsUp, 
  ThumbsDown,
  Flag, 
  Share2, 
  MessageSquare,
  Edit,
  Send,
  X,
  CheckCircle,
  AlertTriangle
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
  submitCompanyReply,
  CompanyWithCategory, 
  ReviewWithProfile,
  supabase
} from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface CompanyProfileProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number, categoryId?: number, saveHistory?: boolean) => void;
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
  const [isCompanyRepresentative, setIsCompanyRepresentative] = useState(false);
  const [checkingRepresentative, setCheckingRepresentative] = useState(false);
  
  // Reply state
  const [replyingToReviewId, setReplyingToReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // Report state
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);
  const [reportingReplyId, setReportingReplyId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const text = {
    ar: {
      companyProfile: 'ملف الشركة',
      writeReview: 'اكتب تقييم',
      website: 'الموقع الإلكتروني',
      established: 'تأسست في',
      location: 'الموقع',
      category: 'الفئة',
      reviews: 'تقييم',
      averageRating: 'متوسط التقييم',
      helpful: 'مفيد',
      notHelpful: 'غير مفيد',
      reply: 'رد',
      report: 'إبلاغ',
      share: 'مشاركة',
      anonymous: 'مجهول',
      companyReply: 'رد الشركة',
      writeReply: 'اكتب رداً...',
      submitReply: 'إرسال الرد',
      cancel: 'إلغاء',
      reportReview: 'إبلاغ عن التقييم',
      reportReply: 'إبلاغ عن الرد',
      reportReason: 'سبب الإبلاغ',
      reportDetails: 'تفاصيل إضافية (اختياري)',
      submitReport: 'إرسال البلاغ',
      inappropriateContent: 'محتوى غير مناسب',
      spam: 'رسائل مزعجة',
      fakeReview: 'تقييم مزيف',
      other: 'أخرى',
      loading: 'جاري التحميل...',
      companyNotFound: 'الشركة غير موجودة',
      noReviews: 'لا توجد تقييمات حتى الآن',
      beFirstToReview: 'كن أول من يقيم هذه الشركة',
      loginToVote: 'سجل الدخول للتصويت',
      loginToReply: 'سجل الدخول للرد',
      loginToReport: 'سجل الدخول للإبلاغ',
      submitting: 'جاري الإرسال...',
      replySubmitted: 'تم إرسال الرد بنجاح',
      reportSubmitted: 'تم إرسال البلاغ بنجاح',
      errorOccurred: 'حدث خطأ',
      cannotReportOwnContent: 'لا يمكنك الإبلاغ عن المحتوى الخاص بك',
      linkCopied: 'تم نسخ الرابط',
      shareReview: 'مشاركة التقييم',
      shareReply: 'مشاركة الرد'
    },
    en: {
      companyProfile: 'Company Profile',
      writeReview: 'Write Review',
      website: 'Website',
      established: 'Established',
      location: 'Location',
      category: 'Category',
      reviews: 'reviews',
      averageRating: 'Average Rating',
      helpful: 'Helpful',
      notHelpful: 'Not Helpful',
      reply: 'Reply',
      report: 'Report',
      share: 'Share',
      anonymous: 'Anonymous',
      companyReply: 'Company Reply',
      writeReply: 'Write a reply...',
      submitReply: 'Submit Reply',
      cancel: 'Cancel',
      reportReview: 'Report Review',
      reportReply: 'Report Reply',
      reportReason: 'Report Reason',
      reportDetails: 'Additional Details (Optional)',
      submitReport: 'Submit Report',
      inappropriateContent: 'Inappropriate Content',
      spam: 'Spam',
      fakeReview: 'Fake Review',
      other: 'Other',
      loading: 'Loading...',
      companyNotFound: 'Company Not Found',
      noReviews: 'No reviews yet',
      beFirstToReview: 'Be the first to review this company',
      loginToVote: 'Log in to vote',
      loginToReply: 'Log in to reply',
      loginToReport: 'Log in to report',
      submitting: 'Submitting...',
      replySubmitted: 'Reply submitted successfully',
      reportSubmitted: 'Report submitted successfully',
      errorOccurred: 'An error occurred',
      cannotReportOwnContent: 'You cannot report your own content',
      linkCopied: 'Link copied to clipboard',
      shareReview: 'Share Review',
      shareReply: 'Share Reply'
    }
  };

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
      } catch (error: any) {
        console.error('Error fetching company data:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, user?.id]);

  // Check if current user is a company representative for this company
  useEffect(() => {
    const checkCompanyRepresentative = async () => {
      if (!user || !companyId) {
        setIsCompanyRepresentative(false);
        return;
      }

      try {
        setCheckingRepresentative(true);
        
        const { data, error } = await supabase
          .from('company_representatives')
          .select('company_id')
          .eq('company_id', companyId)
          .eq('profile_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking company representative:', error);
          setIsCompanyRepresentative(false);
          return;
        }

        setIsCompanyRepresentative(data && data.length > 0);
      } catch (error) {
        console.error('Error in checkCompanyRepresentative:', error);
        setIsCompanyRepresentative(false);
      } finally {
        setCheckingRepresentative(false);
      }
    };

    checkCompanyRepresentative();
  }, [user, companyId]);

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

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const validRatings = reviews.filter(r => r.overall_rating !== null);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, r) => acc + (r.overall_rating || 0), 0);
    return Math.round((sum / validRatings.length) * 10) / 10;
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

  const handleReviewVote = async (reviewId: number, voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      toast.error(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReviewVote(reviewId, user.id, voteType);
      
      if (result.success) {
        // Update the review in state
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                helpful_count: result.helpfulCount,
                not_helpful_count: result.notHelpfulCount,
                user_vote_type: result.userVoteType
              }
            : review
        ));
      }
    } catch (error: any) {
      console.error('Error voting on review:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleReplyVote = async (replyId: string, voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      toast.error(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReplyVote(replyId, user.id, voteType);
      
      if (result.success) {
        // Update the reply in state
        setReviews(prev => prev.map(review => ({
          ...review,
          company_reply: review.company_reply?.id === replyId 
            ? {
                ...review.company_reply,
                helpful_count: result.helpfulCount,
                not_helpful_count: result.notHelpfulCount,
                user_vote_type: result.userVoteType
              }
            : review.company_reply
        })));
      }
    } catch (error: any) {
      console.error('Error voting on reply:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (!user || !replyText.trim()) return;

    setSubmittingReply(true);

    try {
      const result = await submitCompanyReply(reviewId, replyText.trim(), user.id);
      
      if (result.success && result.reply) {
        // Update reviews state
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                company_reply: {
                  ...result.reply!,
                  helpful_count: 0,
                  not_helpful_count: 0,
                  user_vote_type: null
                }
              }
            : review
        ));

        setReplyingToReviewId(null);
        setReplyText('');
        toast.success(text[language].replySubmitted);
      }
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!user || !reportReason.trim()) return;

    setSubmittingReport(true);

    try {
      let result;
      if (reportingReviewId) {
        result = await submitReport(reportingReviewId, user.id, reportReason, reportDetails);
      } else if (reportingReplyId) {
        result = await submitReplyReport(reportingReplyId, user.id, reportReason, reportDetails);
      }

      if (result?.success) {
        setReportingReviewId(null);
        setReportingReplyId(null);
        setReportReason('');
        setReportDetails('');
        toast.success(text[language].reportSubmitted);
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Helper function to check if user can report a review
  const canReportReview = (review: ReviewWithProfile) => {
    if (!user) return false;
    
    // User cannot report their own review
    if (review.profile_id === user.id) return false;
    
    return true;
  };

  // Helper function to check if user can report a reply
  const canReportReply = (reply: any) => {
    if (!user) return false;
    
    // User cannot report their own reply
    if (reply.profile_id === user.id) return false;
    
    return true;
  };

  // Handle report button click with validation
  const handleReportReviewClick = (review: ReviewWithProfile) => {
    if (!canReportReview(review)) {
      toast.error(text[language].cannotReportOwnContent);
      return;
    }
    setReportingReviewId(review.id);
  };

  const handleReportReplyClick = (reply: any) => {
    if (!canReportReply(reply)) {
      toast.error(text[language].cannotReportOwnContent);
      return;
    }
    setReportingReplyId(reply.id);
  };

  // Handle share functionality
  const handleShareReview = async (reviewId: number) => {
    try {
      const shareUrl = `${window.location.origin}/company/${companyId}#review-${reviewId}`;
      
      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: text[language].shareReview,
          text: company?.name ? `${text[language].shareReview} - ${company.name}` : text[language].shareReview,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success(text[language].linkCopied);
      }
    } catch (error) {
      console.error('Error sharing review:', error);
      // Fallback: copy to clipboard
      try {
        const shareUrl = `${window.location.origin}/company/${companyId}#review-${reviewId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success(text[language].linkCopied);
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        toast.error(text[language].errorOccurred);
      }
    }
  };

  const handleShareReply = async (replyId: string) => {
    try {
      const shareUrl = `${window.location.origin}/company/${companyId}#reply-${replyId}`;
      
      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: text[language].shareReply,
          text: company?.name ? `${text[language].shareReply} - ${company.name}` : text[language].shareReply,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success(text[language].linkCopied);
      }
    } catch (error) {
      console.error('Error sharing reply:', error);
      // Fallback: copy to clipboard
      try {
        const shareUrl = `${window.location.origin}/company/${companyId}#reply-${replyId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success(text[language].linkCopied);
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        toast.error(text[language].errorOccurred);
      }
    }
  };

  const handleWriteReviewClick = () => {
    // This will save the current company page to navigation history
    onNavigate('write-review', companyId!, undefined, true);
  };

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
        <Footer language={language} onNavigate={onNavigate} />
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
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => onNavigate('home', undefined, undefined, false)}
              className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
            >
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
          </div>
        </div>
        <Footer language={language} onNavigate={onNavigate} />
      </div>
    );
  }

  const averageRating = calculateAverageRating();

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex items-start space-x-6 rtl:space-x-reverse mb-6 md:mb-0">
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
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-dark-500 mb-2">
                  {company.name || 'Company Name'}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <span className="font-bold text-dark-500 text-lg">
                    {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-gray-500">
                    ({reviews.length} {text[language].reviews})
                  </span>
                </div>

                {/* Company Details */}
                <div className="space-y-2">
                  {company.website && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <ExternalLink className="h-4 w-4" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary-500 transition-colors duration-200"
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

            {/* Write Review Button */}
            <div className="flex-shrink-0">
              <button 
                onClick={handleWriteReviewClick}
                className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Edit className="h-4 w-4" />
                <span>{text[language].writeReview}</span>
              </button>
            </div>
          </div>

          {/* Company Description */}
          {company.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-gray-700 leading-relaxed">
                {company.description}
              </p>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-dark-500 mb-6">
            {language === 'ar' ? 'التقييمات' : 'Reviews'}
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-dark-500 mb-2">
                {text[language].noReviews}
              </h3>
              <p className="text-gray-600 mb-6">
                {text[language].beFirstToReview}
              </p>
              <button 
                onClick={handleWriteReviewClick}
                className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
              >
                {text[language].writeReview}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} id={`review-${review.id}`} className="border border-gray-100 rounded-lg p-6">
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

                  {/* Review Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      {/* Helpful Button */}
                      <button
                        onClick={() => handleReviewVote(review.id, 'helpful')}
                        className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg transition-colors duration-200 ${
                          review.user_vote_type === 'helpful'
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        disabled={!user}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{text[language].helpful}</span>
                        <span className="text-sm">({review.helpful_count || 0})</span>
                      </button>

                      {/* Not Helpful Button */}
                      <button
                        onClick={() => handleReviewVote(review.id, 'not_helpful')}
                        className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg transition-colors duration-200 ${
                          review.user_vote_type === 'not_helpful'
                            ? 'bg-red-100 text-red-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        disabled={!user}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-sm">{text[language].notHelpful}</span>
                        <span className="text-sm">({review.not_helpful_count || 0})</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {/* Report Button - Only show for authenticated users who can report this review */}
                      {user && canReportReview(review) && (
                        <button
                          onClick={() => handleReportReviewClick(review)}
                          className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600 hover:text-red-500 transition-colors duration-200"
                        >
                          <Flag className="h-4 w-4" />
                          <span className="text-sm">{text[language].report}</span>
                        </button>
                      )}

                      {/* Share Button - Always visible */}
                      <button 
                        onClick={() => handleShareReview(review.id)}
                        className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600 hover:text-primary-500 transition-colors duration-200"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm">{text[language].share}</span>
                      </button>
                    </div>
                  </div>

                  {/* Company Reply Section */}
                  {review.company_reply ? (
                    // Show existing reply
                    <div id={`reply-${review.company_reply.id}`} className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">{text[language].companyReply}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {review.company_reply.reply_body}
                      </p>
                      
                      {/* Reply Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          {/* Helpful Button for Reply */}
                          <button
                            onClick={() => handleReplyVote(review.company_reply!.id, 'helpful')}
                            className={`flex items-center space-x-1 rtl:space-x-reverse px-2 py-1 rounded transition-colors duration-200 ${
                              review.company_reply!.user_vote_type === 'helpful'
                                ? 'bg-green-100 text-green-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            disabled={!user}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span className="text-xs">{text[language].helpful}</span>
                            <span className="text-xs">({review.company_reply!.helpful_count || 0})</span>
                          </button>

                          {/* Not Helpful Button for Reply */}
                          <button
                            onClick={() => handleReplyVote(review.company_reply!.id, 'not_helpful')}
                            className={`flex items-center space-x-1 rtl:space-x-reverse px-2 py-1 rounded transition-colors duration-200 ${
                              review.company_reply!.user_vote_type === 'not_helpful'
                                ? 'bg-red-100 text-red-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            disabled={!user}
                          >
                            <ThumbsDown className="h-3 w-3" />
                            <span className="text-xs">{text[language].notHelpful}</span>
                            <span className="text-xs">({review.company_reply!.not_helpful_count || 0})</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {/* Report Reply Button - Only show for authenticated users who can report this reply */}
                          {user && canReportReply(review.company_reply) && (
                            <button
                              onClick={() => handleReportReplyClick(review.company_reply!)}
                              className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600 hover:text-red-500 transition-colors duration-200"
                            >
                              <Flag className="h-3 w-3" />
                              <span className="text-xs">{text[language].report}</span>
                            </button>
                          )}

                          {/* Share Reply Button - Always visible */}
                          <button 
                            onClick={() => handleShareReply(review.company_reply!.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600 hover:text-primary-500 transition-colors duration-200"
                          >
                            <Share2 className="h-3 w-3" />
                            <span className="text-xs">{text[language].share}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show reply input for company representatives (NEW LOGIC)
                    isCompanyRepresentative && !checkingRepresentative && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
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
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {(reportingReviewId || reportingReplyId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {reportingReviewId ? text[language].reportReview : text[language].reportReply}
              </h3>
              <button
                onClick={() => {
                  setReportingReviewId(null);
                  setReportingReplyId(null);
                  setReportReason('');
                  setReportDetails('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].reportReason}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={submittingReport}
                >
                  <option value="">{language === 'ar' ? 'اختر السبب' : 'Select reason'}</option>
                  <option value="inappropriate">{text[language].inappropriateContent}</option>
                  <option value="spam">{text[language].spam}</option>
                  <option value="fake">{text[language].fakeReview}</option>
                  <option value="other">{text[language].other}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].reportDetails}
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  disabled={submittingReport}
                />
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setReportingReviewId(null);
                    setReportingReplyId(null);
                    setReportReason('');
                    setReportDetails('');
                  }}
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
                    <>
                      <Flag className="h-4 w-4" />
                      <span>{text[language].submitReport}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default CompanyProfile;