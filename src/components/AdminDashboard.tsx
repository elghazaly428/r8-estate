import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Flag, 
  BarChart3, 
  Shield, 
  Search,
  Filter,
  Download,
  Upload,
  X,
  Check,
  AlertTriangle,
  Eye,
  Trash2,
  Edit,
  Star,
  Calendar,
  TrendingUp,
  User,
  FileText,
  CheckCircle,
  XCircle
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

interface DashboardStats {
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
  category_id: number | null;
}

interface Review {
  id: number;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  status: 'pending_approval' | 'published' | 'removed' | 'flagged_for_review' | null;
  created_at: string;
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
  review_id: number;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  reviews: {
    title: string | null;
    body: string | null;
    companies: {
      name: string | null;
    } | null;
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports' | 'bulk-upload'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
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
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending'); // Default to pending
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());

  const text = {
    ar: {
      // Navigation
      overview: 'نظرة عامة',
      users: 'المستخدمون',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      bulkUpload: 'رفع مجمع',
      
      // Overview
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      
      // Common
      search: 'بحث',
      filter: 'تصفية',
      actions: 'الإجراءات',
      status: 'الحالة',
      createdAt: 'تاريخ الإنشاء',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      
      // Users
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      admin: 'مدير',
      suspended: 'موقوف',
      active: 'نشط',
      
      // Companies
      companyName: 'اسم الشركة',
      website: 'الموقع الإلكتروني',
      claimed: 'مطالب بها',
      unclaimed: 'غير مطالب بها',
      
      // Reviews
      reviewer: 'المراجع',
      company: 'الشركة',
      rating: 'التقييم',
      published: 'منشور',
      pending: 'في الانتظار',
      removed: 'محذوف',
      flagged: 'مبلغ عنه',
      
      // Reports
      reporter: 'المبلغ',
      reason: 'السبب',
      reviewContent: 'محتوى التقييم',
      dismiss: 'رفض البلاغ',
      uphold: 'قبول البلاغ وإخفاء المحتوى',
      allReports: 'جميع البلاغات',
      pendingReports: 'البلاغات المعلقة',
      resolvedReports: 'البلاغات المحلولة',
      
      // Bulk Upload
      bulkUploadTitle: 'رفع الشركات بالجملة',
      selectFile: 'اختر ملف CSV',
      uploadInstructions: 'يجب أن يحتوي ملف CSV على الأعمدة التالية: name, logo_url, website, domain_name, category_name (اختياري)',
      downloadTemplate: 'تحميل نموذج CSV',
      uploadAndProcess: 'رفع ومعالجة الملف',
      uploading: 'جاري الرفع...',
      selectFileFirst: 'يرجى اختيار ملف CSV أولاً',
      uploadSuccess: 'تم رفع الملف بنجاح',
      uploadError: 'خطأ في رفع الملف',
      
      // Messages
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      reportDismissed: 'تم رفض البلاغ بنجاح',
      reportUpheld: 'تم قبول البلاغ وإخفاء المحتوى',
      errorProcessingReport: 'حدث خطأ أثناء معالجة البلاغ'
    },
    en: {
      // Navigation
      overview: 'Overview',
      users: 'Users',
      companies: 'Companies',
      reviews: 'Reviews',
      reports: 'Reports',
      bulkUpload: 'Bulk Upload',
      
      // Overview
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      
      // Common
      search: 'Search',
      filter: 'Filter',
      actions: 'Actions',
      status: 'Status',
      createdAt: 'Created At',
      loading: 'Loading...',
      noData: 'No data available',
      
      // Users
      name: 'Name',
      email: 'Email',
      admin: 'Admin',
      suspended: 'Suspended',
      active: 'Active',
      
      // Companies
      companyName: 'Company Name',
      website: 'Website',
      claimed: 'Claimed',
      unclaimed: 'Unclaimed',
      
      // Reviews
      reviewer: 'Reviewer',
      company: 'Company',
      rating: 'Rating',
      published: 'Published',
      pending: 'Pending',
      removed: 'Removed',
      flagged: 'Flagged',
      
      // Reports
      reporter: 'Reporter',
      reason: 'Reason',
      reviewContent: 'Review Content',
      dismiss: 'Dismiss Report',
      uphold: 'Uphold Report & Hide Content',
      allReports: 'All Reports',
      pendingReports: 'Pending Reports',
      resolvedReports: 'Resolved Reports',
      
      // Bulk Upload
      bulkUploadTitle: 'Bulk Upload Companies',
      selectFile: 'Select CSV File',
      uploadInstructions: 'CSV file should contain the following columns: name, logo_url, website, domain_name, category_name (optional)',
      downloadTemplate: 'Download CSV Template',
      uploadAndProcess: 'Upload and Process File',
      uploading: 'Uploading...',
      selectFileFirst: 'Please select a CSV file first',
      uploadSuccess: 'File uploaded successfully',
      uploadError: 'Error uploading file',
      
      // Messages
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      reportDismissed: 'Report dismissed successfully',
      reportUpheld: 'Report upheld and content hidden',
      errorProcessingReport: 'Error processing report'
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
          setError('Access denied');
          return;
        }

        // Fetch dashboard stats
        await fetchDashboardStats();
        await fetchAllData();

      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Fetch total reviews
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Fetch pending reports
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: reportsCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      // Fetch companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey(first_name, last_name),
          companies!reviews_company_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      setUsers(usersData || []);
      setCompanies(companiesData || []);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Separate function to fetch reports based on filter
  const fetchReports = async () => {
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          profiles!reports_reporter_profile_id_fkey(first_name, last_name),
          reviews!reports_review_id_fkey(
            title,
            body,
            companies!reviews_company_id_fkey(name)
          )
        `);

      // Apply status filter
      if (filterStatus === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filterStatus === 'resolved') {
        query = query.or('status.eq.Resolved: Denied,status.eq.Resolved: Accepted');
      }
      // If filterStatus is 'all', don't add any status filter

      const { data: reportsData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      console.log('Fetched reports:', reportsData?.length || 0, 'with filter:', filterStatus);
      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  // Fetch reports when filter changes
  useEffect(() => {
    if (!loading && !error) {
      fetchReports();
    }
  }, [filterStatus, loading, error]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid CSV file');
      setSelectedFile(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.error(text[language].selectFileFirst);
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('bulk-upload-companies', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(data.message);
        setIsBulkUploadOpen(false);
        setSelectedFile(null);
        // Refresh data
        await fetchDashboardStats();
        await fetchAllData();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error(`${text[language].uploadError}: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setProcessingReports(prev => new Set(prev).add(reportId));

    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'Resolved: Denied' })
        .eq('id', reportId);

