import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Calendar, 
  User, 
  FileText, 
  Shield, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { supabase, getCompanyById, Company } from '../lib/supabase';

interface WriteReviewProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number) => void;
  companyId?: number | null;
}

interface ReviewFormData {
  title: string;
  body: string;
  ratingCommunication: number;
  ratingResponsiveness: number;
  ratingValue: number;
  ratingFriendliness: number;
  dateOfExperience: string;
  isAnonymous: boolean;
  termsAccepted: boolean;
}

const WriteReview: React.FC<WriteReviewProps> = ({ 
  language, 
  onLanguageChange, 
  onNavigate, 
  companyId 
}) => {
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    title: '',
    body: '',
    ratingCommunication: 0,
    ratingResponsiveness: 0,
    ratingValue: 0,
    ratingFriendliness: 0,
    dateOfExperience: '',
    isAnonymous: false,
    termsAccepted: false
  });

  const text = {
    ar: {
      writeReviewFor: 'اكتب تقييم لـ',
      backToCompany: 'العودة إلى الشركة',
      detailedRatings: 'التقييمات التفصيلية',
      communication: 'التواصل',
      responsiveness: 'سرعة الاستجابة',
      valueForMoney: 'القيمة مقابل المال',
      friendliness: 'الود والاحترام',
      reviewDetails: 'تفاصيل التقييم',
      reviewTitle: 'عنوان التقييم',
      reviewTitlePlaceholder: 'اكتب عنواناً مختصراً لتجربتك',
      reviewBody: 'نص التقييم',
      reviewBodyPlaceholder: 'شارك تجربتك التفصيلية مع هذه الشركة...',
      dateOfExperience: 'تاريخ التجربة',
      options: 'خيارات',
      postAnonymously: 'نشر بشكل مجهول',
      termsAgreement: 'أؤكد أن هذا التقييم يعكس تجربتي الشخصية الحقيقية',
      submitReview: 'إرسال التقييم',
      submitting: 'جاري الإرسال...',
      loginRequired: 'يجب تسجيل الدخول لكتابة تقييم',
      loginButton: 'تسجيل الدخول',
      companyNotFound: 'الشركة غير موجودة',
      backToHome: 'العودة للرئيسية',
      loading: 'جاري التحميل...',
      fillAllRatings: 'يرجى تقييم جميع الجوانب (1-5 نجوم)',
      acceptTerms: 'يجب الموافقة على الشروط',
      reviewSubmitted: 'تم إرسال التقييم بنجاح!',
      errorSubmitting: 'حدث خطأ أثناء إرسال التقييم'
    },
    en: {
      writeReviewFor: 'Write a Review for',
      backToCompany: 'Back to Company',
      detailedRatings: 'Detailed Ratings',
      communication: 'Communication',
      responsiveness: 'Responsiveness',
      valueForMoney: 'Value for Money',
      friendliness: 'Friendliness',
      reviewDetails: 'Review Details',
      reviewTitle: 'Review Title',
      reviewTitlePlaceholder: 'Write a brief title for your experience',
      reviewBody: 'Review Text',
      reviewBodyPlaceholder: 'Share your detailed experience with this company...',
      dateOfExperience: 'Date of Experience',
      options: 'Options',
      postAnonymously: 'Post anonymously',
      termsAgreement: 'I affirm that this review reflects my own genuine experience',
      submitReview: 'Submit Review',
      submitting: 'Submitting...',
      loginRequired: 'Please log in to write a review',
      loginButton: 'Log In',
      companyNotFound: 'Company Not Found',
      backToHome: 'Back to Home',
      loading: 'Loading...',
      fillAllRatings: 'Please rate all aspects (1-5 stars)',
      acceptTerms: 'Please accept the terms',
      reviewSubmitted: 'Review submitted successfully!',
      errorSubmitting: 'Error submitting review'
    }
  };

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          // Redirect to login if not authenticated
          onNavigate('login');
          return;
        }

        setUser(user);

        // Fetch company data if companyId is provided
        if (companyId) {
          const companyData = await getCompanyById(companyId);
          if (!companyData) {
            setError('Company not found');
            return;
          }
          setCompany(companyData);
        } else {
          setError('No company ID provided');
        }
      } catch (error: any) {
        console.error('Error loading page:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [companyId, onNavigate]);

  const handleRatingChange = (ratingType: keyof ReviewFormData, rating: number) => {
    setFormData(prev => ({
      ...prev,
      [ratingType]: rating
    }));
  };

  const handleInputChange = (field: keyof ReviewFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStarRating = (
    currentRating: number, 
    onRatingChange: (rating: number) => void,
    label: string
  ) => {
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-dark-500 mb-3">
          {label}
        </label>
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              className="transition-transform duration-200 hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= currentRating
                    ? 'fill-current text-highlight-500'
                    : 'text-gray-300 hover:text-highlight-300'
                }`}
              />
            </button>
          ))}
          <span className="mr-3 rtl:ml-3 rtl:mr-0 text-sm text-gray-600">
            ({currentRating}/5)
          </span>
        </div>
      </div>
    );
  };

  const calculateOverallRating = () => {
    const { ratingCommunication, ratingResponsiveness, ratingValue, ratingFriendliness } = formData;
    if (ratingCommunication && ratingResponsiveness && ratingValue && ratingFriendliness) {
      return (ratingCommunication + ratingResponsiveness + ratingValue + ratingFriendliness) / 4;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;

    // Validation
    const { ratingCommunication, ratingResponsiveness, ratingValue, ratingFriendliness, termsAccepted } = formData;
    
    if (!ratingCommunication || !ratingResponsiveness || !ratingValue || !ratingFriendliness) {
      toast.error(text[language].fillAllRatings);
      return;
    }

    if (!termsAccepted) {
      toast.error(text[language].acceptTerms);
      return;
    }

    setSubmitting(true);

    try {
      const overallRating = calculateOverallRating();

      // Prepare review data
      const reviewData = {
        profile_id: user.id,
        company_id: companyId,
        title: formData.title.trim() || null,
        body: formData.body.trim() || null,
        rating_communication: ratingCommunication,
        rating_responsiveness: ratingResponsiveness,
        rating_value: ratingValue,
        rating_friendliness: ratingFriendliness,
        overall_rating: overallRating,
        date_of_experience: formData.dateOfExperience || null,
        is_anonymous: formData.isAnonymous,
        status: 'published' as const,
        created_at: new Date().toISOString()
      };

      // Insert review into database
      const { error } = await supabase
        .from('reviews')
        .insert([reviewData]);

      if (error) {
        throw error;
      }

      // Success - show message and redirect
      toast.success(text[language].reviewSubmitted);
      onNavigate('company', companyId!);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(`${text[language].errorSubmitting}: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('company', companyId!)}
            className="flex items-center space-x-2 rtl:space-x-reverse text-primary-500 hover:text-primary-600 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{text[language].backToCompany}</span>
          </button>
          
          <h1 className="text-3xl font-bold text-dark-500 mb-2">
            {text[language].writeReviewFor} {company.name}
          </h1>
          <div className="w-16 h-1 bg-primary-500 rounded-full"></div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Detailed Ratings Section */}
            <div>
              <h2 className="text-xl font-bold text-dark-500 mb-6 flex items-center space-x-2 rtl:space-x-reverse">
                <Star className="h-5 w-5 text-highlight-500" />
                <span>{text[language].detailedRatings}</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderStarRating(
                  formData.ratingCommunication,
                  (rating) => handleRatingChange('ratingCommunication', rating),
                  text[language].communication
                )}
                
                {renderStarRating(
                  formData.ratingResponsiveness,
                  (rating) => handleRatingChange('ratingResponsiveness', rating),
                  text[language].responsiveness
                )}
                
                {renderStarRating(
                  formData.ratingValue,
                  (rating) => handleRatingChange('ratingValue', rating),
                  text[language].valueForMoney
                )}
                
                {renderStarRating(
                  formData.ratingFriendliness,
                  (rating) => handleRatingChange('ratingFriendliness', rating),
                  text[language].friendliness
                )}
              </div>
            </div>

            {/* Review Details Section */}
            <div>
              <h2 className="text-xl font-bold text-dark-500 mb-6 flex items-center space-x-2 rtl:space-x-reverse">
                <FileText className="h-5 w-5 text-primary-500" />
                <span>{text[language].reviewDetails}</span>
              </h2>
              
              <div className="space-y-6">
                {/* Review Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-dark-500 mb-2">
                    {text[language].reviewTitle}
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={text[language].reviewTitlePlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    disabled={submitting}
                  />
                </div>

                {/* Review Body */}
                <div>
                  <label htmlFor="body" className="block text-sm font-semibold text-dark-500 mb-2">
                    {text[language].reviewBody}
                  </label>
                  <textarea
                    id="body"
                    rows={6}
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    placeholder={text[language].reviewBodyPlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-vertical"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Date of Experience */}
            <div>
              <h2 className="text-xl font-bold text-dark-500 mb-6 flex items-center space-x-2 rtl:space-x-reverse">
                <Calendar className="h-5 w-5 text-green-500" />
                <span>{text[language].dateOfExperience}</span>
              </h2>
              
              <input
                type="date"
                value={formData.dateOfExperience}
                onChange={(e) => handleInputChange('dateOfExperience', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                disabled={submitting}
              />
            </div>

            {/* Options Section */}
            <div>
              <h2 className="text-xl font-bold text-dark-500 mb-6 flex items-center space-x-2 rtl:space-x-reverse">
                <User className="h-5 w-5 text-purple-500" />
                <span>{text[language].options}</span>
              </h2>
              
              <div className="space-y-4">
                {/* Anonymous Option */}
                <label className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                    className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    disabled={submitting}
                  />
                  <span className="text-gray-700">{text[language].postAnonymously}</span>
                </label>

                {/* Terms Agreement */}
                <label className="flex items-start space-x-3 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                    className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                    disabled={submitting}
                    required
                  />
                  <span className="text-gray-700 leading-relaxed">
                    {text[language].termsAgreement}
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{text[language].submitting}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>{text[language].submitReview}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default WriteReview;