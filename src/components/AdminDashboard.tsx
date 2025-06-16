import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Flag, 
  BarChart3, 
  Settings, 
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
  Plus,
  FileText,
  Calendar,
  TrendingUp,
  Star,
  Shield,
  UserCheck,
  UserX,
  Clock,
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
  onNavigate: (page: string) => void;
}

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalReviews: number;
  pendingReports: number;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  created_at: string;
}

interface Company {
  id: number;
  name: string | null;
  website: string | null;
  is_claimed: boolean | null;
  created_at: string;
  category_name: string | null;
}

interface Review {
  id: number;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  status: string | null;
  created_at: string;
  company_name: string | null;
  reviewer_name: string | null;
  is_anonymous: boolean | null;
}

interface Report {
  id: string;
  review_id: number;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter_name: string | null;
  review_title: string | null;
  review_body: string | null;
  company_name: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Filter states
  const [userFilter, setUserFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all'); // New filter state for reports

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  // Modal states
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Processing states
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());

  const text = {
    ar: {
      // Navigation
      overview: 'نظرة عامة',
      users: 'المستخدمون',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      settings: 'الإعدادات',
      
      // Overview
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      
      // Users
      allUsers: 'جميع المستخدمين',
      adminUsers: 'المديرون',
      suspendedUsers: 'المستخدمون المعلقون',
      searchUsers: 'البحث في المستخدمين...',
      email: 'البريد الإلكتروني',
      name: 'الاسم',
      role: 'الدور',
      status: 'الحالة',
      joinDate: 'تاريخ الانضمام',
      actions: 'الإجراءات',
      admin: 'مدير',
      user: 'مستخدم',
      active: 'نشط',
      suspended: 'معلق',
      makeAdmin: 'جعل مديراً',
      removeAdmin: 'إزالة الإدارة',
      suspendUser: 'تعليق المستخدم',
      unsuspendUser: 'إلغاء التعليق',
      
      // Companies
      allCompanies: 'جميع الشركات',
      claimedCompanies: 'الشركات المطالب بها',
      unclaimedCompanies: 'الشركات غير المطالب بها',
      searchCompanies: 'البحث في الشركات...',
      companyName: 'اسم الشركة',
      website: 'الموقع الإلكتروني',
      category: 'الفئة',
      claimStatus: 'حالة المطالبة',
      createdDate: 'تاريخ الإنشاء',
      claimed: 'مطالب بها',
      unclaimed: 'غير مطالب بها',
      viewCompany: 'عرض الشركة',
      editCompany: 'تعديل الشركة',
      deleteCompany: 'حذف الشركة',
      bulkUpload: 'رفع مجمع',
      bulkUploadTitle: 'رفع الشركات بشكل مجمع',
      selectCsvFile: 'اختر ملف CSV',
      uploadAndProcess: 'رفع ومعالجة الملف',
      downloadTemplate: 'تحميل نموذج CSV',
      csvInstructions: 'يجب أن يحتوي ملف CSV على الأعمدة التالية: name, logo_url, website, domain_name, category_name (اختياري)',
      
      // Reviews
      allReviews: 'جميع التقييمات',
      publishedReviews: 'التقييمات المنشورة',
      pendingReviews: 'التقييمات المعلقة',
      flaggedReviews: 'التقييمات المبلغ عنها',
      searchReviews: 'البحث في التقييمات...',
      reviewTitle: 'عنوان التقييم',
      reviewer: 'المراجع',
      company: 'الشركة',
      rating: 'التقييم',
      reviewStatus: 'حالة التقييم',
      reviewDate: 'تاريخ التقييم',
      published: 'منشور',
      pending: 'معلق',
      flagged: 'مبلغ عنه',
      removed: 'محذوف',
      anonymous: 'مجهول',
      viewReview: 'عرض التقييم',
      approveReview: 'الموافقة على التقييم',
      rejectReview: 'رفض التقييم',
      
      // Reports - Updated with new filter labels
      allReports: 'جميع البلاغات',
      acceptedReports: 'بلاغات مقبولة',
      declinedReports: 'بلاغات مرفوضة',
      reportReason: 'سبب البلاغ',
      reportDetails: 'تفاصيل البلاغ',
      reporter: 'المبلغ',
      reportedContent: 'المحتوى المبلغ عنه',
      reportDate: 'تاريخ البلاغ',
      reportStatus: 'حالة البلاغ',
      dismissReport: 'رفض البلاغ',
      upholdReport: 'قبول البلاغ وإخفاء المحتوى',
      
      // Settings
      systemSettings: 'إعدادات النظام',
      
      // Messages
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      noDataAvailable: 'لا توجد بيانات متاحة',
      selectFile: 'يرجى اختيار ملف CSV أولاً',
      uploading: 'جاري الرفع...',
      uploadSuccess: 'تم رفع الملف بنجاح',
      uploadError: 'خطأ في رفع الملف',
      actionSuccess: 'تم تنفيذ الإجراء بنجاح',
      actionError: 'حدث خطأ أثناء تنفيذ الإجراء',
      confirmAction: 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
      processing: 'جاري المعالجة...'
    },
    en: {
      // Navigation
      overview: 'Overview',
      users: 'Users',
      companies: 'Companies',
      reviews: 'Reviews',
      reports: 'Reports',
      settings: 'Settings',
      
      // Overview
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      
      // Users
      allUsers: 'All Users',
      adminUsers: 'Admin Users',
      suspendedUsers: 'Suspended Users',
      searchUsers: 'Search users...',
      email: 'Email',
      name: 'Name',
      role: 'Role',
      status: 'Status',
      joinDate: 'Join Date',
      actions: 'Actions',
      admin: 'Admin',
      user: 'User',
      active: 'Active',
      suspended: 'Suspended',
      makeAdmin: 'Make Admin',
      removeAdmin: 'Remove Admin',
      suspendUser: 'Suspend User',
      unsuspendUser: 'Unsuspend User',
      
      // Companies
      allCompanies: 'All Companies',
      claimedCompanies: 'Claimed Companies',
      unclaimedCompanies: 'Unclaimed Companies',
      searchCompanies: 'Search companies...',
      companyName: 'Company Name',
      website: 'Website',
      category: 'Category',
      claimStatus: 'Claim Status',
      createdDate: 'Created Date',
      claimed: 'Claimed',
      unclaimed: 'Unclaimed',
      viewCompany: 'View Company',
      editCompany: 'Edit Company',
      deleteCompany: 'Delete Company',
      bulkUpload: 'Bulk Upload',
      bulkUploadTitle: 'Bulk Upload Companies',
      selectCsvFile: 'Select CSV File',
      uploadAndProcess: 'Upload and Process File',
      downloadTemplate: 'Download CSV Template',
      csvInstructions: 'CSV file must contain the following columns: name, logo_url, website, domain_name, category_name (optional)',
      
      // Reviews
      allReviews: 'All Reviews',
      publishedReviews: 'Published Reviews',
      pendingReviews: 'Pending Reviews',
      flaggedReviews: 'Flagged Reviews',
      searchReviews: 'Search reviews...',
      reviewTitle: 'Review Title',
      reviewer: 'Reviewer',
      company: 'Company',
      rating: 'Rating',
      reviewStatus: 'Review Status',
      reviewDate: 'Review Date',
      published: 'Published',
      pending: 'Pending',
      flagged: 'Flagged',
      removed: 'Removed',
      anonymous: 'Anonymous',
      viewReview: 'View Review',
      approveReview: 'Approve Review',
      rejectReview: 'Reject Review',
      
      // Reports - Updated with new filter labels
      allReports: 'All Reports',
      acceptedReports: 'Accepted Reports',
      declinedReports: 'Declined Reports',
      reportReason: 'Report Reason',
      reportDetails: 'Report Details',
      reporter: 'Reporter',
      reportedContent: 'Reported Content',
      reportDate: 'Report Date',
      reportStatus: 'Report Status',
      dismissReport: 'Dismiss Report',
      upholdReport: 'Uphold Report & Hide Content',
      
      // Settings
      systemSettings: 'System Settings',
      
      // Messages
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      noDataAvailable: 'No data available',
      selectFile: 'Please select a CSV file first',
      uploading: 'Uploading...',
      uploadSuccess: 'File uploaded successfully',
      uploadError: 'Error uploading file',
      actionSuccess: 'Action completed successfully',
      actionError: 'Error performing action',
      confirmAction: 'Are you sure you want to perform this action?',
      processing: 'Processing...'
    }
  };

