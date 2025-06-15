import React, { useState, useRef, useEffect } from 'react';
import { Search, Building2, Tag, Star } from 'lucide-react';
import { searchCompaniesWithRatings, CompanySearchResult, Category, supabase } from '../lib/supabase';

interface SearchBarProps {
  language: 'ar' | 'en';
  onSearch?: (query: string) => void;
  onCompanySelect?: (companyId: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ language, onSearch, onCompanySelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanySearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const text = {
    ar: {
      placeholder: 'شركة، أو فئة...',
      companies: 'الشركات',
      categories: 'الفئات',
      searchButton: 'بحث',
      searching: 'جاري البحث...',
      noResults: 'لا توجد نتائج',
      reviews: 'تقييم'
    },
    en: {
      placeholder: 'Company, or category...',
      companies: 'Companies',
      categories: 'Categories',
      searchButton: 'Search',
      searching: 'Searching...',
      noResults: 'No results found',
      reviews: 'reviews'
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
          // Parallel queries for companies and categories
          const [companiesResult, categoriesResult] = await Promise.all([
            // Companies query - using new RPC function
            searchCompaniesWithRatings(searchQuery.trim()),
            
            // Categories query - search by name
            supabase
              .from('categories')
              .select('id, name')
              .ilike('name', `%${searchQuery.trim()}%`)
              .limit(3)
          ]);

          // Set companies from RPC result
          setCompanies(companiesResult);

          // Set categories from direct query
          if (categoriesResult.error) {
            console.error('Error searching categories:', categoriesResult.error);
            setCategories([]);
          } else {
            setCategories(categoriesResult.data || []);
          }
        } catch (error) {
          console.error('Search error:', error);
          setCompanies([]);
          setCategories([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsDropdownOpen(false);
        setCompanies([]);
        setCategories([]);
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
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setIsDropdownOpen(false);
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

  const handleCategoryClick = (category: Category) => {
    setSearchQuery(category.name || '');
    setIsDropdownOpen(false);
    // Navigate to search results with category filter
    if (onSearch) {
      // This will trigger the search with category filter
      // The parent component should handle category-based navigation
      onSearch(`category:${category.id}`);
    }
  };

  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${Math.floor(count / 1000)}K`;
    }
    return count.toString();
  };

  const hasResults = companies.length > 0 || categories.length > 0;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="flex bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-primary-500 transition-colors duration-300">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={text[language].placeholder}
            className={`flex-1 px-6 py-4 text-lg rounded-r-xl rounded-l-xl focus:outline-none ${
              language === 'ar' ? 'text-right' : 'text-left'
            }`}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            onClick={handleSearch}
            className="btn-primary px-8 py-4 rounded-l-xl rounded-r-xl flex items-center space-x-2 rtl:space-x-reverse hover-lift"
          >
            <Search className="h-5 w-5 text-white" />
            <span className="text-white font-medium hidden sm:inline">
              {text[language].searchButton}
            </span>
          </button>
        </div>

        {/* Search Dropdown */}
        {isDropdownOpen && searchQuery.length >= 2 && (
          <div className="search-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            
            {/* Loading State */}
            {isSearching && (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">{text[language].searching}</p>
              </div>
            )}

            {/* Companies Section */}
            {!isSearching && companies.length > 0 && (
              <div className="p-4 border-b border-gray-100">
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
                      {/* Trustpilot-style horizontal layout */}
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        {/* Company Logo */}
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
                        
                        {/* Company Name */}
                        <div className="font-bold text-gray-900 text-base group-hover:text-primary-500 transition-colors duration-200 flex-shrink-0">
                          {company.name || 'Unnamed Company'}
                        </div>
                        
                        {/* Website URL */}
                        {company.website && (
                          <>
                            <span className="text-gray-400 text-sm">•</span>
                            <div className="text-sm text-gray-500 truncate flex-shrink min-w-0">
                              {company.website.replace(/^https?:\/\//, '')}
                            </div>
                          </>
                        )}
                        
                        {/* Review Count */}
                        {company.review_count > 0 && (
                          <>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-500 text-sm flex-shrink-0">
                              {formatReviewCount(company.review_count)} {text[language].reviews}
                            </span>
                          </>
                        )}
                        
                        {/* Rating Badge - positioned at the end */}
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

            {/* Categories Section */}
            {!isSearching && categories.length > 0 && (
              <div className="p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                  <Tag className="h-5 w-5 text-accent-500" />
                  <h3 className="font-bold text-dark-500 text-lg">{text[language].categories}</h3>
                </div>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className="w-full text-left hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 rtl:space-x-reverse group"
                      onClick={() => handleCategoryClick(category)}
                    >
                      {/* Category Icon */}
                      <div className="w-8 h-8 bg-accent-50 rounded-lg flex items-center justify-center text-accent-500 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Tag className="h-4 w-4" />
                      </div>
                      
                      {/* Category Name */}
                      <div className="font-bold text-gray-900 truncate text-base group-hover:text-accent-500 transition-colors duration-200">
                        {category.name || 'Unnamed Category'}
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