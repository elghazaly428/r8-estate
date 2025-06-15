import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  FileText, 
  AlertTriangle, 
  Shield, 
  Trash2, 
  Ban, 
  Eye, 
  EyeOff,
  Plus,
  Edit,
  Save,
  X,
  CheckCircle,
  XCircle,
  Tag
} from 'lucide-react';
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

interface UserProfile {
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
}

interface FlaggedReview {
  id: number;
  title: string | null;
  body: string | null;
  status: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  companies: {
    name: string | null;
  } | null;
  report_count?: number;
}

interface FlaggedReply {
  id: string;
  reply_body: string | null;
  status: string;
  created_at: string;
  review_id: number;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  report_count?: number;
}

interface Category {
  id: number;
  name: string | null;
  description: string | null;
  created_at: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'reports' | 'categories'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });
  
  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([]);
  const [flaggedReplies, setFlaggedReplies] = useState<FlaggedReply[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Category form states
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);

  const text = {
    ar: {
      adminPanel: 'لوحة تحكم الأدمن',
      overview: 'نظرة عامة',
      companies: 'الشركات',
      users: 'المستخدمين',
      reports: 'البلاغات',
      categories: 'الفئات',
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToHome: 'العودة للرئيسية',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      status: 'الحالة',
      actions: 'الإجراءات',
      active: 'نشط',
      suspended: 'موقوف',
      admin: 'أدمن',
      suspendUser: 'إيقاف المستخدم',
      activateUser: 'تفعيل المستخدم',
      website: 'الموقع الإلكتروني',
      claimed: 'مطالب بها',
      unclaimed: 'غير مطالب بها',
      delete: 'حذف',
      reason: 'السبب',
      details: 'التفاصيل',
      reviewContent: 'محتوى التقييم',
      replyContent: 'محتوى الرد',
      reporter: 'المبلغ',
      dismissReport: 'رفض البلاغ',
      hideContent: 'إخفاء المحتوى',
      suspendAuthor: 'إيقاف الكاتب',
      description: 'الوصف',
      addCategory: 'إضافة فئة',
      editCategory: 'تعديل الفئة',
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      confirmDelete: 'هل أنت متأكد من الحذف؟',
      confirmSuspend: 'هل أنت متأكد من إيقاف هذا المستخدم؟',
      confirmActivate: 'هل أنت متأكد من تفعيل هذا المستخدم؟',
      success: 'تم بنجاح',
      error: 'حدث خطأ',
      processing: 'جاري المعالجة...',
      flaggedReviews: 'التقييمات المبلغ عنها',
      flaggedReplies: 'الردود المبلغ عنها',
      reports: 'بلاغ',
      company: 'الشركة',
      author: 'الكاتب',
      restoreContent: 'استعادة المحتوى',
      noFlaggedContent: 'لا يوجد محتوى مبلغ عنه'
    },
    en: {
      adminPanel: 'Admin Panel',
      overview: 'Overview',
      companies: 'Companies',
      users: 'Users',
      reports: 'Reports',
      categories: 'Categories',
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToHome: 'Back to Home',
      name: 'Name',
      email: 'Email',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      suspended: 'Suspended',
      admin: 'Admin',
      suspendUser: 'Suspend User',
      activateUser: 'Activate User',
      website: 'Website',
      claimed: 'Claimed',
      unclaimed: 'Unclaimed',
      delete: 'Delete',
      reason: 'Reason',
      details: 'Details',
      reviewContent: 'Review Content',
      replyContent: 'Reply Content',
      reporter: 'Reporter',
      dismissReport: 'Dismiss Report',
      hideContent: 'Hide Content',
      suspendAuthor: 'Suspend Author',
      description: 'Description',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      confirmDelete: 'Are you sure you want to delete this?',
      confirmSuspend: 'Are you sure you want to suspend this user?',
      confirmActivate: 'Are you sure you want to activate this user?',
      success: 'Success',
      error: 'Error occurred',
      processing: 'Processing...',
      flaggedReviews: 'Flagged Reviews',
      flaggedReplies: 'Flagged Replies',
      reports: 'reports',
      company: 'Company',
      author: 'Author',
      restoreContent: 'Restore Content',
      noFlaggedContent: 'No flagged content'
    }
  };

  // Check admin access and fetch initial data
  useEffect(() => {
    const checkAccessAndFetchData = async () => {
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
          onNavigate('home');
          return;
        }

        // Fetch dashboard stats
        await fetchStats();
        await fetchAllData();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        onNavigate('home');
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchData();
  }, [user, authLoading, onNavigate]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchStats = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total companies count
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Get total reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Get flagged content count (reviews + replies)
      const { count: flaggedReviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'flagged_for_review');

      const { count: flaggedRepliesCount } = await supabase
        .from('company_replies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'flagged_for_review');

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: (flaggedReviewsCount || 0) + (flaggedRepliesCount || 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch users using the edge function
      await fetchUsers();

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch flagged reviews
      const { data: flaggedReviewsData, error: flaggedReviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey(first_name, last_name),
          companies!reviews_company_id_fkey(name)
        `)
        .eq('status', 'flagged_for_review')
        .order('created_at', { ascending: false });

      if (flaggedReviewsError) throw flaggedReviewsError;

      // Get report counts for each flagged review
      const reviewsWithCounts = await Promise.all(
        (flaggedReviewsData || []).map(async (review) => {
          const { count } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id)
            .eq('status', 'pending');

          return {
            ...review,
            report_count: count || 0
          };
        })
      );

      setFlaggedReviews(reviewsWithCounts);

      // Fetch flagged replies - Fixed to use explicit foreign key reference
      const { data: flaggedRepliesData, error: flaggedRepliesError } = await supabase
        .from('company_replies')
        .select(`
          *,
          profiles!company_repl_profile_id_fkey(first_name, last_name)
        `)
        .eq('status', 'flagged_for_review')
        .order('created_at', { ascending: false });

      if (flaggedRepliesError) throw flaggedRepliesError;

      // Get report counts for each flagged reply
      const repliesWithCounts = await Promise.all(
        (flaggedRepliesData || []).map(async (reply) => {
          const { count } = await supabase
            .from('reply_reports')
            .select('*', { count: 'exact', head: true })
            .eq('reply_id', reply.id)
            .eq('status', 'pending');

          return {
            ...reply,
            report_count: count || 0
          };
        })
      );

      setFlaggedReplies(repliesWithCounts);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setToast({ message: text[language].error, type: 'error' });
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    if (!confirm(suspend ? text[language].confirmSuspend : text[language].confirmActivate)) {
      return;
    }

    setProcessing(userId);
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

      setToast({ message: text[language].success, type: 'success' });
    } catch (error: any) {
      console.error('Error updating user:', error);
      setToast({ message: text[language].error, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteCompany = async (companyId: number) => {
    if (!confirm(text[language].confirmDelete)) {
      return;
    }

    setProcessing(companyId.toString());
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      // Update local state
      setCompanies(prev => prev.filter(company => company.id !== companyId));
      setToast({ message: text[language].success, type: 'success' });
    } catch (error: any) {
      console.error('Error deleting company:', error);
      setToast({ message: text[language].error, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReviewAction = async (reviewId: number, action: 'restore' | 'hide') => {
    setProcessing(`review-${reviewId}`);
    try {
      const newStatus = action === 'restore' ? 'published' : 'removed';
      
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      // Remove from flagged list if restored or hidden
      setFlaggedReviews(prev => prev.filter(review => review.id !== reviewId));
      setToast({ message: text[language].success, type: 'success' });
    } catch (error: any) {
      console.error('Error handling review:', error);
      setToast({ message: text[language].error, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReplyAction = async (replyId: string, action: 'restore' | 'hide') => {
    setProcessing(`reply-${replyId}`);
    try {
      const newStatus = action === 'restore' ? 'published' : 'removed';
      
      const { error } = await supabase
        .from('company_replies')
        .update({ status: newStatus })
        .eq('id', replyId);

      if (error) throw error;

      // Remove from flagged list if restored or hidden
      setFlaggedReplies(prev => prev.filter(reply => reply.id !== replyId));
      setToast({ message: text[language].success, type: 'success' });
    } catch (error: any) {
      console.error('Error handling reply:', error);
      setToast({ message: text[language].error, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    setProcessing('add-category');
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
      setToast({ message: text[language].success, type: 'success' });
    } catch (error: any) {
      console.error('Error adding category:', error);
      setToast({ message: text[language].error, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateCategory = async (categoryId: number, name: string, description: string) => {
    setProcessing(categoryId.toString());
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: name.trim(),
          description: description.trim() || null
        })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, name: name.trim(), description: description.trim() || null }
          : cat
      ));

      setEditingCategory(null);
      setToast({ message: text[language].success, type: 'success' });
    } catch (error: any) {
      console.error('Error updating category:', error);
      setToast({ message: text[language].error, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm(text[language].confirmDelete)) {
      return;
    }

    setProcessing(categoryId.toString());
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setToast({ message: text[language].success, type: 'success' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setToast({ message: text[language].error, type: 'error' });
    } finally {
      setProcessing(null);
    }
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
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalReviews}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].name}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].email}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].status}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {user.is_admin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {text[language].admin}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_suspended 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_suspended ? text[language].suspended : text[language].active}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!user.is_admin && (
                      <button
                        onClick={() => handleSuspendUser(user.id, !user.is_suspended)}
                        disabled={processing === user.id}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white transition-colors duration-200 ${
                          user.is_suspended
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-50`}
                      >
                        {processing === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : user.is_suspended ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                            {text[language].activateUser}
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                            {text[language].suspendUser}
                          </>
                        )}
                      </button>
                    )}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].name}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].website}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].status}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {company.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {company.website}
                        </a>
                      ) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.is_claimed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.is_claimed ? text[language].claimed : text[language].unclaimed}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      disabled={processing === company.id.toString()}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {processing === company.id.toString() ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                          {text[language].delete}
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Reports View - Updated to show flagged content
  const ReportsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reports}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Flagged Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-dark-500">{text[language].flaggedReviews}</h2>
        
        {flaggedReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-dark-500">{text[language].reviewContent}</h3>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    {review.report_count} {text[language].reports}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  {review.title && (
                    <h4 className="font-semibold mb-2">{review.title}</h4>
                  )}
                  <p className="text-gray-700 mb-2">{review.body}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-dark-500 mb-4">Details</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">{text[language].company}:</span> {review.companies?.name || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{text[language].author}:</span> {
                      review.profiles 
                        ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim()
                        : 'Anonymous'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => handleReviewAction(review.id, 'restore')}
                disabled={processing === `review-${review.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                {processing === `review-${review.id}` ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {text[language].restoreContent}
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleReviewAction(review.id, 'hide')}
                disabled={processing === `review-${review.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {text[language].hideContent}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Flagged Replies Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-dark-500">{text[language].flaggedReplies}</h2>
        
        {flaggedReplies.map((reply) => (
          <div key={reply.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-dark-500">{text[language].replyContent}</h3>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    {reply.report_count} {text[language].reports}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700">{reply.reply_body}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-dark-500 mb-4">Details</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">{text[language].author}:</span> {
                      reply.profiles 
                        ? `${reply.profiles.first_name || ''} ${reply.profiles.last_name || ''}`.trim()
                        : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => handleReplyAction(reply.id, 'restore')}
                disabled={processing === `reply-${reply.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                {processing === `reply-${reply.id}` ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {text[language].restoreContent}
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleReplyAction(reply.id, 'hide')}
                disabled={processing === `reply-${reply.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {text[language].hideContent}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No flagged content */}
      {flaggedReviews.length === 0 && flaggedReplies.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-500 text-lg">{text[language].noFlaggedContent}</p>
        </div>
      )}
    </div>
  );

  // Categories View
  const CategoriesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-500 mb-2">
            {text[language].categories}
          </h1>
          <div className="w-16 h-1 bg-red-500 rounded-full"></div>
        </div>
        
        <button
          onClick={() => setShowAddCategory(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {text[language].addCategory}
        </button>
      </div>

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-dark-500 mb-4">{text[language].addCategory}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {text[language].name}
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {text[language].description}
              </label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={handleAddCategory}
                disabled={processing === 'add-category' || !newCategory.name.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
              >
                {processing === 'add-category' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {text[language].save}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory({ name: '', description: '' });
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <X className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {text[language].cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {editingCategory === category.id ? (
              <CategoryEditForm 
                category={category}
                onSave={(name, description) => handleUpdateCategory(category.id, name, description)}
                onCancel={() => setEditingCategory(null)}
                processing={processing === category.id.toString()}
                text={text[language]}
                language={language}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-dark-500 mb-2">
                    {category.name || 'Unnamed Category'}
                  </h3>
                  <p className="text-gray-600">
                    {category.description || 'No description'}
                  </p>
                </div>
                <div className="flex space-x-3 rtl:space-x-reverse">
                  <button
                    onClick={() => setEditingCategory(category.id)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                    {text[language].edit}
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={processing === category.id.toString()}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {processing === category.id.toString() ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {text[language].delete}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Category Edit Form Component
  const CategoryEditForm: React.FC<{
    category: Category;
    onSave: (name: string, description: string) => void;
    onCancel: () => void;
    processing: boolean;
    text: any;
    language: 'ar' | 'en';
  }> = ({ category, onSave, onCancel, processing, text, language }) => {
    const [name, setName] = useState(category.name || '');
    const [description, setDescription] = useState(category.description || '');

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {text.name}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {text.description}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => onSave(name, description)}
            disabled={processing || !name.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {text.save}
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <X className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {text.cancel}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 rtl:left-4 rtl:right-auto z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center space-x-2 rtl:space-x-reverse animate-slide-up`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6">
                <Shield className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-bold text-dark-500">{text[language].adminPanel}</h2>
              </div>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-5 w-5" />
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
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{text[language].reports}</span>
                  {stats.pendingReports > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2 rtl:mr-2 rtl:ml-0">
                      {stats.pendingReports}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'categories'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Tag className="h-5 w-5" />
                  <span className="font-medium">{text[language].categories}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'companies' && <CompaniesView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'categories' && <CategoriesView />}
          </div>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;