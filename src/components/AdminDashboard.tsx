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
  ChevronDown,
  Edit,
  UserX,
  UserCheck,
  User,
  X,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle
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

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
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
  location: string | null;
  is_claimed: boolean | null;
  created_at: string;
}

interface ReviewData {
  id: number;
  title: string | null;
  body: string | null;
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

interface ReportData {
  id: number;
  review_id: number | null;
  reason: string | null;
  details: string | null;
  status: string | null;
  created_at: string;
  reviews: {
    id: number;
    title: string | null;
    companies: {
      name: string | null;
    } | null;
  } | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'companies' | 'reviews' | 'reports'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  
  // Filter states
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'suspended' | 'regular'>('all');
  const [companyFilter, setCompanyFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'published' | 'hidden' | 'deleted'>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: ''
  });

  const text = {
    ar: {
      adminDashboard: 'لوحة تحكم الأدمن',
      users: 'المستخدمين',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      search: 'البحث...',
      filter: 'تصفية',
      all: 'الكل',
      admin: 'أدمن',
      suspended: 'موقوف',
      regular: 'عادي',
      claimed: 'مطالب بها',
      unclaimed: 'غير مطالب بها',
      published: 'منشور',
      hidden: 'مخفي',
      deleted: 'محذوف',
      pending: 'في الانتظار',
      reviewed: 'تمت المراجعة',
      resolved: 'تم الحل',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      status: 'الحالة',
      createdAt: 'تاريخ الإنشاء',
      actions: 'الإجراءات',
      edit: 'تعديل',
      suspend: 'إيقاف',
      unsuspend: 'إلغاء الإيقاف',
      delete: 'حذف',
      hide: 'إخفاء',
      unhide: 'إظهار',
      view: 'عرض',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      editUser: 'تعديل المستخدم',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      confirmSuspend: 'هل أنت متأكد من إيقاف هذا المستخدم؟',
      confirmUnsuspend: 'هل أنت متأكد من إلغاء إيقاف هذا المستخدم؟',
      confirmHide: 'هل أنت متأكد من إخفاء هذا التقييم؟',
      confirmUnhide: 'هل أنت متأكد من إظهار هذا التقييم؟',
      confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
      typeDeleteToConfirm: 'اكتب "DELETE" للتأكيد',
      userUpdated: 'تم تحديث المستخدم بنجاح',
      userSuspended: 'تم إيقاف المستخدم بنجاح',
      userUnsuspended: 'تم إلغاء إيقاف المستخدم بنجاح',
      reviewHidden: 'تم إخفاء التقييم بنجاح',
      reviewUnhidden: 'تم إظهار التقييم بنجاح',
      reviewDeleted: 'تم حذف التقييم بنجاح',
      errorOccurred: 'حدث خطأ',
      author: 'الكاتب',
      company: 'الشركة',
      reviewTitle: 'عنوان التقييم',
      rating: 'التقييم',
      reason: 'السبب',
      reporter: 'المبلغ',
      reportedContent: 'المحتوى المبلغ عنه',
      dismiss: 'رفض',
      upholdAndHide: 'قبول وإخفاء',
      confirmDismissReport: 'هل أنت متأكد من رفض هذا البلاغ؟',
      confirmUpholdReport: 'هل أنت متأكد من قبول هذا البلاغ وإخفاء المحتوى؟',
      reportDismissed: 'تم رفض البلاغ بنجاح',
      reportUpheld: 'تم قبول البلاغ وإخفاء المحتوى بنجاح'
    },
    en: {
      adminDashboard: 'Admin Dashboard',
      users: 'Users',
      companies: 'Companies',
      reviews: 'Reviews',
      reports: 'Reports',
      search: 'Search...',
      filter: 'Filter',
      all: 'All',
      admin: 'Admin',
      suspended: 'Suspended',
      regular: 'Regular',
      claimed: 'Claimed',
      unclaimed: 'Unclaimed',
      published: 'Published',
      hidden: 'Hidden',
      deleted: 'Deleted',
      pending: 'Pending',
      reviewed: 'Reviewed',
      resolved: 'Resolved',
      name: 'Name',
      email: 'Email',
      status: 'Status',
      createdAt: 'Created At',
      actions: 'Actions',
      edit: 'Edit',
      suspend: 'Suspend',
      unsuspend: 'Unsuspend',
      delete: 'Delete',
      hide: 'Hide',
      unhide: 'Unhide',
      view: 'View',
      loading: 'Loading...',
      noData: 'No data available',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      editUser: 'Edit User',
      firstName: 'First Name',
      lastName: 'Last Name',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      confirmSuspend: 'Are you sure you want to suspend this user?',
      confirmUnsuspend: 'Are you sure you want to unsuspend this user?',
      confirmHide: 'Are you sure you want to hide this review?',
      confirmUnhide: 'Are you sure you want to unhide this review?',
      confirmDelete: 'Are you sure you want to delete this item?',
      typeDeleteToConfirm: 'Type "DELETE" to confirm',
      userUpdated: 'User updated successfully',
      userSuspended: 'User suspended successfully',
      userUnsuspended: 'User unsuspended successfully',
      reviewHidden: 'Review hidden successfully',
      reviewUnhidden: 'Review unhidden successfully',
      reviewDeleted: 'Review deleted successfully',
      errorOccurred: 'An error occurred',
      author: 'Author',
      company: 'Company',
      reviewTitle: 'Review Title',
      rating: 'Rating',
      reason: 'Reason',
      reporter: 'Reporter',
      reportedContent: 'Reported Content',
      dismiss: 'Dismiss',
      upholdAndHide: 'Uphold & Hide',
      confirmDismissReport: 'Are you sure you want to dismiss this report?',
      confirmUpholdReport: 'Are you sure you want to uphold this report and hide the content?',
      reportDismissed: 'Report dismissed successfully',
      reportUpheld: 'Report upheld and content hidden successfully'
    }
  };

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        onNavigate('login');
        return;
      }

      try {
        setLoading(true);
        
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

        // Fetch all data
        await Promise.all([
          fetchUsers(),
          fetchCompanies(),
          fetchReviews(),
          fetchReports()
        ]);
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
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

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles!reports_reporter_profile_id_fkey(first_name, last_name),
          reviews!reports_review_id_fkey(
            id,
            title,
            companies!reviews_company_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserForm({
      firstName: user.first_name || '',
      lastName: user.last_name || ''
    });
    setShowEditUserModal(true);
  };

  const handleSaveUser = async () => {
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
          ? { ...user, first_name: editUserForm.firstName.trim(), last_name: editUserForm.lastName.trim() }
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
        .update({ is_suspended: suspend })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_suspended: suspend } : user
      ));

      toast.success(suspend ? text[language].userSuspended : text[language].userUnsuspended);
    } catch (error: any) {
      console.error('Error updating user suspension:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleReviewAction = async (reviewId: number, action: 'hide' | 'unhide' | 'delete') => {
    let confirmMessage = '';
    let newStatus = '';
    let successMessage = '';

    switch (action) {
      case 'hide':
        confirmMessage = text[language].confirmHide;
        newStatus = 'hidden';
        successMessage = text[language].reviewHidden;
        break;
      case 'unhide':
        confirmMessage = text[language].confirmUnhide;
        newStatus = 'published';
        successMessage = text[language].reviewUnhidden;
        break;
      case 'delete':
        confirmMessage = text[language].confirmDelete;
        const deleteConfirm = prompt(text[language].typeDeleteToConfirm);
        if (deleteConfirm !== 'DELETE') return;
        newStatus = 'deleted';
        successMessage = text[language].reviewDeleted;
        break;
    }

    if (action !== 'delete' && !confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: newStatus } : review
      ));

      toast.success(successMessage);
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleDismissReport = async (report: ReportData) => {
    if (!confirm(text[language].confirmDismissReport)) return;

    try {
      // Update all reports for this content to 'declined'
      const { error } = await supabase
        .from('reports')
        .update({ status: 'declined' })
        .eq('review_id', report.review_id);

      if (error) throw error;

      // Update local state
      setReports(prev => prev.map(r => 
        r.review_id === report.review_id ? { ...r, status: 'declined' } : r
      ));

      toast.success(text[language].reportDismissed);
    } catch (error: any) {
      console.error('Error dismissing report:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const handleUpholdReport = async (report: ReportData) => {
    if (!confirm(text[language].confirmUpholdReport)) return;

    try {
      // First, hide the original content
      if (report.review_id) {
        const { error: reviewError } = await supabase
          .from('reviews')
          .update({ status: 'hidden' })
          .eq('id', report.review_id);

        if (reviewError) throw reviewError;

        // Update local reviews state
        setReviews(prev => prev.map(review => 
          review.id === report.review_id ? { ...review, status: 'hidden' } : review
        ));
      }

      // Then, update all reports for this content to 'accepted'
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'accepted' })
        .eq('review_id', report.review_id);

      if (reportError) throw reportError;

      // Update local reports state
      setReports(prev => prev.map(r => 
        r.review_id === report.review_id ? { ...r, status: 'accepted' } : r
      ));

      toast.success(text[language].reportUpheld);
    } catch (error: any) {
      console.error('Error upholding report:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const getStatusBadge = (status: string | boolean | null, type: 'user' | 'company' | 'review' | 'report') => {
    let color = 'bg-gray-100 text-gray-800';
    let text = '';

    if (type === 'user') {
      if (status === true) {
        color = 'bg-red-100 text-red-800';
        text = language === 'ar' ? 'موقوف' : 'Suspended';
      } else {
        color = 'bg-green-100 text-green-800';
        text = language === 'ar' ? 'نشط' : 'Active';
      }
    } else if (type === 'company') {
      if (status === true) {
        color = 'bg-blue-100 text-blue-800';
        text = language === 'ar' ? 'مطالب بها' : 'Claimed';
      } else {
        color = 'bg-gray-100 text-gray-800';
        text = language === 'ar' ? 'غير مطالب بها' : 'Unclaimed';
      }
    } else if (type === 'review') {
      switch (status) {
        case 'published':
          color = 'bg-green-100 text-green-800';
          text = language === 'ar' ? 'منشور' : 'Published';
          break;
        case 'hidden':
          color = 'bg-yellow-100 text-yellow-800';
          text = language === 'ar' ? 'مخفي' : 'Hidden';
          break;
        case 'deleted':
          color = 'bg-red-100 text-red-800';
          text = language === 'ar' ? 'محذوف' : 'Deleted';
          break;
        default:
          color = 'bg-gray-100 text-gray-800';
          text = language === 'ar' ? 'غير معروف' : 'Unknown';
      }
    } else if (type === 'report') {
      switch (status) {
        case 'pending':
        case 'received':
          color = 'bg-yellow-100 text-yellow-800';
          text = language === 'ar' ? 'في الانتظار' : 'Pending';
          break;
        case 'reviewed':
          color = 'bg-blue-100 text-blue-800';
          text = language === 'ar' ? 'تمت المراجعة' : 'Reviewed';
          break;
        case 'resolved':
          color = 'bg-green-100 text-green-800';
          text = language === 'ar' ? 'تم الحل' : 'Resolved';
          break;
        case 'accepted':
          color = 'bg-red-100 text-red-800';
          text = language === 'ar' ? 'مقبول' : 'Accepted';
          break;
        case 'declined':
          color = 'bg-gray-100 text-gray-800';
          text = language === 'ar' ? 'مرفوض' : 'Declined';
          break;
        default:
          color = 'bg-gray-100 text-gray-800';
          text = language === 'ar' ? 'غير معروف' : 'Unknown';
      }
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return '-';
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-500' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = userFilter === 'all' ||
      (userFilter === 'admin' && user.is_admin) ||
      (userFilter === 'suspended' && user.is_suspended) ||
      (userFilter === 'regular' && !user.is_admin && !user.is_suspended);

    return matchesSearch && matchesFilter;
  });

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchQuery || 
      company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.website?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = companyFilter === 'all' ||
      (companyFilter === 'claimed' && company.is_claimed) ||
      (companyFilter === 'unclaimed' && !company.is_claimed);

    return matchesSearch && matchesFilter;
  });

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchQuery || 
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = reviewFilter === 'all' || review.status === reviewFilter;

    return matchesSearch && matchesFilter;
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchQuery || 
      report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.details?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = false;
    if (reportFilter === 'all') {
      matchesFilter = true;
    } else if (reportFilter === 'pending') {
      matchesFilter = report.status === 'pending' || report.status === 'received';
    } else {
      matchesFilter = report.status === reportFilter;
    }

    return matchesSearch && matchesFilter;
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <Shield className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-dark-500">
              {text[language].adminDashboard}
            </h1>
          </div>
          <div className="w-16 h-1 bg-red-500 rounded-full"></div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            {[
              { key: 'users', label: text[language].users, icon: Users },
              { key: 'companies', label: text[language].companies, icon: Building2 },
              { key: 'reviews', label: text[language].reviews, icon: MessageSquare },
              { key: 'reports', label: text[language].reports, icon: Flag }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-6 py-4 font-medium transition-colors duration-200 ${
                  activeTab === key
                    ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                    : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Search and Filter Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={text[language].search}
                  className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={
                    activeTab === 'users' ? userFilter :
                    activeTab === 'companies' ? companyFilter :
                    activeTab === 'reviews' ? reviewFilter :
                    reportFilter
                  }
                  onChange={(e) => {
                    if (activeTab === 'users') setUserFilter(e.target.value as any);
                    else if (activeTab === 'companies') setCompanyFilter(e.target.value as any);
                    else if (activeTab === 'reviews') setReviewFilter(e.target.value as any);
                    else setReportFilter(e.target.value as any);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 rtl:pl-8 rtl:pr-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                >
                  <option value="all">{text[language].all}</option>
                  {activeTab === 'users' && (
                    <>
                      <option value="admin">{text[language].admin}</option>
                      <option value="suspended">{text[language].suspended}</option>
                      <option value="regular">{text[language].regular}</option>
                    </>
                  )}
                  {activeTab === 'companies' && (
                    <>
                      <option value="claimed">{text[language].claimed}</option>
                      <option value="unclaimed">{text[language].unclaimed}</option>
                    </>
                  )}
                  {activeTab === 'reviews' && (
                    <>
                      <option value="published">{text[language].published}</option>
                      <option value="hidden">{text[language].hidden}</option>
                      <option value="deleted">{text[language].deleted}</option>
                    </>
                  )}
                  {activeTab === 'reports' && (
                    <>
                      <option value="pending">{text[language].pending}</option>
                      <option value="reviewed">{text[language].reviewed}</option>
                      <option value="resolved">{text[language].resolved}</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].name}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].email}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].status}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].createdAt}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            {/* User Avatar */}
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt="User Avatar" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to default icon if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <User className={`h-5 w-5 text-gray-400 ${user.avatar_url ? 'hidden' : ''}`} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.first_name || user.last_name 
                                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                  : 'No Name'
                                }
                              </div>
                              {user.is_admin && (
                                <div className="text-xs text-red-600 font-medium">Admin</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{user.email || '-'}</td>
                        <td className="py-4 px-4">{getStatusBadge(user.is_suspended, 'user')}</td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(user.updated_at)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex items-center space-x-1 rtl:space-x-reverse bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                            >
                              <Edit className="h-3 w-3" />
                              <span>{text[language].edit}</span>
                            </button>
                            <button
                              onClick={() => handleSuspendUser(user.id, !user.is_suspended)}
                              className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded text-sm transition-colors duration-200 ${
                                user.is_suspended
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white'
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
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {text[language].noData}
                  </div>
                )}
              </div>
            )}

            {/* Companies Tab */}
            {activeTab === 'companies' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].name}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Website</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].status}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].createdAt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((company) => (
                      <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                              {company.logo_url ? (
                                <img 
                                  src={company.logo_url} 
                                  alt="Company Logo" 
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                '🏢'
                              )}
                            </div>
                            <span className="font-medium text-gray-900">{company.name || 'No Name'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{company.website || '-'}</td>
                        <td className="py-4 px-4 text-gray-600">{company.location || '-'}</td>
                        <td className="py-4 px-4">{getStatusBadge(company.is_claimed, 'company')}</td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(company.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCompanies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {text[language].noData}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].author}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].company}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].reviewTitle}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].rating}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].status}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].createdAt}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((review) => (
                      <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-600">
                          {review.profiles 
                            ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || 'Anonymous'
                            : 'Anonymous'
                          }
                        </td>
                        <td className="py-4 px-4 text-gray-600">{review.companies?.name || '-'}</td>
                        <td className="py-4 px-4">
                          <div className="max-w-xs truncate" title={review.title || review.body || ''}>
                            {review.title || review.body || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">{renderStars(review.overall_rating)}</td>
                        <td className="py-4 px-4">{getStatusBadge(review.status, 'review')}</td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(review.created_at)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {review.status === 'published' && (
                              <button
                                onClick={() => handleReviewAction(review.id, 'hide')}
                                className="flex items-center space-x-1 rtl:space-x-reverse bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                              >
                                <EyeOff className="h-3 w-3" />
                                <span>{text[language].hide}</span>
                              </button>
                            )}
                            {review.status === 'hidden' && (
                              <button
                                onClick={() => handleReviewAction(review.id, 'unhide')}
                                className="flex items-center space-x-1 rtl:space-x-reverse bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                              >
                                <Eye className="h-3 w-3" />
                                <span>{text[language].unhide}</span>
                              </button>
                            )}
                            {review.status !== 'deleted' && (
                              <button
                                onClick={() => handleReviewAction(review.id, 'delete')}
                                className="flex items-center space-x-1 rtl:space-x-reverse bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
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
                {filteredReviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {text[language].noData}
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].reporter}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].reportedContent}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].reason}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].status}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].createdAt}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-600">
                          {report.profiles 
                            ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() || 'Anonymous'
                            : 'Anonymous'
                          }
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {report.reviews?.title || report.reviews?.companies?.name || '-'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="max-w-xs truncate" title={report.reason || ''}>
                            {report.reason || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(report.status, 'report')}</td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(report.created_at)}</td>
                        <td className="py-4 px-4">
                          {/* Only show action buttons for pending reports */}
                          {(report.status === 'pending' || report.status === 'received') && (
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              {/* Dismiss Report Button (Green ✓) */}
                              <button
                                onClick={() => handleDismissReport(report)}
                                className="flex items-center space-x-1 rtl:space-x-reverse bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                                title={text[language].dismiss}
                              >
                                <Check className="h-3 w-3" />
                                <span>{text[language].dismiss}</span>
                              </button>
                              
                              {/* Uphold & Hide Report Button (Red ✗) */}
                              <button
                                onClick={() => handleUpholdReport(report)}
                                className="flex items-center space-x-1 rtl:space-x-reverse bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                                title={text[language].upholdAndHide}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                <span>{text[language].upholdAndHide}</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredReports.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {text[language].noData}
                  </div>
                )}
              </div>
            )}
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
                onClick={() => setShowEditUserModal(false)}
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
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleSaveUser}
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

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;