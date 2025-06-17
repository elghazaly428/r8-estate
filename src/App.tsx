import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import CategoryGrid from './components/CategoryGrid';
import FeaturedCompanies from './components/FeaturedCompanies';
import RecentReviews from './components/RecentReviews';
import Footer from './components/Footer';
import SearchResults from './components/SearchResults';
import SignUp from './components/SignUp';
import Login from './components/Login';
import CompanyProfile from './components/CompanyProfile';
import Categories from './components/Categories';
import WriteReview from './components/WriteReview';
import Dashboard from './components/Dashboard';
import CompanyDashboard from './components/CompanyDashboard';
import AdminDashboard from './components/AdminDashboard';
import About from './components/About';
import Pricing from './components/Pricing';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Contact from './components/Contact';
import Notifications from './components/Notifications';

function App() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [currentPage, setCurrentPage] = useState<'home' | 'search' | 'signup' | 'login' | 'company' | 'categories' | 'write-review' | 'dashboard' | 'company-dashboard' | 'admin' | 'about' | 'pricing' | 'terms' | 'privacy' | 'contact' | 'notifications'>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const text = {
    ar: {
      heroTitle: 'منصة تقييم القطاع العقاري الأولي في مصر',
      heroSubtitle: 'اكتشف وقيم أفضل العقارات والمطورين في مصر. تقييمات حقيقية من عملاء حقيقين',
      ctaQuestion: 'لسا طالع من تجربة مع شركة ؟',
      ctaAction: 'شاركها معانا'
    },
    en: {
      heroTitle: 'The Primary Real Estate Sector Review Platform in Egypt',
      heroSubtitle: 'Discover and review the best real estate and developers in Egypt. Real reviews from real customers',
      ctaQuestion: 'Just had an experience with a company?',
      ctaAction: 'Share it with us'
    }
  };

  const handleNavigation = (page: string, companyId?: number, categoryId?: number) => {
    setCurrentPage(page as 'home' | 'search' | 'signup' | 'login' | 'company' | 'categories' | 'write-review' | 'dashboard' | 'company-dashboard' | 'admin' | 'about' | 'pricing' | 'terms' | 'privacy' | 'contact' | 'notifications');
    if (page === 'company' && companyId) {
      setSelectedCompanyId(companyId);
    }
    if (page === 'search' && categoryId) {
      setSelectedCategoryId(categoryId);
      setSearchQuery(''); // Clear search query when filtering by category
    }
    if (page === 'write-review' && companyId) {
      setSelectedCompanyId(companyId);
    }
  };

  const handleSearch = (query: string, categoryId?: number | null) => {
    setSearchQuery(query);
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    } else {
      setSelectedCategoryId(null); // Clear category filter when searching with text only
    }
    setCurrentPage('search');
  };

  const handleCompanySelect = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setCurrentPage('company');
  };

  // Show Notifications page
  if (currentPage === 'notifications') {
    return (
      <>
        <Notifications 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Contact page
  if (currentPage === 'contact') {
    return (
      <>
        <Contact 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Privacy page
  if (currentPage === 'privacy') {
    return (
      <>
        <Privacy 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Terms page
  if (currentPage === 'terms') {
    return (
      <>
        <Terms 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Pricing page
  if (currentPage === 'pricing') {
    return (
      <>
        <Pricing 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show About page
  if (currentPage === 'about') {
    return (
      <>
        <About 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Admin Dashboard page
  if (currentPage === 'admin') {
    return (
      <>
        <AdminDashboard 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Company Dashboard page
  if (currentPage === 'company-dashboard') {
    return (
      <>
        <CompanyDashboard 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Dashboard page
  if (currentPage === 'dashboard') {
    return (
      <>
        <Dashboard 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Write Review page
  if (currentPage === 'write-review') {
    return (
      <>
        <WriteReview 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
          companyId={selectedCompanyId}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Categories page
  if (currentPage === 'categories') {
    return (
      <>
        <Categories language={language} onLanguageChange={setLanguage} onNavigate={handleNavigation} />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Company Profile page
  if (currentPage === 'company') {
    return (
      <>
        <CompanyProfile 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
          companyId={selectedCompanyId}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Login page
  if (currentPage === 'login') {
    return (
      <>
        <Login language={language} onLanguageChange={setLanguage} onNavigate={handleNavigation} />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show SignUp page
  if (currentPage === 'signup') {
    return (
      <>
        <SignUp language={language} onLanguageChange={setLanguage} onNavigate={handleNavigation} />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  // Show Search Results page
  if (currentPage === 'search') {
    return (
      <>
        <SearchResults 
          language={language} 
          onLanguageChange={setLanguage} 
          onNavigate={handleNavigation}
          searchQuery={searchQuery}
          categoryId={selectedCategoryId}
        />
        <Toaster
          position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D3748',
              color: '#FFFFFF',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={setLanguage} onNavigate={handleNavigation} />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark-500 mb-6 leading-tight animate-fade-in">
                {text[language].heroTitle}
              </h1>
              <p className="text-xl text-gray-600 mb-8 animate-slide-up">
                {text[language].heroSubtitle}
              </p>
            </div>
            
            <div className="animate-slide-up">
              <SearchBar 
                language={language} 
                onSearch={handleSearch} 
                onCompanySelect={handleCompanySelect}
              />
            </div>
          </div>
        </section>

        {/* Enhanced Call-to-Action Section */}
        <section className="py-16 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 rtl:sm:space-x-reverse">
                <p className="text-xl md:text-2xl text-gray-800 font-semibold">
                  {text[language].ctaQuestion}
                </p>
                <button
                  onClick={() => handleNavigation('search')}
                  className="text-xl md:text-2xl font-bold text-primary-600 hover:text-primary-700 transition-all duration-300 hover:underline decoration-3 underline-offset-4 hover:scale-105 transform bg-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg border-2 border-primary-200 hover:border-primary-400"
                >
                  {text[language].ctaAction}
                </button>
              </div>
            </div>
          </div>
        </section>

        <CategoryGrid language={language} onNavigate={handleNavigation} />
        <FeaturedCompanies language={language} onNavigate={handleNavigation} />
        <RecentReviews language={language} onNavigate={handleNavigation} />
        <Footer language={language} onNavigate={handleNavigation} />
      </div>
      
      {/* Global Toast Provider */}
      <Toaster
        position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2D3748',
            color: '#FFFFFF',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </>
  );
}

export default App;