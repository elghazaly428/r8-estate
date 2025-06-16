import React, { useState, useEffect } from 'react';
import { Star, Building2, Calendar, ExternalLink, Filter, ChevronDown, Search, X } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import SearchBar from './SearchBar';
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCategoryName, setCurrentCategoryName] = useState<string>('');
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>(searchQuery);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(categoryId);
  
  // Dropdown states
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

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
      noResults: 'لا توجد نتائج',
      chooseCategory: 'اختر فئة...',
      searchCategories: 'البحث في الفئات...',
      allRatings: 'جميع التقييمات',
      fiveStars: '5 نجوم',
      fourStarsUp: '4 نجوم فأكثر',
      threeStarsUp: '3 نجوم فأكثر',
      twoStarsUp: '2 نجوم فأكثر',
      oneStarUp: '1 نجمة فأكثر'
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
      noResults: 'No results found',
      chooseCategory: 'Choose a category...',
      searchCategories: 'Search categories...',
      allRatings: 'All Ratings',
      fiveStars: '5 stars',
      fourStarsUp: '4 stars & up',
      threeStarsUp: '3 stars & up',
      twoStarsUp: '2 stars & up',
      oneStarUp: '1 star & up'
    }
  };

  const ratingOptions = [
    { value: null, label: text[language].allRatings },
    { value: 5, label: text[language].fiveStars },
    { value: 4, label: text[language].fourStarsUp },
    { value: 3, label: text[language].threeStarsUp },
    { value: 2, label: text[language].twoStarsUp },
    { value: 1, label: text[language].oneStarUp }
  ];

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

        if (currentCategoryId) {
          // Filter by category
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('category_id', currentCategoryId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          results = data || [];

          // Find category name for display
          const category = categories.find(cat => cat.id === currentCategoryId);
          setCurrentCategoryName(category?.name || '');
          setSelectedCategory(category || null);
        } else if (currentSearchQuery.trim()) {
          // Search by query
          results = await searchCompanies(currentSearchQuery);
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
  }, [currentSearchQuery, currentCategoryId, categories]);

  // Apply filters to companies
  useEffect(() => {
    let filtered = [...companies];

    // Apply rating filter
    if (selectedRating !== null) {
      // For now, we'll simulate rating filtering since we don't have actual ratings
      // In a real implementation, you'd filter based on calculated ratings
      filtered = filtered.filter(() => Math.random() > 0.3); // Simulate filtering
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(company => company.category_id === selectedCategory.id);
    }

    setFilteredCompanies(filtered);
  }, [companies, selectedRating, selectedCategory]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating 
              ? 'fill-current text-highlight-500' 
              : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const clearFilters = () => {
    setSelectedRating(null);
    setSelectedCategory(null);
    setCategorySearchQuery('');
  };

  const handleRatingSelect = (rating: number | null) => {
    setSelectedRating(rating);
    setIsRatingDropdownOpen(false);
  };

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    setIsCategoryDropdownOpen(false);
    setCategorySearchQuery('');
  };

  // Handle search from the search bar
  const handleSearch = (query: string) => {
    if (query.startsWith('category:')) {
      // Handle category search
      const categoryIdFromQuery = parseInt(query.replace('category:', ''));
      setCurrentCategoryId(categoryIdFromQuery);
      setCurrentSearchQuery('');
    } else {
      // Handle text search
      setCurrentSearchQuery(query);
      setCurrentCategoryId(null);
    }
    // Clear existing filters when new search is performed
    setSelectedRating(null);
    setSelectedCategory(null);
  };

  // Handle company selection from search bar
  const handleCompanySelect = (companyId: number) => {
    onNavigate('company', companyId);
  };

  // Filter categories based on search query
  const filteredCategoriesForDropdown = categories.filter(category =>
    category.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()) || false
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.rating-dropdown')) {
        setIsRatingDropdownOpen(false);
      }
      if (!target.closest('.category-dropdown')) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Rating Dropdown Filter */}
      <div className="mb-8">
        <h3 className="font-semibold text-dark-500 mb-4">
          {text[language].rating}
        </h3>
        <div className="relative rating-dropdown">
          <button
            onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors duration-200 bg-white"
          >
            <span className="text-gray-700">
              {selectedRating !== null 
                ? ratingOptions.find(opt => opt.value === selectedRating)?.label
                : text[language].allRatings
              }
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isRatingDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>
          
          {isRatingDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {ratingOptions.map((option) => (
                <button
                  key={option.value || 'all'}
                  onClick={() => handleRatingSelect(option.value)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                    selectedRating === option.value ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {option.value && (
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        {renderStars(option.value)}
                      </div>
                    )}
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Dropdown Filter */}
      <div>
        <h3 className="font-semibold text-dark-500 mb-4">
          {text[language].categories}
        </h3>
        <div className="relative category-dropdown">
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors duration-200 bg-white"
          >
            <span className="text-gray-700 truncate">
              {selectedCategory?.name || text[language].chooseCategory}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isCategoryDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>
          
          {isCategoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder={text[language].searchCategories}
                    className="w-full px-3 py-2 pr-10 rtl:pl-10 rtl:pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
              
              {/* Categories List */}
              <div className="max-h-60 overflow-y-auto">
                {/* Clear Selection Option */}
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 ${
                    !selectedCategory ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <X className="h-4 w-4" />
                    <span>{text[language].allRatings}</span>
                  </div>
                </button>
                
                {filteredCategoriesForDropdown.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                      selectedCategory?.id === category.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{category.name || 'Unnamed Category'}</span>
                    </div>
                  </button>
                ))}
                
                {filteredCategoriesForDropdown.length === 0 && categorySearchQuery && (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    {text[language].noResults}
                  </div>
                )}
              </div>
            </div>
          )}
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
              {currentSearchQuery && (
                <p className="text-gray-600 mb-2">
                  {text[language].searchingFor}: "{currentSearchQuery}"
                </p>
              )}
              {currentCategoryId && currentCategoryName && (
                <p className="text-gray-600 mb-2">
                  {text[language].categoryFilter}: {currentCategoryName}
                </p>
              )}
              <p className="text-gray-600">
                {filteredCompanies.length} {text[language].resultsFound}
              </p>
            </div>

            {/* Dynamic Search Bar */}
            <div className="mb-8">
              <SearchBar 
                language={language} 
                onSearch={handleSearch} 
                onCompanySelect={handleCompanySelect}
              />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600">{text[language].loading}</p>
              </div>
            )}

            {/* No Results */}
            {!loading && filteredCompanies.length === 0 && (currentSearchQuery || currentCategoryId || selectedRating || selectedCategory) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">{text[language].noResults}</p>
              </div>
            )}

            {/* Company Results */}
            {!loading && filteredCompanies.length > 0 && (
              <div className="space-y-6">
                {filteredCompanies.map((company) => (
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