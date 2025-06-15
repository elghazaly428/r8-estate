import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { getAllCategories, getCategoryCompanyCount, Category } from '../lib/supabase';

interface CategoriesProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number, categoryId?: number) => void;
}

interface CategoryWithCount extends Category {
  companyCount: number;
}

const Categories: React.FC<CategoriesProps> = ({ language, onLanguageChange, onNavigate }) => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const text = {
    ar: {
      title: 'تصفح جميع الفئات',
      subtitle: 'اكتشف أفضل الشركات العقارية في مصر حسب التخصص',
      companies: 'شركة',
      searchPlaceholder: 'البحث في الفئات...',
      loading: 'جاري التحميل...',
      noCategories: 'لا توجد فئات متاحة',
      noResults: 'لا توجد نتائج للبحث'
    },
    en: {
      title: 'Browse All Categories',
      subtitle: 'Discover the best real estate companies in Egypt by specialization',
      companies: 'companies',
      searchPlaceholder: 'Search categories...',
      loading: 'Loading...',
      noCategories: 'No categories available',
      noResults: 'No search results found'
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getAllCategories();
        
        // Fetch company count for each category
        const categoriesWithCount = await Promise.all(
          categoriesData.map(async (category) => {
            const companyCount = await getCategoryCompanyCount(category.id);
            return {
              ...category,
              companyCount
            };
          })
        );

        setCategories(categoriesWithCount);
        setFilteredCategories(categoriesWithCount);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        setFilteredCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search query
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const handleCategoryClick = (categoryId: number) => {
    // Navigate to search results with category filter
    onNavigate('search', undefined, categoryId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-dark-500 mb-4 animate-fade-in">
              {text[language].title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-slide-up">
              {text[language].subtitle}
            </p>
            
            {/* Search Input */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={text[language].searchPlaceholder}
                  className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white shadow-sm"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">{text[language].loading}</p>
            </div>
          )}

          {/* No Categories */}
          {!loading && categories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-gray-500 text-lg">{text[language].noCategories}</p>
            </div>
          )}

          {/* No Search Results */}
          {!loading && categories.length > 0 && filteredCategories.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">{text[language].noResults}</p>
            </div>
          )}

          {/* Categories Grid */}
          {!loading && filteredCategories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="hover-lift bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary-500 transition-all duration-300 group text-center"
                >
                  <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-dark-500 mb-2 text-lg leading-tight">
                    {category.name || 'Unnamed Category'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {category.companyCount} {text[language].companies}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default Categories;