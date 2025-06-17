import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Building2, 
  Calendar, 
  ExternalLink, 
  MapPin, 
  User, 
  ThumbsUp, 
  ThumbsDown,
  Flag, 
  Share2, 
  MessageSquare,
  Edit,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  Award,
  TrendingUp
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
  CompanyWithCategory, 
  ReviewWithProfile 
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
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);
  const [reportingReplyId, setReportingReplyId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const text = {
    ar: {
      backToSearch: 'العودة للبحث',
      writeReview: 'اكتب تقييم',
      claimProfile: 'اطلب ملكية الصفحة',
      website: 'الموقع الإلكتروني',
      established: 'تأسست في',
      category: 'الفئة',
      location: 'الموقع',
      description: 'الوصف',
      reviews: 'التقييمات',
      review: 'تقييم',
      overallRating: 'التقييم العام',
      communication: 'التواصل',
      responsiveness: 'سرعة الاستجابة',
      valueForMoney: 'القيمة مقابل المال',
      friendliness: 'الود والاحترام',
      helpful: 'مفيد',
      notHelpful: 'غير مفيد',
      share: 'مشاركة',
      report: 'إبلاغ',
      anonymous: 'مجهول',
      daysAgo: 'منذ',
      day: 'يوم',
      companyReply: 'رد الشركة',
      noReviews: 'لا توجد تقييمات حتى الآن',
      beFirst: 'كن أول من يكتب تقييماً لهذه الشركة',
      loading: 'جاري التحميل...',
      companyNotFound: 'الشركة غير موجودة',
      backToHome: 'العودة للرئيسية',
      reportReview: 'إبلاغ عن التقييم',
      reportReply: 'إبلاغ عن الرد',
      reportReason: 'سبب الإبلاغ',
      reportDetails: 'تفاصيل إضافية (اختياري)',
      submitReport: 'إرسال البلاغ',
      cancel: 'إلغاء',
      submitting: 'جاري الإرسال...',
      reportSubmitted: 'تم إرسال البلاغ بنجاح',
      loginToVote: 'يجب تسجيل الدخول للتصويت',
      loginToReport: 'يجب تسجيل الدخول للإبلاغ',
      loginToReview: 'يجب تسجيل الدخول لكتابة تقييم'
    },
    en: {
      backToSearch: 'Back to Search',
      writeReview: 'Write Review',
      claimProfile: 'Claim Profile',
      website: 'Website',
      established: 'Established',
      category: 'Category',
      location: 'Location',
      description: 'Description',
      reviews: 'Reviews',
      review: 'review',
      overallRating: 'Overall Rating',
      communication: 'Communication',
      responsiveness: 'Responsiveness',
      valueForMoney: 'Value for Money',
      friendliness: 'Friendliness',
      helpful: 'Helpful',
      notHelpful: 'Not Helpful',
      share: 'Share',
      report: 'Report',
      anonymous: 'Anonymous',
      daysAgo: '',
      day: 'day ago',
      companyReply: 'Company Reply',
      noReviews: 'No reviews yet',
      beFirst: 'Be the first to write a review for this company',
      loading: 'Loading...',
      companyNotFound: 'Company Not Found',
      backToHome: 'Back to Home',
      reportReview: 'Report Review',
      reportReply: 'Report Reply',
      reportReason: 'Report Reason',
      reportDetails: 'Additional Details (Optional)',
      submitReport: 'Submit Report',
      cancel: 'Cancel',
      submitting: 'Submitting...',
      reportSubmitted: 'Report submitted successfully',
      loginToVote: 'Please log in to vote',
      loginToReport: 'Please log in to report',
      loginToReview: 'Please log in to write a review'
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

  const handleVoteToggle = async (reviewId: number, voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      toast.error(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReviewVote(reviewId, user.id, voteType);
      
      if (result.success) {
        // Update the reviews state with new vote data
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                helpful_count: result.helpfulCount,
                not_helpful_count: result.notHelpfulCount,
                user_vote: result.userVote
              }
            : review
        ));
      }
    } catch (error: any) {
      console.error('Error toggling vote:', error);
      toast.error('Error updating vote');
    }
  };

  const handleReplyVoteToggle = async (replyId: string, voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      toast.error(text[language].loginToVote);
      return;
    }

    try {
      const result = await toggleReplyVote(replyId, user.id, voteType);
      
      if (result.success) {
        // Update the reviews state with new reply vote data
        setReviews(prev => prev.map(review => ({
          ...review,
          company_reply: review.company_reply?.id === replyId 
            ? {
                ...review.company_reply,
                helpful_count: result.helpfulCount,
                not_helpful_count: result.notHelpfulCount,
                user_vote: result.userVote
              }
            : review.company_reply
        })));
      }
    } catch (error: any) {
      console.error('Error toggling reply vote:', error);
      toast.error('Error updating vote');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(text[language].loginToReport);
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Please provide a reason for the report');
      return;
    }

    setSubmittingReport(true);

    try {
      let result;
      if (reportingReviewId) {
        result = await submitReport(reportingReviewId, user.id, reportReason, reportDetails);
      } else if (reportingReplyId) {
        result = await submitReplyReport(reportingReplyId, user.id, reportReason, reportDetails);
      }

      if (result?.success) {
        toast.success(text[language].reportSubmitted);
        setReportingReviewId(null);
        setReportingReplyId(null);
        setReportReason('');
        setReportDetails('');
      } else {
        toast.error(result?.error || 'Error submitting report');
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error('Error submitting report');
    } finally {
      setSubmittingReport(false);
    }
  };

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
            <div className="text-6xl mb-4">🏢</div>
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

  const averageRating = calculateAverageRating();

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('search')}
          className="flex items-center space-x-2 rtl:space-x-reverse text-primary-500 hover:text-primary-600 transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{text[language].backToSearch}</span>
        </button>

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
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-dark-500 mb-2">
                  {company.name || 'Company Name'}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    {renderStars(averageRating)}
                  </div>
                  <span className="font-bold text-dark-500 text-lg">
                    {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-gray-500">
                    ({reviews.length} {reviews.length === 1 ? text[language].review : text[language].reviews})
                  </span>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {company.categories && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{text[language].category}: {company.categories.name}</span>
                    </div>
                  )}
                  
                  {company.established_in && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{text[language].established}: {company.established_in}</span>
                    </div>
                  )}
                  
                  {company.location && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{text[language].location}: {company.location}</span>
                    </div>
                  )}
                  
                  {company.website && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
                      <ExternalLink className="h-4 w-4" />
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
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 lg:flex-shrink-0">
              <button 
                onClick={() => {
                  if (!user) {
                    toast.error(text[language].loginToReview);
                    return;
                  }
                  onNavigate('write-review', companyId!);
                }}
                className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Edit className="h-4 w-4" />
                <span>{text[language].writeReview}</span>
              </button>
              
              <button className="btn-secondary px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                {text[language].claimProfile}
              </button>
            </div>
          </div>

          {/* Company Description */}
          {company.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-dark-500 mb-3">{text[language].description}</h3>
              <p className="text-gray-700 leading-relaxed">{company.description}</p>
            </div>
          )}
        </div>

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
                onClick={() => {
                  if (!user) {
                    toast.error(text[language].loginToReview);
                    return;
                  }
                  onNavigate('write-review', companyId!);
                }}
                className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
              >
                {text[language].writeReview}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-6">
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
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {review.body}
                      </p>
                    )}

                    {/* Detailed Ratings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {review.rating_communication && (
                        <div>
                          <span className="text-gray-600">{text[language].communication}:</span>
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            {renderStars(review.rating_communication)}
                          </div>
                        </div>
                      )}
                      {review.rating_responsiveness && (
                        <div>
                          <span className="text-gray-600">{text[language].responsiveness}:</span>
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            {renderStars(review.rating_responsiveness)}
                          </div>
                        </div>
                      )}
                      {review.rating_value && (
                        <div>
                          <span className="text-gray-600">{text[language].valueForMoney}:</span>
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            {renderStars(review.rating_value)}
                          </div>
                        </div>
                      )}
                      {review.rating_friendliness && (
                        <div>
                          <span className="text-gray-600">{text[language].friendliness}:</span>
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            {renderStars(review.rating_friendliness)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      {/* Helpful Button */}
                      <button
                        onClick={() => handleVoteToggle(review.id, 'helpful')}
                        className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors duration-200 ${
                          review.user_vote === 'helpful'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{text[language].helpful}</span>
                        {(review.helpful_count || 0) > 0 && (
                          <span className="text-sm">({review.helpful_count})</span>
                        )}
                      </button>

                      {/* Not Helpful Button */}
                      <button
                        onClick={() => handleVoteToggle(review.id, 'not_helpful')}
                        className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors duration-200 ${
                          review.user_vote === 'not_helpful'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{text[language].notHelpful}</span>
                        {(review.not_helpful_count || 0) > 0 && (
                          <span className="text-sm">({review.not_helpful_count})</span>
                        )}
                      </button>

                      <button className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-gray-800 transition-colors duration-200">
                        <Share2 className="h-4 w-4" />
                        <span>{text[language].share}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setReportingReviewId(review.id)}
                      className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-red-600 transition-colors duration-200"
                    >
                      <Flag className="h-4 w-4" />
                      <span>{text[language].report}</span>
                    </button>
                  </div>

                  {/* Company Reply */}
                  {review.company_reply && (
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">{text[language].companyReply}</span>
                        <span className="text-blue-600 text-sm">
                          {formatDate(review.company_reply.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {review.company_reply.reply_body}
                      </p>

                      {/* Reply Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          {/* Helpful Button for Reply */}
                          <button
                            onClick={() => handleReplyVoteToggle(review.company_reply!.id, 'helpful')}
                            className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors duration-200 ${
                              review.company_reply!.user_vote === 'helpful'
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{text[language].helpful}</span>
                            {(review.company_reply!.helpful_count || 0) > 0 && (
                              <span className="text-sm">({review.company_reply!.helpful_count})</span>
                            )}
                          </button>

                          {/* Not Helpful Button for Reply */}
                          <button
                            onClick={() => handleReplyVoteToggle(review.company_reply!.id, 'not_helpful')}
                            className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors duration-200 ${
                              review.company_reply!.user_vote === 'not_helpful'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>{text[language].notHelpful}</span>
                            {(review.company_reply!.not_helpful_count || 0) > 0 && (
                              <span className="text-sm">({review.company_reply!.not_helpful_count})</span>
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => setReportingReplyId(review.company_reply!.id)}
                          className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-red-600 transition-colors duration-200"
                        >
                          <Flag className="h-4 w-4" />
                          <span>{text[language].report}</span>
                        </button>
                      </div>
                    </div>
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
            <h3 className="text-xl font-bold text-dark-500 mb-4">
              {reportingReviewId ? text[language].reportReview : text[language].reportReply}
            </h3>
            
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label htmlFor="reportReason" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].reportReason}
                </label>
                <select
                  id="reportReason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="fake">Fake review</option>
                  <option value="offensive">Offensive language</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="reportDetails" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].reportDetails}
                </label>
                <textarea
                  id="reportDetails"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
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
                  type="submit"
                  disabled={submittingReport || !reportReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReport ? text[language].submitting : text[language].submitReport}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer language={language} />
    </div>
  );
};

export default CompanyProfile;