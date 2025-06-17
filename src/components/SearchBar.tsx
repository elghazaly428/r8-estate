import React, { useState, useRef, useEffect } from 'react';
import { Search, Building2, Tag, Star, ChevronDown, X } from 'lucide-react';
import { searchCompaniesWithRatings, CompanySearchResult, Category, getAllCategories } from '../lib/supabase';

interface SearchBarProps {
  language: 'ar' | 'en';
  onSearch?: (query: string, categoryId?: number | null) => void;
  onCompanySelect?: (companyId: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ language, onSearch, onCompanySelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanySearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const text = {
    ar: {
      placeholder: 'ابحث عن شركة...',
      companies: 'الشركات',
      categories: 'الفئات',
      searchButton: 'بحث',
      searching: 'جاري البحث...',
      noResults: 'لا توجد نتائج',
      reviews: 'تقييم',
      allCategories: 'جميع الفئات',
      searchCategories: 'البحث في الفئات...',
      loadingCategories: 'جاري تحميل الفئات...'
    },
    en: {
      placeholder: 'Search for a company...',
      companies: 'Companies',
      categories: 'Categories',
      searchButton: 'Search',
      searching: 'Searching...',
      noResults: 'No results found',
      reviews: 'reviews',
      allCategories: 'All Categories',
      searchCategories: 'Search categories...',
      loadingCategories: 'Loading categories...'
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('🔄 Fetching categories from database...');
        
        const categoriesData = await getAllCategories();
        
        console.log('✅ Categories fetched successfully:', categoriesData.length, 'categories');
        console.log('📋 Categories data:', categoriesData.slice(0, 3));
        
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        setCategories([]);
        setFilteredCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on search query
  useEffect(() => {
    if (categorySearchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()) || false
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearchQuery, categories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (searchRef.current && !searchRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setIsCategoryDropdownOpen(false);
        setCategorySearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function with debouncing
  useEffect(() => {
    const searchData = async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setIsDropdownOpen(true);

        try {
          const companiesResult = await searchCompaniesWithRatings(searchQuery.trim());
          setCompanies(companiesResult);
        } catch (error) {
          console.error('Search error:', error);
          setCompanies([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsDropdownOpen(false);
        setCompanies([]);
      }
    };

    const debounceTimer = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery.trim(), selectedCategoryId);
      setIsDropdownOpen(false);
      setIsCategoryDropdownOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCompanyClick = (company: CompanySearchResult) => {
    setSearchQuery(company.name || '');
    setIsDropdownOpen(false);
    if (onCompanySelect && company.id) {
      onCompanySelect(company.id);
    }
  };

  const handleCategorySelect = (categoryId: number | null, categoryName?: string) => {
    console.log('📂 Category selected:', { id: categoryId, name: categoryName });
    setSelectedCategoryId(categoryId);
    setIsCategoryDropdownOpen(false);
    setCategorySearchQuery('');
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategoryId) return text[language].allCategories;
    const category = categories.find(cat => cat.id === selectedCategoryId);
    return category?.name || text[language].allCategories;
  };

  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${Math.floor(count / 1000)}K`;
    }
    return count.toString();
  };

  const hasResults = companies.length > 0;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        {/* Main Search Bar with Three Components */}
        <div className="flex bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-primary-500 transition-colors duration-300 overflow-hidden">
          
          {/* Text Input Field - Right side in RTL */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={text[language].placeholder}
              className={`w-full px-6 py-4 text-lg focus:outline-none ${
                language === 'ar' ? 'text-right' : 'text-left'
              }`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Vertical Separator */}
          <div className="w-px bg-gray-200"></div>

          {/* Category Dropdown - Improved Version */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Category dropdown clicked, current state:', isCategoryDropdownOpen);
                console.log('📊 Available categories:', categories.length);
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                if (isCategoryDropdownOpen) {
                  setCategorySearchQuery('');
                }
              }}
              className="h-full px-6 py-4 text-gray-700 hover:text-primary-500 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 rtl:space-x-reverse whitespace-nowrap min-w-0 focus:outline-none focus:bg-gray-50"
            >
              <span className="text-sm font-medium truncate max-w-32">
                {getSelectedCategoryName()}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
                isCategoryDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Category Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-80 max-h-80 overflow-hidden">
                
                {/* Header with Search */}
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                    <Tag className="h-4 w-4 text-primary-500" />
                    <span className="font-semibold text-dark-500 text-sm">{text[language].categories}</span>
                  </div>
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
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Scrollable Category List */}
                <div className="max-h-60 overflow-y-auto">
                  {loadingCategories ? (
                    /* Loading State */
                    <div className="px-4 py-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
                      <p className="text-gray-500 text-sm">{text[language].loadingCategories}</p>
                    </div>
                  ) : (
                    <>
                      {/* All Categories Option */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategorySelect(null, text[language].allCategories);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 ${
                          !selectedCategoryId ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <X className="h-4 w-4 text-gray-400" />
                          <span>{text[language].allCategories}</span>
                        </div>
                      </button>
                      
                      {/* Render Categories from Database */}
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('✅ Category clicked:', category.name);
                              handleCategorySelect(category.id, category.name || undefined);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                              selectedCategoryId === category.id ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{category.name || 'Unnamed Category'}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        /* No Categories Available */
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          {categorySearchQuery ? text[language].noResults : (language === 'ar' ? 'لا توجد فئات متاحة' : 'No categories available')}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer with count */}
                {!loadingCategories && categories.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      {language === 'ar' 
                        ? `${filteredCategories.length} من ${categories.length} فئة`
                        : `${filteredCategories.length} of ${categories.length} categories`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vertical Separator */}
          <div className="w-px bg-gray-200"></div>

          {/* Search Button - Left side in RTL */}
          <button
            type="button"
            onClick={handleSearch}
            className="btn-primary px-8 py-4 flex items-center space-x-2 rtl:space-x-reverse hover-lift bg-primary-500 hover:bg-primary-600 text-white transition-colors duration-300"
          >
            <Search className="h-5 w-5" />
            <span className="font-medium hidden sm:inline">
              {text[language].searchButton}
            </span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchQuery.length >= 2 && (
          <div className="search-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-40 max-h-96 overflow-y-auto">
            
            {/* Loading State */}
            {isSearching && (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">{text[language].searching}</p>
              </div>
            )}

            {/* Companies Section */}
            {!isSearching && companies.length > 0 && (
              <div className="p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                  <Building2 className="h-5 w-5 text-primary-500" />
                  <h3 className="font-bold text-dark-500 text-lg">{text[language].companies}</h3>
                </div>
                <div className="space-y-1">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      className="w-full text-left hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200 group"
                      onClick={() => handleCompanyClick(company)}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
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
                        
                        <div className="font-bold text-gray-900 text-base group-hover:text-primary-500 transition-colors duration-200 flex-shrink-0">
                          {company.name || 'Unnamed Company'}
                        </div>
                        
                        {company.website && (
                          <>
                            <span className="text-gray-400 text-sm">•</span>
                            <div className="text-sm text-gray-500 truncate flex-shrink min-w-0">
                              {company.website.replace(/^https?:\/\//, '')}
                            </div>
                          </>
                        )}
                        
                        {company.review_count > 0 && (
                          <>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-500 text-sm flex-shrink-0">
                              {formatReviewCount(company.review_count)} {text[language].reviews}
                            </span>
                          </>
                        )}
                        
                        <div className="flex-grow"></div>
                        {company.avg_rating > 0 && (
                          <div className="flex items-center space-x-1 rtl:space-x-reverse bg-green-500 text-white px-2 py-1 rounded text-xs font-bold flex-shrink-0">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{company.avg_rating}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isSearching && !hasResults && searchQuery.length >= 2 && (
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500">{text[language].noResults}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;