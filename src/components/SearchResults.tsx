import React, { useState, useEffect } from 'react';
import { Star, Check, Building2, Calendar, ExternalLink, Filter } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { searchCompanies, getAllCompanies, Company, getAllCategories, Category, supabase } from '../lib/supabase';

interface SearchResultsProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number) => void;
  searchQuery?: string;
  categoryId?: number | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  language, 
  onLanguageChange, 
  onNavigate, 
  searchQuery = '', 
  categoryId = null 
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCategoryName, setCurrentCategoryName] = useState<string>('');

  const text = {
    ar: {
      searchResults: 'نتائج البحث',
      filterResults: 'تنقية النتائج',
      rating: 'التقييم',
      categories: 'الفئات',
      reviews: 'مراجعة',
      viewProfile: 'عرض الملف الشخصي',
      established: 'تأسست في',
      resultsFound: 'نتيجة',
      clearFilters: 'مسح الفلاتر',
      showFilters: 'إظهار الفلاتر',
      hideFilters: 'إخفاء الفلاتر',
      searchingFor: 'البحث عن',
      categoryFilter: 'تصفية حسب الفئة',
      loading: 'جاري البحث...',
      noResults: 'لا توجد نتائج'
    },
    en: {
      searchResults: 'Search Results',
      filterResults: 'Filter Results',
      rating: 'Rating',
      categories: 'Categories',
      reviews: 'reviews',
      viewProfile: 'View Profile',
      established: 'Established',
      resultsFound: 'results found',
      clearFilters: 'Clear Filters',
      showFilters: 'Show Filters',
      hideFilters: 'Hide Filters',
      searchingFor: 'Searching for',
      categoryFilter: 'Filtering by category',
      loading: 'Searching...',
      noResults: 'No results found'
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        let results: Company[] = [];

        if (categoryId) {
          // Filter by category
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          results = data || [];

          // Find category name for display
          const category = categories.find(cat => cat.id === categoryId);
          setCurrentCategoryName(category?.name || '');
        } else if (searchQuery.trim()) {
          // Search by query
          results = await searchCompanies(searchQuery);
        } else {
          // Show all companies if no search query or category
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          results = data || [];
        }

        setCompanies(results);
      } catch (error) {
        console.error('Search error:', error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [searchQuery, categoryId, categories]);

  const renderStars = (rating: number, interactive: boolean = false, onStarClick?: (rating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => interactive && onStarClick && onStarClick(i)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-200`}
          disabled={!interactive}
        >
          <Star
            className={`h-5 w-5 ${
              i <= rating 
                ? 'fill-current text-highlight-500' 
                : interactive && selectedRating && i <= selectedRating
                ? 'fill-current text-highlight-300'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedRating(null);
    setSelectedCategories([]);
  };

  const FilterSidebar = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-dark-500">
          {text[language].filterResults}
        </h2>
        <button
          onClick={clearFilters}
          className="text-sm text-primary-500 hover:text-primary-600 transition-colors duration-200"
        >
          {text[language].clearFilters}
        </button>
      </div>

      {/* Rating Filter */}
      <div className="mb-8">
        <h3 className="font-semibold text-dark-500 mb-4">
          {text[language].rating}
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border transition-all duration-200 ${
                selectedRating === rating
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                {renderStars(rating)}
              </div>
              <span className="text-sm text-gray-600">
                {language === 'ar' ? 'فأكثر' : '& up'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories Filter */}
      <div>
        <h3 className="font-semibold text-dark-500 mb-4">
          {text[language].categories}
        </h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id.toString())}
                  onChange={() => handleCategoryChange(category.id.toString())}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                  selectedCategories.includes(category.id.toString())
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {selectedCategories.includes(category.id.toString()) && (
                    <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-700 flex-1">
                {category.name || 'Unnamed Category'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="h-4 w-4" />
            <span>{isMobileFilterOpen ? text[language].hideFilters : text[language].showFilters}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterSidebar />
          </div>

          {/* Mobile Filter Sidebar */}
          {isMobileFilterOpen && (
            <div className="lg:hidden col-span-1 mb-6">
              <FilterSidebar />
            </div>
          )}

          {/* Main Results Column */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-dark-500 mb-2">
                {text[language].searchResults}
              </h1>
              {searchQuery && (
                <p className="text-gray-600 mb-2">
                  {text[language].searchingFor}: "{searchQuery}"
                </p>
              )}
              {categoryId && currentCategoryName && (
                <p className="text-gray-600 mb-2">
                  {text[language].categoryFilter}: {currentCategoryName}
                </p>
              )}
              <p className="text-gray-600">
                {companies.length} {text[language].resultsFound}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600">{text[language].loading}</p>
              </div>
            )}

            {/* No Results */}
            {!loading && companies.length === 0 && (searchQuery || categoryId) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">{text[language].noResults}</p>
              </div>
            )}

            {/* Company Results */}
            {!loading && companies.length > 0 && (
              <div className="space-y-6">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="hover-lift bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary-500 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start space-x-4 rtl:space-x-reverse mb-4 md:mb-0">
                        {/* Company Logo */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                          {company.logo_url ? (
                            <img 
                              src={company.logo_url} 
                              alt={company.name || 'Company Logo'} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            '🏢'
                          )}
                        </div>

                        {/* Company Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-dark-500 mb-1">
                            {company.name || 'Company Name'}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {language === 'ar' ? 'خدمات عقارية' : 'Real Estate Services'}
                          </p>
                          
                          {/* Rating */}
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              {renderStars(4.5)}
                            </div>
                            <span className="font-bold text-dark-500">
                              4.5
                            </span>
                            <span className="text-gray-500 text-sm">
                              (0 {text[language].reviews})
                            </span>
                          </div>

                          {/* Establishment Date */}
                          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {text[language].established} {new Date(company.created_at).getFullYear()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <div className="flex-shrink-0">
                        <button 
                          onClick={() => onNavigate('company', company.id)}
                          className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift flex items-center space-x-2 rtl:space-x-reverse"
                        >
                          <span>{text[language].viewProfile}</span>
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default SearchResults;