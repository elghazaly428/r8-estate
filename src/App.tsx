import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';

// Home Page Component
const HomePage: React.FC<{ language: 'ar' | 'en'; onLanguageChange: (lang: 'ar' | 'en') => void }> = ({ 
  language, 
  onLanguageChange 
}) => {
  const navigate = useNavigate();

  const text = {
    ar: {
      heroTitle: 'اقرأ التقييمات. اكتب التقييمات. ابحث عن شركة يمكنك الوثوق بها.',
      heroSubtitle: 'منصة التقييم الرائدة للعقارات في مصر'
    },
    en: {
      heroTitle: 'Read reviews. Write reviews. Find a company you can trust.',
      heroSubtitle: 'The leading real estate review platform in Egypt'
    }
  };

  const handleNavigation = (page: string, companyId?: number, categoryId?: number) => {
    if (page === 'company' && companyId) {
      navigate(`/company/${companyId}`);
    } else if (page === 'search' && categoryId) {
      navigate(`/search?category=${categoryId}`);
    } else if (page === 'write-review' && companyId) {
      navigate(`/write-review/${companyId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  const handleSearch = (query: string) => {
    if (query.startsWith('category:')) {
      const categoryId = query.replace('category:', '');
      navigate(`/search?category=${categoryId}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleCompanySelect = (companyId: number) => {
    navigate(`/company/${companyId}`);
  };

  return (
    <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={handleNavigation} />
      
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

      <CategoryGrid language={language} onNavigate={handleNavigation} />
      <FeaturedCompanies language={language} onNavigate={handleNavigation} />
      <RecentReviews language={language} onNavigate={handleNavigation} />
      <Footer language={language} onNavigate={handleNavigation} />
    </div>
  );
};

// Wrapper components for pages that need URL parameters
const CompanyProfileWrapper: React.FC<{ language: 'ar' | 'en'; onLanguageChange: (lang: 'ar' | 'en') => void }> = ({ 
  language, 
  onLanguageChange 
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const handleNavigation = (page: string, companyId?: number) => {
    if (page === 'company' && companyId) {
      navigate(`/company/${companyId}`);
    } else if (page === 'write-review' && companyId) {
      navigate(`/write-review/${companyId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return (
    <CompanyProfile 
      language={language} 
      onLanguageChange={onLanguageChange} 
      onNavigate={handleNavigation}
      companyId={id ? parseInt(id) : null}
    />
  );
};

const WriteReviewWrapper: React.FC<{ language: 'ar' | 'en'; onLanguageChange: (lang: 'ar' | 'en') => void }> = ({ 
  language, 
  onLanguageChange 
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const handleNavigation = (page: string, companyId?: number) => {
    if (page === 'company' && companyId) {
      navigate(`/company/${companyId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return (
    <WriteReview 
      language={language} 
      onLanguageChange={onLanguageChange} 
      onNavigate={handleNavigation}
      companyId={id ? parseInt(id) : null}
    />
  );
};

const SearchResultsWrapper: React.FC<{ language: 'ar' | 'en'; onLanguageChange: (lang: 'ar' | 'en') => void }> = ({ 
  language, 
  onLanguageChange 
}) => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : null;
  
  const handleNavigation = (page: string, companyId?: number) => {
    if (page === 'company' && companyId) {
      navigate(`/company/${companyId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return (
    <SearchResults 
      language={language} 
      onLanguageChange={onLanguageChange} 
      onNavigate={handleNavigation}
      searchQuery={searchQuery}
      categoryId={categoryId}
    />
  );
};

// Main App Component
function App() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  // Navigation handler for components that don't use React Router directly
  const createNavigationHandler = () => {
    return (page: string, companyId?: number, categoryId?: number) => {
      if (page === 'company' && companyId) {
        window.location.href = `/company/${companyId}`;
      } else if (page === 'search' && categoryId) {
        window.location.href = `/search?category=${categoryId}`;
      } else if (page === 'write-review' && companyId) {
        window.location.href = `/write-review/${companyId}`;
      } else {
        window.location.href = `/${page}`;
      }
    };
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={<HomePage language={language} onLanguageChange={setLanguage} />} 
        />
        <Route 
          path="/login" 
          element={<Login language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />
        <Route 
          path="/signup" 
          element={<SignUp language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />
        <Route 
          path="/company/:id" 
          element={<CompanyProfileWrapper language={language} onLanguageChange={setLanguage} />} 
        />
        <Route 
          path="/search" 
          element={<SearchResultsWrapper language={language} onLanguageChange={setLanguage} />} 
        />
        <Route 
          path="/categories" 
          element={<Categories language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />
        <Route 
          path="/about" 
          element={<About language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />
        <Route 
          path="/pricing" 
          element={<Pricing language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />
        <Route 
          path="/terms" 
          element={<Terms language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />
        <Route 
          path="/privacy" 
          element={<Privacy language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />
        <Route 
          path="/contact" 
          element={<Contact language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route 
            path="/dashboard" 
            element={<Dashboard language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
          />
          <Route 
            path="/company-dashboard" 
            element={<CompanyDashboard language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
          />
          <Route 
            path="/admin" 
            element={<AdminDashboard language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
          />
          <Route 
            path="/notifications" 
            element={<Notifications language={language} onLanguageChange={setLanguage} onNavigate={createNavigationHandler()} />} 
          />
          <Route 
            path="/write-review/:id" 
            element={<WriteReviewWrapper language={language} onLanguageChange={setLanguage} />} 
          />
        </Route>

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;