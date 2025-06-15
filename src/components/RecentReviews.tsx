import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RecentReviewsProps {
  language: 'ar' | 'en';
  onNavigate?: (page: string, companyId?: number) => void;
}

interface ReviewData {
  id: number;
  created_at: string;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  is_anonymous: boolean | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  companies: {
    id: number;
    name: string | null;
  } | null;
}

const RecentReviews: React.FC<RecentReviewsProps> = ({ language, onNavigate }) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const text = {
    ar: {
      title: 'أحدث التقييمات',
      daysAgo: 'منذ',
      day: 'يوم',
      days: 'أيام',
      hours: 'ساعات',
      hour: 'ساعة',
      minutes: 'دقائق',
      minute: 'دقيقة',
      now: 'الآن',
      anonymous: 'مجهول',
      loading: 'جاري التحميل...',
      noReviews: 'لا توجد تقييمات حديثة',
      errorLoading: 'خطأ في تحميل التقييمات'
    },
    en: {
      title: 'Recent Reviews',
      daysAgo: '',
      day: 'day ago',
      days: 'days ago',
      hours: 'hours ago',
      hour: 'hour ago',
      minutes: 'minutes ago',
      minute: 'minute ago',
      now: 'just now',
      anonymous: 'Anonymous',
      loading: 'Loading...',
      noReviews: 'No recent reviews',
      errorLoading: 'Error loading reviews'
    }
  };

  // Fetch recent reviews from Supabase
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            created_at,
            title,
            body,
            overall_rating,
            is_anonymous,
            profiles!reviews_profile_id_fkey(first_name, last_name, avatar_url),
            companies!reviews_company_id_fkey(id, name)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) {
          throw error;
        }

        setReviews(data || []);
      } catch (error: any) {
        console.error('Error fetching recent reviews:', error);
        setError(error.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReviews();
  }, []);

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
        return diffMinutes === 1 ? `1 ${text[language].minute}` : `${diffMinutes} ${text[language].minutes}`;
      }
      if (diffHours < 24) {
        return diffHours === 1 ? `1 ${text[language].hour}` : `${diffHours} ${text[language].hours}`;
      }
      return diffDays === 1 ? `1 ${text[language].day}` : `${diffDays} ${text[language].days}`;
    }
  };

  const getReviewerName = (review: ReviewData) => {
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

  const getReviewerAvatar = (review: ReviewData) => {
    if (review.is_anonymous || !review.profiles?.avatar_url) {
      return null;
    }
    return review.profiles.avatar_url;
  };

  const handleCompanyClick = (companyId: number) => {
    if (onNavigate) {
      onNavigate('company', companyId);
    }
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-500 mb-4">
              {text[language].title}
            </h2>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-500 mb-4">
              {text[language].title}
            </h2>
          </div>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-gray-500 text-lg">{text[language].errorLoading}</p>
          </div>
        </div>
      </section>
    );
  }

  // No reviews state
  if (reviews.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-500 mb-4">
              {text[language].title}
            </h2>
          </div>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">{text[language].noReviews}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dark-500 mb-4">
            {text[language].title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary-500 transition-all duration-300 cursor-pointer hover:scale-105"
            >
              {/* Reviewer Info with Avatar */}
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {getReviewerAvatar(review) ? (
                    <img 
                      src={getReviewerAvatar(review)!} 
                      alt="Reviewer Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                
                {/* Name and Date */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-dark-500 text-sm truncate">
                    {getReviewerName(review)}
                  </h4>
                  <p className="text-gray-500 text-xs">
                    {formatTimeAgo(review.created_at)}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 rtl:space-x-reverse mb-3">
                {renderStars(review.overall_rating)}
              </div>

              {/* Review Content */}
              <div className="mb-4">
                {review.title && (
                  <h5 className="font-semibold text-dark-500 text-sm mb-2 line-clamp-2">
                    {review.title}
                  </h5>
                )}
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                  {review.body ? truncateText(review.body) : (review.title || 'No review content')}
                </p>
              </div>

              {/* Company Name - Clickable Link */}
              <div className="pt-3 border-t border-gray-100">
                {review.companies ? (
                  <button
                    onClick={() => handleCompanyClick(review.companies!.id)}
                    className="text-primary-500 hover:text-primary-600 font-medium text-sm transition-colors duration-200 hover:underline"
                  >
                    {review.companies.name || 'Unknown Company'}
                  </button>
                ) : (
                  <span className="text-gray-500 font-medium text-sm">
                    Unknown Company
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentReviews;