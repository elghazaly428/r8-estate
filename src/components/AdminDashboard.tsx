import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Flag, 
  MessageSquare, 
  TrendingUp, 
  Search,
  Filter,
  ChevronDown,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Save
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

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalReviews: number;
  pendingReports: number;
}

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  updated_at: string;
}

interface Company {
  id: number;
  name: string | null;
  logo_url: string | null;
  website: string | null;
  location: string | null;
  is_claimed: boolean | null;
  created_at: string;
  categories: {
    name: string | null;
  } | null;
}

interface Report {
  id: number;
  reason: string | null;
  status: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  reviews: {
    title: string | null;
    companies: {
      name: string | null;
    } | null;
  } | null;
}

interface Review {
  id: number;
  title: string | null;
  overall_rating: number | null;
  status: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  companies: {
    name: string | null;
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: ''
  });
  
  // File upload state
  const [uploading, setUploading] = useState(false);

  const text = {
    ar: {
      // Navigation
      overview: 'نظرة عامة',
      users: 'المستخدمين',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      
      // Overview
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      
      // Users
      searchUsers: 'البحث في المستخدمين...',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      status: 'الحالة',
      lastUpdated: 'آخر تحديث',
      actions: 'الإجراءات',
      admin: 'مدير',
      user: 'مستخدم',
      active: 'نشط',
      suspended: 'موقوف',
      edit: 'تعديل',
      suspend: 'إيقاف',
      unsuspend: 'إلغاء الإيقاف',
      editUser: 'تعديل المستخدم',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      confirmSuspend: 'هل أنت متأكد من إيقاف هذا المستخدم؟',
      confirmUnsuspend: 'هل أنت متأكد من إلغاء إيقاف هذا المستخدم؟',
      userUpdated: 'تم تحديث المستخدم بنجاح',
      userSuspended: 'تم إيقاف المستخدم بنجاح',
      userUnsuspended: 'تم إلغاء إيقاف المستخدم بنجاح',
      
      // Companies
      searchCompanies: 'البحث في الشركات...',
      companyName: 'اسم الشركة',
      category: 'الفئة',
      website: 'الموقع الإلكتروني',
      location: 'الموقع',
      claimed: 'مطالب بها',
      createdDate: 'تاريخ الإنشاء',
      yes: 'نعم',
      no: 'لا',
      bulkUpload: 'رفع مجمع',
      uploadCSV: 'رفع ملف CSV',
      
      // Reports
      filterByStatus: 'تصفية حسب الحالة',
      all: 'الكل',
      received: 'مستلم',
      reviewed: 'تمت المراجعة',
      resolved: 'محلول',
      reporter: 'المبلغ',
      reason: 'السبب',
      reviewReported: 'التقييم المبلغ عنه',
      reportStatus: 'حالة البلاغ',
      reportDate: 'تاريخ البلاغ',
      
      // Reviews
      author: 'الكاتب',
      company: 'الشركة',
      reviewTitle: 'عنوان التقييم',
      rating: 'التقييم',
      createdDate: 'تاريخ الإنشاء',
      published: 'منشور',
      hidden: 'مخفي',
      deleted: 'محذوف',
      hide: 'إخفاء',
      unhide: 'إظهار',
      delete: 'حذف',
      confirmHide: 'هل أنت متأكد من إخفاء هذا التقييم؟',
      confirmUnhide: 'هل أنت متأكد من إظهار هذا التقييم؟',
      confirmDelete: 'هل أنت متأكد من حذف هذا التقييم؟ اكتب "DELETE" للتأكيد:',
      typeDelete: 'اكتب DELETE للتأكيد',
      reviewHidden: 'تم إخفاء التقييم بنجاح',
      reviewUnhidden: 'تم إظهار التقييم بنجاح',
      reviewDeleted: 'تم حذف التقييم بنجاح',
      
      // Common
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      errorOccurred: 'حدث خطأ',
      noData: 'لا توجد بيانات',
      anonymous: 'مجهول'
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
      
      // Users
      searchUsers: 'Search users...',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      lastUpdated: 'Last Updated',
      actions: 'Actions',
      admin: 'Admin',
      user: 'User',
      active: 'Active',
      suspended: 'Suspended',
      edit: 'Edit',
      suspend: 'Suspend',
      unsuspend: 'Unsuspend',
      editUser: 'Edit User',
      firstName: 'First Name',
      lastName: 'Last Name',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      confirmSuspend: 'Are you sure you want to suspend this user?',
      confirmUnsuspend: 'Are you sure you want to unsuspend this user?',
      userUpdated: 'User updated successfully',
      userSuspended: 'User suspended successfully',
      userUnsuspended: 'User unsuspended successfully',
      
      // Companies
      searchCompanies: 'Search companies...',
      companyName: 'Company Name',
      category: 'Category',
      website: 'Website',
      location: 'Location',
      claimed: 'Claimed',
      createdDate: 'Created Date',
      yes: 'Yes',
      no: 'No',
      bulkUpload: 'Bulk Upload',
      uploadCSV: 'Upload CSV',
      
      // Reports
      filterByStatus: 'Filter by Status',
      all: 'All',
      received: 'Received',
      reviewed: 'Reviewed',
      resolved: 'Resolved',
      reporter: 'Reporter',
      reason: 'Reason',
      reviewReported: 'Review Reported',
      reportStatus: 'Report Status',
      reportDate: 'Report Date',
      
      // Reviews
      author: 'Author',
      company: 'Company',
      reviewTitle: 'Review Title',
      rating: 'Rating',
      createdDate: 'Created Date',
      published: 'Published',
      hidden: 'Hidden',
      deleted: 'Deleted',
      hide: 'Hide',
      unhide: 'Unhide',
      delete: 'Delete',
      confirmHide: 'Are you sure you want to hide this review?',
      confirmUnhide: 'Are you sure you want to unhide this review?',
      confirmDelete: 'Are you sure you want to delete this review? Type "DELETE" to confirm:',
      typeDelete: 'Type DELETE to confirm',
      reviewHidden: 'Review hidden successfully',
      reviewUnhidden: 'Review unhidden successfully',
      reviewDeleted: 'Review deleted successfully',
      
      // Common
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      errorOccurred: 'An error occurred',
      noData: 'No data available',
      anonymous: 'Anonymous'
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

        setIsAdmin(true);
        await fetchDashboardData();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [usersCount, companiesCount, reviewsCount, reportsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'received')
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalCompanies: companiesCount.count || 0,
        totalReviews: reviewsCount.count || 0,
        pendingReports: reportsCount.count || 0
      });

      // Fetch detailed data
      await Promise.all([
        fetchUsers(),
        fetchCompanies(),
        fetchReports(),
        fetchReviews()
      ]);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles!reports_reporter_profile_id_fkey(first_name, last_name),
          reviews!reports_review_id_fkey(title, companies!reviews_company_id_fkey(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey(first_name, last_name),
          companies!reviews_company_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      firstName: user.first_name || '',
      lastName: user.last_name || ''
    });
    setShowEditUserModal(true);
  };

  const handleSaveUserChanges = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editUserForm.firstName.trim(),
          last_name: editUserForm.lastName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              first_name: editUserForm.firstName.trim(),
              last_name: editUserForm.lastName.trim(),
              updated_at: new Date().toISOString()
            }
          : user
      ));

      setShowEditUserModal(false);
      setEditingUser(null);
      toast.success(text[language].userUpdated);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    const confirmMessage = suspend ? text[language].confirmSuspend : text[language].confirmUnsuspend;
    
    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: suspend,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_suspended: suspend,
              updated_at: new Date().toISOString()
            }
          : user
      ));

      toast.success(suspend ? text[language].userSuspended : text[language].userUnsuspended);
    } catch (error: any) {
      console.error('Error updating user suspension:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleHideReview = async (reviewId: number) => {
    if (!confirm(text[language].confirmHide)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'hidden' })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'hidden' } : review
      ));

      toast.success(text[language].reviewHidden);
    } catch (error: any) {
      console.error('Error hiding review:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleUnhideReview = async (reviewId: number) => {
    if (!confirm(text[language].confirmUnhide)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'published' })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'published' } : review
      ));

      toast.success(text[language].reviewUnhidden);
    } catch (error: any) {
      console.error('Error unhiding review:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleDeleteReview = async () => {
    if (deleteConfirmText !== 'DELETE' || !reviewToDelete) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'deleted' })
        .eq('id', reviewToDelete);

      if (error) throw error;

      setReviews(prev => prev.map(review => 
        review.id === reviewToDelete ? { ...review, status: 'deleted' } : review
      ));

      setShowDeleteModal(false);
      setDeleteConfirmText('');
      setReviewToDelete(null);
      toast.success(text[language].reviewDeleted);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-upload-companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully uploaded ${result.data?.length || 0} companies`);
        await fetchCompanies();
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return '-';
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const searchTerm = userSearchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    return fullName.includes(searchTerm) || email.includes(searchTerm);
  });

  const filteredCompanies = companies.filter(company => {
    const searchTerm = companySearchQuery.toLowerCase();
    const name = company.name?.toLowerCase() || '';
    const location = company.location?.toLowerCase() || '';
    return name.includes(searchTerm) || location.includes(searchTerm);
  });

  const filteredReports = reports.filter(report => {
    if (reportStatusFilter === 'all') return true;
    return report.status === reportStatusFilter;
  });

  const filteredReviews = reviews.filter(review => {
    if (reviewStatusFilter === 'all') return true;
    return review.status === reviewStatusFilter;
  });

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

  if (error || !isAdmin) {
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
            <AlertTriangle className="h-5 w-5 text-orange-500" />
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder={text[language].searchUsers}
              className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].name}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].email}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].role}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].status}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].lastUpdated}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary-500" />
                      </div>
                      <span className="font-medium text-dark-500">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : text[language].anonymous
                        }
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {user.email || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_admin 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.is_admin ? text[language].admin : text[language].user}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_suspended 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.is_suspended ? text[language].suspended : text[language].active}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(user.updated_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                      >
                        <Edit className="h-3 w-3" />
                        <span>{text[language].edit}</span>
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user.id, !user.is_suspended)}
                        className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg transition-colors duration-200 text-sm ${
                          user.is_suspended
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        {user.is_suspended ? (
                          <>
                            <UserCheck className="h-3 w-3" />
                            <span>{text[language].unsuspend}</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" />
                            <span>{text[language].suspend}</span>
                          </>
                        )}
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

  // Companies View
  const CompaniesView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].companies}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={companySearchQuery}
              onChange={(e) => setCompanySearchQuery(e.target.value)}
              placeholder={text[language].searchCompanies}
              className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <label className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200">
              <Upload className="h-4 w-4" />
              <span>{uploading ? text[language].loading : text[language].bulkUpload}</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].companyName}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].category}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].website}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].location}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].claimed}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].createdDate}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Building2 className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <span className="font-medium text-dark-500">
                        {company.name || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {company.categories?.name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {company.website ? (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                      >
                        {text[language].website}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {company.location || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.is_claimed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.is_claimed ? text[language].yes : text[language].no}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <div className="relative max-w-xs">
            <select
              value={reviewStatusFilter}
              onChange={(e) => setReviewStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">{text[language].all}</option>
              <option value="published">{text[language].published}</option>
              <option value="hidden">{text[language].hidden}</option>
              <option value="deleted">{text[language].deleted}</option>
            </select>
            <ChevronDown className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].author}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].company}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].reviewTitle}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].rating}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].status}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].createdDate}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-dark-500">
                      {review.profiles 
                        ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || text[language].anonymous
                        : text[language].anonymous
                      }
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {review.companies?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {review.title || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {renderStars(review.overall_rating)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      review.status === 'published' 
                        ? 'bg-green-100 text-green-800'
                        : review.status === 'hidden'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {review.status === 'published' 
                        ? text[language].published
                        : review.status === 'hidden'
                        ? text[language].hidden
                        : text[language].deleted
                      }
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {review.status === 'published' && (
                        <button
                          onClick={() => handleHideReview(review.id)}
                          className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 text-sm"
                        >
                          <EyeOff className="h-3 w-3" />
                          <span>{text[language].hide}</span>
                        </button>
                      )}
                      {review.status === 'hidden' && (
                        <button
                          onClick={() => handleUnhideReview(review.id)}
                          className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                        >
                          <Eye className="h-3 w-3" />
                          <span>{text[language].unhide}</span>
                        </button>
                      )}
                      {review.status !== 'deleted' && (
                        <button
                          onClick={() => {
                            setReviewToDelete(review.id);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{text[language].delete}</span>
                        </button>
                      )}
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

  // Reports View
  const ReportsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reports}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <div className="relative max-w-xs">
            <select
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">{text[language].all}</option>
              <option value="received">{text[language].received}</option>
              <option value="reviewed">{text[language].reviewed}</option>
              <option value="resolved">{text[language].resolved}</option>
            </select>
            <ChevronDown className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].reporter}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].reason}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].reviewReported}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].reportStatus}
                </th>
                <th className="text-right rtl:text-right ltr:text-left py-3 px-4 font-semibold text-dark-500">
                  {text[language].reportDate}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-dark-500">
                      {report.profiles 
                        ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() || text[language].anonymous
                        : text[language].anonymous
                      }
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {report.reason || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {report.reviews?.title || '-'}
                    {report.reviews?.companies?.name && (
                      <div className="text-sm text-gray-500">
                        {report.reviews.companies.name}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'received' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : report.status === 'reviewed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {report.status === 'received' 
                        ? text[language].received
                        : report.status === 'reviewed'
                        ? text[language].reviewed
                        : text[language].resolved
                      }
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(report.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'companies' && <CompaniesView />}
            {activeTab === 'reviews' && <ReviewsView />}
            {activeTab === 'reports' && <ReportsView />}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {text[language].editUser}
              </h3>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].firstName}
                </label>
                <input
                  type="text"
                  value={editUserForm.firstName}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].lastName}
                </label>
                <input
                  type="text"
                  value={editUserForm.lastName}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleSaveUserChanges}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <Save className="h-4 w-4" />
                  <span>{text[language].saveChanges}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Review Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {text[language].confirmDelete}
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setReviewToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700 font-medium">
                    {text[language].typeDelete}
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                dir="ltr"
              />

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setReviewToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleDeleteReview}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{text[language].delete}</span>
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