  // Check admin access and fetch initial data
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

        // Fetch admin stats
        await fetchAdminStats();
        
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!loading && !error) {
      switch (activeTab) {
        case 'users':
          fetchUsers();
          break;
        case 'companies':
          fetchCompanies();
          break;
        case 'reviews':
          fetchReviews();
          break;
        case 'reports':
          fetchReports();
          break;
      }
    }
  }, [activeTab, loading, error, userFilter, companyFilter, reviewFilter, reportFilter]);

  const fetchAdminStats = async () => {
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
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          is_admin,
          is_suspended,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (userFilter === 'admin') {
        query = query.eq('is_admin', true);
      } else if (userFilter === 'suspended') {
        query = query.eq('is_suspended', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get user emails from auth.users (this would need admin access)
      const usersWithEmails = data?.map(profile => ({
        ...profile,
        email: 'user@example.com', // Placeholder - would need auth admin access
        created_at: profile.updated_at
      })) || [];

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      let query = supabase
        .from('companies')
        .select(`
          id,
          name,
          website,
          is_claimed,
          created_at,
          categories(name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (companyFilter === 'claimed') {
        query = query.eq('is_claimed', true);
      } else if (companyFilter === 'unclaimed') {
        query = query.eq('is_claimed', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      const companiesWithCategory = data?.map(company => ({
        ...company,
        category_name: company.categories?.name || null
      })) || [];

      setCompanies(companiesWithCategory);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          title,
          body,
          overall_rating,
          status,
          is_anonymous,
          created_at,
          companies(name),
          profiles!reviews_profile_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (reviewFilter === 'published') {
        query = query.eq('status', 'published');
      } else if (reviewFilter === 'pending') {
        query = query.eq('status', 'pending_approval');
      } else if (reviewFilter === 'flagged') {
        query = query.eq('status', 'flagged_for_review');
      }

      const { data, error } = await query;

      if (error) throw error;

      const reviewsWithDetails = data?.map(review => ({
        ...review,
        company_name: review.companies?.name || 'Unknown Company',
        reviewer_name: review.is_anonymous 
          ? text[language].anonymous 
          : review.profiles 
            ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || text[language].anonymous
            : text[language].anonymous
      })) || [];

      setReviews(reviewsWithDetails);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('reports')
        .select(`
          id,
          review_id,
          reason,
          details,
          status,
          created_at,
          profiles!reports_reporter_profile_id_fkey(first_name, last_name),
          reviews(title, body, companies(name))
        `)
        .order('created_at', { ascending: false });

      // Apply filters based on the new Arabic status values
      if (reportFilter === 'accepted') {
        query = query.eq('status', 'مقبول');
      } else if (reportFilter === 'declined') {
        query = query.eq('status', 'مرفوض');
      }
      // For 'all', we don't add any status filter

      const { data, error } = await query;

      if (error) throw error;

      const reportsWithDetails = data?.map(report => ({
        ...report,
        reporter_name: report.profiles 
          ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() || text[language].anonymous
          : text[language].anonymous,
        review_title: report.reviews?.title || 'No title',
        review_body: report.reviews?.body || 'No content',
        company_name: report.reviews?.companies?.name || 'Unknown Company'
      })) || [];

      setReports(reportsWithDetails);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.error(text[language].selectFile);
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('bulk-upload-companies', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(data.message || text[language].uploadSuccess);
        setIsBulkUploadOpen(false);
        setSelectedFile(null);
        // Refresh companies data
        if (activeTab === 'companies') {
          fetchCompanies();
        }
        // Update stats
        fetchAdminStats();
      } else {
        throw new Error(data.error || text[language].uploadError);
      }
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error(error.message || text[language].uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  // Updated report action handlers with new Arabic status values
  const handleDismissReport = async (reportId: string) => {
    if (processingReports.has(reportId)) return;

    setProcessingReports(prev => new Set(prev).add(reportId));

    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'مرفوض' }) // Updated to Arabic "Declined"
        .eq('id', reportId);

      if (error) throw error;

      // Remove from current view if we're not showing all reports
      if (reportFilter !== 'all') {
        setReports(prev => prev.filter(report => report.id !== reportId));
      } else {
        // Update the status in the current view
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: 'مرفوض' }
            : report
        ));
      }

      // Update stats
      setStats(prev => ({ ...prev, pendingReports: Math.max(0, prev.pendingReports - 1) }));
      
      toast.success(text[language].actionSuccess);
    } catch (error: any) {
      console.error('Error dismissing report:', error);
      toast.error(text[language].actionError);
    } finally {
      setProcessingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleUpholdReport = async (report: Report) => {
    if (processingReports.has(report.id)) return;

    setProcessingReports(prev => new Set(prev).add(report.id));

    try {
      // Step A: Hide the original content (set review status to 'removed')
      const { error: reviewError } = await supabase
        .from('reviews')
        .update({ status: 'removed' })
        .eq('id', report.review_id);

      if (reviewError) throw reviewError;

      // Step B: Update the report status to 'مقبول' (Accepted in Arabic)
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'مقبول' }) // Updated to Arabic "Accepted"
        .eq('id', report.id);

      if (reportError) throw reportError;

      // Remove from current view if we're not showing all reports
      if (reportFilter !== 'all') {
        setReports(prev => prev.filter(r => r.id !== report.id));
      } else {
        // Update the status in the current view
        setReports(prev => prev.map(r => 
          r.id === report.id 
            ? { ...r, status: 'مقبول' }
            : r
        ));
      }

      // Update stats
      setStats(prev => ({ ...prev, pendingReports: Math.max(0, prev.pendingReports - 1) }));
      
      toast.success(text[language].actionSuccess);
    } catch (error: any) {
      console.error('Error upholding report:', error);
      toast.error(text[language].actionError);
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

  // Filter data based on search
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(companySearch.toLowerCase()) ||
    company.website?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredReviews = reviews.filter(review =>
    review.title?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    review.body?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    review.company_name?.toLowerCase().includes(reviewSearch.toLowerCase())
  );

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
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">{text[language].settings}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
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
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-dark-500 mb-2">
                    {text[language].users}
                  </h1>
                  <div className="w-16 h-1 bg-red-500 rounded-full"></div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
                    {/* Filter Buttons */}
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => setUserFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          userFilter === 'all'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].allUsers}
                      </button>
                      <button
                        onClick={() => setUserFilter('admin')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          userFilter === 'admin'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].adminUsers}
                      </button>
                      <button
                        onClick={() => setUserFilter('suspended')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          userFilter === 'suspended'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].suspendedUsers}
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder={text[language].searchUsers}
                        className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].email}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].name}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].role}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].status}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].joinDate}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                              {text[language].noDataAvailable}
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {`${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  user.is_admin 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.is_admin ? text[language].admin : text[language].user}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  user.is_suspended 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.is_suspended ? text[language].suspended : text[language].active}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(user.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2 rtl:space-x-reverse">
                                  <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button className="text-green-600 hover:text-green-900 transition-colors duration-200">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900 transition-colors duration-200">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Companies Tab */}
            {activeTab === 'companies' && (
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
                    className="flex items-center space-x-2 rtl:space-x-reverse bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{text[language].bulkUpload}</span>
                  </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
                    {/* Filter Buttons */}
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => setCompanyFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          companyFilter === 'all'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].allCompanies}
                      </button>
                      <button
                        onClick={() => setCompanyFilter('claimed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          companyFilter === 'claimed'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].claimedCompanies}
                      </button>
                      <button
                        onClick={() => setCompanyFilter('unclaimed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          companyFilter === 'unclaimed'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].unclaimedCompanies}
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder={text[language].searchCompanies}
                        className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].companyName}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].website}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].category}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].claimStatus}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].createdDate}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCompanies.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                              {text[language].noDataAvailable}
                            </td>
                          </tr>
                        ) : (
                          filteredCompanies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {company.name || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {company.website ? (
                                  <a 
                                    href={company.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    {company.website}
                                  </a>
                                ) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {company.category_name || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  company.is_claimed 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {company.is_claimed ? text[language].claimed : text[language].unclaimed}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(company.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2 rtl:space-x-reverse">
                                  <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button className="text-green-600 hover:text-green-900 transition-colors duration-200">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900 transition-colors duration-200">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-dark-500 mb-2">
                    {text[language].reviews}
                  </h1>
                  <div className="w-16 h-1 bg-red-500 rounded-full"></div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
                    {/* Filter Buttons */}
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => setReviewFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          reviewFilter === 'all'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].allReviews}
                      </button>
                      <button
                        onClick={() => setReviewFilter('published')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          reviewFilter === 'published'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].publishedReviews}
                      </button>
                      <button
                        onClick={() => setReviewFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          reviewFilter === 'pending'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].pendingReviews}
                      </button>
                      <button
                        onClick={() => setReviewFilter('flagged')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          reviewFilter === 'flagged'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {text[language].flaggedReviews}
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        placeholder={text[language].searchReviews}
                        className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </div>

                {/* Reviews Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reviewTitle}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reviewer}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].company}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].rating}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reviewStatus}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reviewDate}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReviews.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                              {text[language].noDataAvailable}
                            </td>
                          </tr>
                        ) : (
                          filteredReviews.map((review) => (
                            <tr key={review.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                <div className="truncate">
                                  {review.title || review.body?.substring(0, 50) + '...' || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {review.reviewer_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {review.company_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                  {renderStars(review.overall_rating)}
                                  <span className="text-sm text-gray-600 ml-2 rtl:mr-2 rtl:ml-0">
                                    {review.overall_rating || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  review.status === 'published' 
                                    ? 'bg-green-100 text-green-800'
                                    : review.status === 'pending_approval'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : review.status === 'flagged_for_review'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {review.status === 'published' 
                                    ? text[language].published
                                    : review.status === 'pending_approval'
                                    ? text[language].pending
                                    : review.status === 'flagged_for_review'
                                    ? text[language].flagged
                                    : text[language].removed
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(review.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2 rtl:space-x-reverse">
                                  <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button className="text-green-600 hover:text-green-900 transition-colors duration-200">
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900 transition-colors duration-200">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-dark-500 mb-2">
                    {text[language].reports}
                  </h1>
                  <div className="w-16 h-1 bg-red-500 rounded-full"></div>
                </div>

                {/* Report Filter Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => setReportFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        reportFilter === 'all'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {text[language].allReports}
                    </button>
                    <button
                      onClick={() => setReportFilter('accepted')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        reportFilter === 'accepted'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {text[language].acceptedReports}
                    </button>
                    <button
                      onClick={() => setReportFilter('declined')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        reportFilter === 'declined'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {text[language].declinedReports}
                    </button>
                  </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reportReason}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reporter}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reportedContent}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].company}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reportStatus}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reportDate}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                              {text[language].noDataAvailable}
                            </td>
                          </tr>
                        ) : (
                          reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="font-medium">{report.reason}</div>
                                {report.details && (
                                  <div className="text-gray-500 text-xs mt-1 max-w-xs truncate">
                                    {report.details}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {report.reporter_name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                <div className="font-medium truncate">
                                  {report.review_title}
                                </div>
                                <div className="text-gray-500 text-xs mt-1 truncate">
                                  {report.review_body}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {report.company_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  report.status === 'مقبول' 
                                    ? 'bg-green-100 text-green-800'
                                    : report.status === 'مرفوض'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {report.status === 'مقبول' 
                                    ? (language === 'ar' ? 'مقبول' : 'Accepted')
                                    : report.status === 'مرفوض'
                                    ? (language === 'ar' ? 'مرفوض' : 'Declined')
                                    : (language === 'ar' ? 'معلق' : 'Pending')
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(report.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {report.status === 'pending' && (
                                  <div className="flex space-x-2 rtl:space-x-reverse">
                                    <button
                                      onClick={() => handleDismissReport(report.id)}
                                      disabled={processingReports.has(report.id)}
                                      className="text-green-600 hover:text-green-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={text[language].dismissReport}
                                    >
                                      {processingReports.has(report.id) ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleUpholdReport(report)}
                                      disabled={processingReports.has(report.id)}
                                      className="text-red-600 hover:text-red-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={text[language].upholdReport}
                                    >
                                      {processingReports.has(report.id) ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                      ) : (
                                        <XCircle className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-dark-500 mb-2">
                    {text[language].systemSettings}
                  </h1>
                  <div className="w-16 h-1 bg-red-500 rounded-full"></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <p className="text-gray-600 text-center py-12">
                    {text[language].noDataAvailable}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-500">
                {text[language].bulkUploadTitle}
              </h2>
              <button
                onClick={() => setIsBulkUploadOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {text[language].csvInstructions}
                </p>
                <a
                  href="data:text/csv;charset=utf-8,name,logo_url,website,domain_name,category_name%0AExample Company,https://example.com/logo.png,https://example.com,example.com,خدمات الاستشارات العقارية"
                  download="companies_template.csv"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  {text[language].downloadTemplate}
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {text[language].selectCsvFile}
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isUploading}
                />
              </div>

              <div className="flex space-x-4 rtl:space-x-reverse">
                <button
                  onClick={() => setIsBulkUploadOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={isUploading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
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