      if (error) throw error;

      // Remove from UI if we're showing pending reports
      if (filterStatus === 'pending') {
        setReports(prev => prev.filter(report => report.id !== reportId));
      } else {
        // Refresh reports to show updated status
        await fetchReports();
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingReports: Math.max(0, prev.pendingReports - 1)
      }));

      toast.success(text[language].reportDismissed);
    } catch (error: any) {
      console.error('Error dismissing report:', error);
      toast.error(text[language].errorProcessingReport);
    } finally {
      setProcessingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleUpholdReport = async (report: Report) => {
    setProcessingReports(prev => new Set(prev).add(report.id));

    try {
      // Step A: Hide the original review
      const { error: reviewError } = await supabase
        .from('reviews')
        .update({ status: 'removed' })
        .eq('id', report.review_id);

      if (reviewError) throw reviewError;

      // Step B: Update the report status
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'Resolved: Accepted' })
        .eq('id', report.id);

      if (reportError) throw reportError;

      // Remove from UI if we're showing pending reports
      if (filterStatus === 'pending') {
        setReports(prev => prev.filter(r => r.id !== report.id));
      } else {
        // Refresh reports to show updated status
        await fetchReports();
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingReports: Math.max(0, prev.pendingReports - 1)
      }));

      toast.success(text[language].reportUpheld);
    } catch (error: any) {
      console.error('Error upholding report:', error);
      toast.error(text[language].errorProcessingReport);
    } finally {
      setProcessingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(report.id);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number | null) => {
    const stars = [];
    const ratingValue = rating || 0;
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < ratingValue ? 'fill-current text-highlight-500' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
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
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalUsers}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalCompanies}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalCompanies}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-yellow-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalReviews}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.pendingReports}</h3>
          <p className="text-gray-600 text-sm">{text[language].pendingReports}</p>
        </div>
      </div>
    </div>
  );

  // Users View
  const UsersView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].users}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].name}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].status}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].createdAt}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      {user.is_admin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {text[language].admin}
                        </span>
                      )}
                      {user.is_suspended ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {text[language].suspended}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {text[language].active}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
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
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].companyName}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].website}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].status}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].createdAt}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {company.name || 'Unnamed Company'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.website ? (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:text-primary-600"
                      >
                        {company.website}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.is_claimed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {text[language].claimed}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {text[language].unclaimed}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(company.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Reviews View
  const ReviewsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reviews}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].reviewer}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].company}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].rating}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].status}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].createdAt}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {review.profiles 
                            ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || 'Anonymous'
                            : 'Anonymous'
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {review.companies?.name || 'Unknown Company'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      {renderStars(review.overall_rating)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      review.status === 'published' ? 'bg-green-100 text-green-800' :
                      review.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                      review.status === 'removed' ? 'bg-red-100 text-red-800' :
                      review.status === 'flagged_for_review' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {review.status === 'published' ? text[language].published :
                       review.status === 'pending_approval' ? text[language].pending :
                       review.status === 'removed' ? text[language].removed :
                       review.status === 'flagged_for_review' ? text[language].flagged :
                       review.status || text[language].pending
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Reports View
  const ReportsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-500 mb-2">
            {text[language].reports}
          </h1>
          <div className="w-16 h-1 bg-red-500 rounded-full"></div>
        </div>
        
        {/* Filter Dropdown */}
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="pending">{text[language].pendingReports}</option>
            <option value="resolved">{text[language].resolvedReports}</option>
            <option value="all">{text[language].allReports}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {filterStatus === 'pending' ? 
                (language === 'ar' ? 'لا توجد بلاغات معلقة' : 'No pending reports') :
                filterStatus === 'resolved' ?
                (language === 'ar' ? 'لا توجد بلاغات محلولة' : 'No resolved reports') :
                (language === 'ar' ? 'لا توجد بلاغات' : 'No reports')
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].reporter}
                  </th>
                  <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].reason}
                  </th>
                  <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].reviewContent}
                  </th>
                  <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].status}
                  </th>
                  <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].createdAt}
                  </th>
                  {filterStatus === 'pending' && (
                    <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {text[language].actions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.profiles 
                              ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() || 'Anonymous'
                              : 'Anonymous'
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.reason}</div>
                      {report.details && (
                        <div className="text-sm text-gray-500 mt-1">{report.details}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium mb-1">
                          {report.reviews?.companies?.name || 'Unknown Company'}
                        </div>
                        <div className="text-gray-600">
                          {report.reviews?.title && (
                            <div className="font-medium">{report.reviews.title}</div>
                          )}
                          {report.reviews?.body && (
                            <div className="truncate max-w-xs">
                              {report.reviews.body.length > 100 
                                ? `${report.reviews.body.substring(0, 100)}...`
                                : report.reviews.body
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'Resolved: Denied' ? 'bg-green-100 text-green-800' :
                        report.status === 'Resolved: Accepted' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status === 'pending' ? (language === 'ar' ? 'معلق' : 'Pending') :
                         report.status === 'Resolved: Denied' ? (language === 'ar' ? 'مرفوض' : 'Denied') :
                         report.status === 'Resolved: Accepted' ? (language === 'ar' ? 'مقبول' : 'Accepted') :
                         report.status
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(report.created_at)}
                    </td>
                    {filterStatus === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleDismissReport(report.id)}
                            disabled={processingReports.has(report.id)}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={text[language].dismiss}
                          >
                            {processingReports.has(report.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleUpholdReport(report)}
                            disabled={processingReports.has(report.id)}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={text[language].uphold}
                          >
                            {processingReports.has(report.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  {stats.pendingReports > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-auto rtl:mr-auto rtl:ml-0">
                      {stats.pendingReports}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'companies' && <CompaniesView />}
            {activeTab === 'reviews' && <ReviewsView />}
            {activeTab === 'reports' && <ReportsView />}
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-500">
                {text[language].bulkUploadTitle}
              </h2>
              <button
                onClick={() => setIsBulkUploadOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {text[language].selectFile}
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">{text[language].uploadInstructions}</p>
                <a
                  href="/template.csv"
                  download
                  className="text-primary-500 hover:text-primary-600 underline"
                >
                  {text[language].downloadTemplate}
                </a>
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => setIsBulkUploadOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
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
      )}

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;