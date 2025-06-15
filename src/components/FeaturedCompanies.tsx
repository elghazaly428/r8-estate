import React, { useState, useEffect } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeaturedCompaniesProps {
  language: 'ar' | 'en';
  onNavigate: (page: string, companyId?: number) => void;
}

interface FeaturedCompany {
  id: number;
  name: string | null;
  logo_url: string | null;
  website: string | null;
  location: string | null;
  category_name: string | null;
  avg_rating: number;
  review_count: number;
}

const FeaturedCompanies: React.FC<FeaturedCompaniesProps> = ({ language, onNavigate }) => {
  const [companies, setCompanies] = useState<FeaturedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const text = {
    ar: {
      title: 'الشركات الأعلى تقييماً',
      reviews: 'تقييم',
      visitProfile: 'عرض الملف الشخصي',
      loading: 'جاري التحميل...',
      noCompanies: 'لا توجد شركات متاحة',
      errorLoading: 'خطأ في تحميل الشركات'
    },
    en: {
      title: 'Featured Companies',
      reviews: 'reviews',
      visitProfile: 'View Profile',
      loading: 'Loading...',
      noCompanies: 'No companies available',
      errorLoading: 'Error loading companies'
    }
  };

  useEffect(() => {
    const fetchFeaturedCompanies = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call the get_featured_companies RPC function
        const { data, error } = await supabase.rpc('get_featured_companies');

        if (error) {
          console.error('Error fetching featured companies:', error);
          throw error;
        }

        setCompanies(data || []);
      } catch (error: any) {
        console.error('Error in fetchFeaturedCompanies:', error);
        setError(error.message || 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCompanies();
  }, []);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-current text-highlight-500" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="h-4 w-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="h-4 w-4 fill-current text-highlight-500" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }

    return stars;
  };

  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${Math.floor(count / 1000)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
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

  if (error) {
    return (
      <section className="py-16 bg-white">
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

  if (companies.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-500 mb-4">
              {text[language].title}
            </h2>
          </div>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-gray-500 text-lg">{text[language].noCompanies}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dark-500 mb-4">
            {text[language].title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="hover-lift bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:border-primary-500 transition-all duration-300 cursor-pointer"
            >
              {/* Company Logo */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl mx-auto">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={company.name || 'Company Logo'} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    '🏢'
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-dark-500 mb-1 text-lg">
                  {company.name || 'Company Name'}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {company.category_name || (language === 'ar' ? 'خدمات عقارية' : 'Real Estate Services')}
                </p>
                {company.location && (
                  <p className="text-gray-500 text-xs">
                    {company.location}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse mb-4">
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {renderStars(company.avg_rating)}
                </div>
                <span className="font-bold text-dark-500 mr-2 rtl:ml-2">
                  {company.avg_rating > 0 ? company.avg_rating.toFixed(1) : '0.0'}
                </span>
                <span className="text-gray-500 text-sm">
                  ({formatReviewCount(company.review_count)} {text[language].reviews})
                </span>
              </div>

              {/* Visit Profile Button */}
              <button 
                onClick={() => onNavigate('company', company.id)}
                className="w-full btn-secondary flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-500 hover:text-white transition-all duration-300"
              >
                <span>{text[language].visitProfile}</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCompanies;