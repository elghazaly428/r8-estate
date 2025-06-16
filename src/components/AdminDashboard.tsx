import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Flag, 
  BarChart3, 
  Shield, 
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  X,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  User,
  Star,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number) => void;
}

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalReviews: number;
  pendingReports: number;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  updated_at: string;
}

interface Company {
  id: number;
  name: string | null;
  logo_url: string | null;
  website: string | null;
  is_claimed: boolean | null;
  created_at: string;
}

interface Review {
  id: number;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  status: string | null;
  created_at: string;
  is_anonymous: boolean | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  companies: {
    name: string | null;
  } | null;
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  review_id: number;
  reporter_profile_id: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });
  
  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Modal states
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const text = {
    ar: {
      // Navigation
      overview: 'نظرة عامة',
      users: 'المستخدمون',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      
      // Overview
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      
      // Companies
      bulkUpload: 'رفع مجمع',
      bulkUploadCompanies: 'رفع الشركات بشكل مجمع',
      selectCsvFile: 'اختر ملف CSV',
      uploadAndProcess: 'رفع ومعالجة الملف',
      csvFormat: 'تنسيق CSV المطلوب',
      csvFormatDesc: 'يجب أن يحتوي ملف CSV على الأعمدة التالية:',
      nameColumn: 'name - اسم الشركة (مطلوب)',
      logoColumn: 'logo_url - رابط الشعار (اختياري)',
      websiteColumn: 'website - الموقع الإلكتروني (اختياري)',
      domainColumn: 'domain_name - اسم النطاق (مطلوب)',
      categoryColumn: 'category_name - اسم الفئة (اختياري)',
      downloadTemplate: 'تحميل نموذج',
      close: 'إغلاق',
      cancel: 'إلغاء',
      
      // Messages
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      errorOccurred: 'حدث خطأ',
      selectFileFirst: 'يرجى اختيار ملف CSV أولاً',
      uploading: 'جاري الرفع...',
      uploadSuccess: 'تم رفع الملف بنجاح',
      uploadError: 'خطأ في رفع الملف'
    },
    en: {
      // Navigation
      overview: 'Overview',
      users: 'Users',
      companies: 'Companies',
      reviews: 'Reviews',
      reports: 'Reports',
      
      // Overview
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      
      // Companies
      bulkUpload: 'Bulk Upload',
      bulkUploadCompanies: 'Bulk Upload Companies',
      selectCsvFile: 'Select CSV File',
      uploadAndProcess: 'Upload and Process File',
      csvFormat: 'Required CSV Format',
      csvFormatDesc: 'The CSV file must contain the following columns:',
      nameColumn: 'name - Company name (required)',
      logoColumn: 'logo_url - Logo URL (optional)',
      websiteColumn: 'website - Website URL (optional)',
      domainColumn: 'domain_name - Domain name (required)',
      categoryColumn: 'category_name - Category name (optional)',
      downloadTemplate: 'Download Template',
      close: 'Close',
      cancel: 'Cancel',
      
      // Messages
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      errorOccurred: 'An error occurred',
      selectFileFirst: 'Please select a CSV file first',
      uploading: 'Uploading...',
      uploadSuccess: 'File uploaded successfully',
      uploadError: 'Error uploading file'
    }
  };

  // Check admin access and fetch data
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        onNavigate('login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if user is admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData?.is_admin) {
          onNavigate('dashboard');
          return;
        }

        // Fetch admin stats
        const [usersResult, companiesResult, reviewsResult, reportsResult] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('companies').select('*', { count: 'exact', head: true }),
          supabase.from('reviews').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        setStats({
          totalUsers: usersResult.count || 0,
          totalCompanies: companiesResult.count || 0,
          totalReviews: reviewsResult.count || 0,
          pendingReports: reportsResult.count || 0
        });

        // Fetch detailed data based on active tab
        await fetchTabData();

      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

  const fetchTabData = async () => {
    try {
      switch (activeTab) {
        case 'users':
          const { data: usersData } = await supabase
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(50);
          setUsers(usersData || []);
          break;

        case 'companies':
          const { data: companiesData } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          setCompanies(companiesData || []);
          break;

        case 'reviews':
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select(`
              *,
              profiles!reviews_profile_id_fkey(first_name, last_name),
              companies!reviews_company_id_fkey(name)
            `)
            .order('created_at', { ascending: false })
            .limit(50);
          setReviews(reviewsData || []);
          break;

        case 'reports':
          const { data: reportsData } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          setReports(reportsData || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (!loading && !error) {
      fetchTabData();
    }
  }, [activeTab]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleBulkUpload = async () => {
    // Step 1: Get the User's File
    if (!selectedFile) {
      toast.error(text[language].selectFileFirst);
      return;
    }

    setIsUploading(true);

    try {
      // Step 2: Prepare the Request
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Step 3: Call the Edge Function
      const { data, error } = await supabase.functions.invoke('bulk-upload-companies', {
        body: formData
      });

      // Step 4: Handle the Response
      if (error) {
        throw error;
      }

      if (data.success) {
        // On Success: Close modal and show success message
        setIsBulkUploadOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast.success(data.message || text[language].uploadSuccess);
        
        // Refresh companies data if we're on the companies tab
        if (activeTab === 'companies') {
          fetchTabData();
        }
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalCompanies: prev.totalCompanies + (data.data?.length || 0)
        }));
      } else {
        // On Failure: Show error message
        throw new Error(data.error || text[language].uploadError);
      }

    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error(error.message || text[language].uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = 'name,logo_url,website,domain_name,category_name\n"Example Company","https://example.com/logo.png","https://example.com","example.com","خدمات الاستشارات العقارية"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-dark-500 mb-2">
              {text[language].accessDenied}
            </h1>
            <p className="text-gray-600 mb-6">
              {text[language].notAuthorized}
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
            >
              {text[language].backToDashboard}
            </button>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  // Overview View
  const OverviewView = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].overview}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalUsers}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalCompanies}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalCompanies}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalReviews}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.pendingReports}</h3>
          <p className="text-gray-600 text-sm">{text[language].pendingReports}</p>
        </div>
      </div>
    </div>
  );

  // Companies View
  const CompaniesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-500 mb-2">
            {text[language].companies}
          </h1>
          <div className="w-16 h-1 bg-red-500 rounded-full"></div>
        </div>
        <button
          onClick={() => setIsBulkUploadOpen(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          <Upload className="h-4 w-4" />
          <span>{text[language].bulkUpload}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الاسم' : 'Name'}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الموقع' : 'Website'}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <Building2 className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {company.name || 'Unnamed Company'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {company.website}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      company.is_claimed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.is_claimed 
                        ? (language === 'ar' ? 'مطالب بها' : 'Claimed')
                        : (language === 'ar' ? 'غير مطالب بها' : 'Unclaimed')
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => onNavigate('company', company.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Bulk Upload Modal
  const BulkUploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-500">
              {text[language].bulkUploadCompanies}
            </h2>
            <button
              onClick={() => setIsBulkUploadOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-semibold text-dark-500 mb-3">
                {text[language].selectCsvFile}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {language === 'ar' ? 'انقر لاختيار ملف' : 'Click to select file'}
                    </button>
                    <p className="text-gray-500 text-sm mt-1">
                      {language === 'ar' ? 'أو اسحب وأفلت ملف CSV هنا' : 'or drag and drop a CSV file here'}
                    </p>
                  </div>
                  {selectedFile && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-sm font-medium">
                        {language === 'ar' ? 'الملف المحدد:' : 'Selected file:'} {selectedFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CSV Format Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-dark-500 mb-3 flex items-center space-x-2 rtl:space-x-reverse">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>{text[language].csvFormat}</span>
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {text[language].csvFormatDesc}
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• {text[language].nameColumn}</li>
                <li>• {text[language].logoColumn}</li>
                <li>• {text[language].websiteColumn}</li>
                <li>• {text[language].domainColumn}</li>
                <li>• {text[language].categoryColumn}</li>
              </ul>
              <button
                onClick={downloadCsvTemplate}
                className="mt-3 flex items-center space-x-2 rtl:space-x-reverse text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                <span>{text[language].downloadTemplate}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 rtl:space-x-reverse pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsBulkUploadOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                {text[language].cancel}
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{text[language].uploading}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>{text[language].uploadAndProcess}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">{text[language].overview}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{text[language].users}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'companies'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{text[language].companies}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reviews'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">{text[language].reviews}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Flag className="h-5 w-5" />
                  <span className="font-medium">{text[language].reports}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'companies' && <CompaniesView />}
            {/* Add other tab views here */}
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && <BulkUploadModal />}

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;