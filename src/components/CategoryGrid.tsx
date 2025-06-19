import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Wrench, 
  Truck, 
  Smartphone, 
  Scale, 
  Calculator,
  Home,
  Users,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Tag
} from 'lucide-react';
import { getAllCategories, Category } from '../lib/supabase';

interface CategoryGridProps {
  language: 'ar' | 'en';
  onNavigate: (page: string, companyId?: number, categoryId?: number) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ language, onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const text = {
    ar: {
      title: 'تصفح حسب الفئة',
      seeAll: 'عرض جميع الفئات',
      loading: 'جاري التحميل...',
      noCategories: 'لا توجد فئات متاحة'
    },
    en: {
      title: 'Browse by Category',
      seeAll: 'See all categories',
      loading: 'Loading...',
      noCategories: 'No categories available'
    }
  };

  // Icon mapping for categories based on icon_name column
  const getIconForCategory = (iconName: string | null, categoryName: string | null): React.ComponentType<any> => {
    // Primary: Use icon_name from database if available
    if (iconName) {
      const iconMap: { [key: string]: React.ComponentType<any> } = {
        'building': Building2,
        'building2': Building2,
        'wrench': Wrench,
        'truck': Truck,
        'smartphone': Smartphone,
        'scale': Scale,
        'calculator': Calculator,
        'home': Home,
        'users': Users,
        'tag': Tag
      };
      return iconMap[iconName.toLowerCase()] || Building2;
    }

    // Fallback: Intelligent icon selection based on category name
    if (categoryName) {
      const name = categoryName.toLowerCase();
      
      // Arabic keywords
      if (name.includes('تكنولوجيا') || name.includes('تقني')) return Smartphone;
      if (name.includes('استشار') || name.includes('خدمات')) return Building2;
      if (name.includes('قانون') || name.includes('محاماة')) return Scale;
      if (name.includes('صيانة') || name.includes('إصلاح')) return Wrench;
      if (name.includes('نقل') || name.includes('انتقال')) return Truck;
      if (name.includes('تمويل') || name.includes('مالي')) return Calculator;
      if (name.includes('إدارة') || name.includes('ممتلكات')) return Home;
      if (name.includes('وساطة') || name.includes('سمسار')) return Users;
      
      // English keywords
      if (name.includes('tech') || name.includes('technology')) return Smartphone;
      if (name.includes('consult') || name.includes('advisory')) return Building2;
      if (name.includes('legal') || name.includes('law')) return Scale;
      if (name.includes('maintenance') || name.includes('repair')) return Wrench;
      if (name.includes('moving') || name.includes('transport')) return Truck;
      if (name.includes('finance') || name.includes('financial')) return Calculator;
      if (name.includes('management') || name.includes('property')) return Home;
      if (name.includes('broker') || name.includes('agent')) return Users;
    }

    return Building2; // Default fallback icon
  };

  // Fetch categories from Supabase database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Calculate total pages (8 cards per page)
  const cardsPerPage = 8;
  const totalPages = Math.ceil(categories.length / cardsPerPage);

  // Navigation functions
  const goToNext = () => {
    setCurrentPage((prevPage) => {
      const nextPage = prevPage + 1;
      return nextPage >= totalPages ? 0 : nextPage; // Loop back to beginning
    });
  };

  const goToPrevious = () => {
    setCurrentPage((prevPage) => {
      const prevPageCalc = prevPage - 1;
      return prevPageCalc < 0 ? totalPages - 1 : prevPageCalc; // Loop to end
    });
  };

  // Handle category card click - navigate to search results with category filter
  const handleCategoryClick = (categoryId: number) => {
    onNavigate('search', undefined, categoryId);
  };

  // Get visible categories for current page (8 cards)
  const getVisibleCategories = () => {
    const startIndex = currentPage * cardsPerPage;
    return categories.slice(startIndex, startIndex + cardsPerPage);
  };

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

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

  // Empty state
  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-500 mb-4">
              {text[language].title}
            </h2>
          </div>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-500 text-lg">{text[language].noCategories}</p>
          </div>
        </div>
      </section>
    );
  }

  const visibleCategories = getVisibleCategories();

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dark-500 mb-4">
            {text[language].title}
          </h2>
        </div>

        {/* Grid Container with Navigation */}
        <div className="relative mb-12">
          {/* Previous Button - Only show if there are multiple pages */}
          {totalPages > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-0 rtl:right-0 rtl:left-auto top-1/2 -translate-y-1/2 -translate-x-16 rtl:translate-x-16 z-20 w-14 h-14 bg-white rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:bg-primary-50 hover:border-primary-500 hover:shadow-2xl transition-colors duration-300 group"
              aria-label={language === 'ar' ? 'السابق' : 'Previous'}
            >
              <ChevronLeft className={`h-7 w-7 text-gray-600 group-hover:text-primary-500 transition-colors duration-300 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Next Button - Only show if there are multiple pages */}
          {totalPages > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-0 rtl:left-0 rtl:right-auto top-1/2 -translate-y-1/2 translate-x-16 rtl:-translate-x-16 z-20 w-14 h-14 bg-white rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:bg-primary-50 hover:border-primary-500 hover:shadow-2xl transition-colors duration-300 group"
              aria-label={language === 'ar' ? 'التالي' : 'Next'}
            >
              <ChevronRight className={`h-7 w-7 text-gray-600 group-hover:text-primary-500 transition-colors duration-300 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* 2x4 Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {visibleCategories.map((category) => {
              const IconComponent = getIconForCategory(category.icon_name, category.name);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary-500 hover:shadow-lg transition-all duration-300 group hover:scale-105 min-h-[160px] flex flex-col items-center justify-center"
                >
                  {/* Icon Container */}
                  <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all duration-300">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  
                  {/* Category Name - Centered and Consistent Height */}
                  <div className="flex-1 flex items-center justify-center">
                    <h3 className="font-bold text-dark-500 text-center text-sm leading-tight group-hover:text-primary-600 transition-colors duration-300 line-clamp-2">
                      {category.name || 'Unnamed Category'}
                    </h3>
                  </div>
                </button>
              );
            })}

            {/* Fill empty slots if less than 8 categories on current page */}
            {visibleCategories.length < cardsPerPage && 
              Array.from({ length: cardsPerPage - visibleCategories.length }).map((_, index) => (
                <div key={`empty-${index}`} className="invisible min-h-[160px]"></div>
              ))
            }
          </div>

          {/* Page Indicators - Only show if there are multiple pages */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2 rtl:space-x-reverse">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`h-2 rounded-full transition-all duration-300 hover:bg-primary-400 ${
                    index === currentPage 
                      ? 'bg-primary-500 w-8' 
                      : 'bg-gray-300 w-2'
                  }`}
                  aria-label={`${language === 'ar' ? 'الانتقال إلى الصفحة' : 'Go to page'} ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* See All Categories Button */}
        <div className="text-center">
          <button 
            onClick={() => onNavigate('categories')}
            className="btn-secondary inline-flex items-center space-x-2 rtl:space-x-reverse px-8 py-4 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold hover:bg-primary-500 hover:text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <span>{text[language].seeAll}</span>
            <ArrowIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;